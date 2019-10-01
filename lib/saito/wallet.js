'use strict';

const saito = require('./saito');
const Big      = require('big.js');

/**
 * Mempool Constructor
 * @param {*} app
 */
class Wallet {

  constructor(app) {

    if (!(this instanceof Wallet)) {
      return new Wallet(app);
    }

    this.app     			= app || {};

    this.wallet			= {};
    this.wallet.balance 		= 0;
    this.wallet.publickey 	= "";
    this.wallet.privatekey 	= "";

    this.wallet.inputs                = [];
    this.wallet.outputs               = [];
    this.wallet.spends                = [];	// spent but still around
    this.wallet.default_fee           = 2;
    this.wallet.version               = 2.17;
    this.wallet.pending               = [];       // sent but not seen

    this.inputs_hmap 		      = [];
    this.inputs_hmap_counter		= 0;
    this.inputs_hmap_counter_limit	= 10000;
    this.outputs_hmap 		      = [];
    this.outputs_hmap_counter		= 0;
    this.outputs_hmap_counter_limit	= 10000;

    this.recreate_pending_transactions = 0;

    return this;
  }


  addInput(x) {

    //////////////
    // add slip //
    //////////////
    //
    // we keep our slip array sorted according to block_id
    // so that we can (1) spend the earliest slips first,
    // and (2) simplify deleting expired slips
    //
    let pos = this.wallet.inputs.length;
    while (pos > 0 && this.wallet.inputs[pos-1].bid > x.bid) { pos--; }
    if (pos == -1) { pos = 0; }

    this.wallet.inputs.splice(pos, 0, x);
    this.wallet.spends.splice(pos, 0, 0);

    let hmi = x.returnSignatureSource(x);
    this.inputs_hmap[hmi] = 1;
    this.inputs_hmap_counter++;


    ////////////////////////
    // regenerate hashmap //
    ////////////////////////
    //
    // we want to periodically re-generate our hashmaps
    // that help us check if inputs and outputs are already
    // in our wallet for memory-management reasons and
    // to maintain reasonable accuracy.
    //
    if (this.inputs_hmap_counter > this.inputs_hmap_counter_limit) {

      this.inputs_hmap = [];
      this.outputs_hmap = [];
      this.inputs_hmap_counter = 0;
      this.outputs_hmap_counter = 0;

      for (let i = 0; i < this.wallet.inputs.length; i++) {
        let hmi = this.wallet.inputs[i].returnSignatureSource();
        this.inputs_hmap[hmi] = 1;
      }

      for (let i = 0; i < this.wallet.outputs.length; i++) {
        let hmi = this.wallet.outputs[i].returnSignatureSource();
        this.outputs_hmap[hmi] = 1;
      }
    }
    return;
  }



  addOutput(x) {

    //////////////
    // add slip //
    //////////////
    this.wallet.outputs.push(x);
    let hmi = x.returnIndex();
    this.outputs_hmap[hmi] = 1;
    this.outputs_hmap_counter++;

    ///////////////////////
    // purge old outputs //
    ///////////////////////
    if (this.output_hmap_counter >= this.output_hmap_counter_limit) {
      console.log("Deleting Excessive outputs from heavy-spend wallet...");
      this.wallet.output.splice(0, this.wallet.output.length-this.output_storage_limit);
      this.output_storage_counter = 0;
    }
    return;

  }



  containsUtxi(s) {
    let hmi = s.returnSignatureSource();
    if (this.inputs_hmap[hmi] == 1) { return true; }
    return false;
  }


  containsUtxo(s) {
    let hmi = s.returnSignatureSource();
    if (this.outputs_hmap[hmi] == 1) { return true; }
    return false;
  }





  doesSlipInPendingTransactionsSpendBlockHash(bsh="") {
    if (bsh == "") { return false; }
    for (let i = 0; i < this.wallet.pending.length; i++) {
      let ptx = new saito.transaction(this.wallet.pending[i]);
      for (let k = 0; k < ptx.transaction.from.length; k++) {
        if (ptx.transaction.from[k].bsh == bsh) {
          return true;
        }
      }
    }
    return false;
  }




  initialize(app) {

    if (this.wallet.privatekey == "") {

      if (this.app.options.wallet != null) {

        /////////////
        // upgrade //
        /////////////
        if (this.app.options.wallet.version < this.wallet.version) {

          if (this.app.BROWSER == 1) {

            this.app.options.wallet.version = this.wallet.version;

            let tmpprivkey = this.app.options.wallet.privatekey;
            let tmppubkey = this.app.options.wallet.publickey;
            let tmpid = this.app.options.wallet.identifier;

            // specify before reset to avoid archives reset problem
            this.wallet.publickey = tmppubkey;
            this.wallet.privatekey = tmpprivkey;
            this.wallet.identifier = tmpid;

            // reset and save
            this.app.storage.resetOptions();
            this.app.storage.saveOptions();

            // re-specify after reset
            this.wallet.publickey = tmppubkey;
            this.wallet.privatekey = tmpprivkey;
            this.wallet.identifier = tmpid;

            this.app.options.wallet = this.wallet;
            this.saveWallet();

            //
            // TODO: reimplement resetting archives
            //
            this.app.archives.resetArchives();

            // reset blockchain
            this.app.options.blockchain.last_bid = "";
            this.app.options.blockchain.last_hash = "";
            this.app.options.blockchain.last_ts = "";

            alert("Saito Upgrade: Wallet Reset");

          }
        }
        this.wallet = Object.assign(this.wallet, this.app.options.wallet);
      }

      ////////////////
      // new wallet //
      ////////////////
      if (this.wallet.privatekey == "") {
        this.wallet.privatekey            = this.app.crypto.generateKeys();
        this.wallet.publickey             = this.app.crypto.returnPublicKey(this.wallet.privatekey);
      }
    }


    //////////////////
    // import slips //
    //////////////////
    this.wallet.spends = []
    if (this.app.options.wallet != null) {

      if (this.app.options.wallet.inputs != null) {
        for (let i = 0; i < this.app.options.wallet.inputs.length; i++) {
          this.wallet.inputs[i] = new saito.slip(
            this.app.options.wallet.inputs[i].add,
            this.app.options.wallet.inputs[i].amt,
            this.app.options.wallet.inputs[i].type,
            this.app.options.wallet.inputs[i].bid,
            this.app.options.wallet.inputs[i].tid,
            this.app.options.wallet.inputs[i].sid,
            this.app.options.wallet.inputs[i].bsh,
            this.app.options.wallet.inputs[i].lc,
            this.app.options.wallet.inputs[i].rn
          );
          this.wallet.spends.push(0);

          ////////////////////
          // update hashmap //
          ////////////////////
          let hmi = this.wallet.inputs[i].returnSignatureSource();
          this.inputs_hmap[hmi] = 1;
          this.inputs_hmap_counter++;

        }
      }
      if (this.app.options.wallet.outputs != null) {
        for (let i = 0; i < this.app.options.wallet.outputs.length; i++) {
          this.wallet.outputs[i] = new saito.slip(
            this.app.options.wallet.outputs[i].add,
            this.app.options.wallet.outputs[i].amt,
            this.app.options.wallet.outputs[i].type,
            this.app.options.wallet.outputs[i].bid,
            this.app.options.wallet.outputs[i].tid,
            this.app.options.wallet.outputs[i].sid,
            this.app.options.wallet.outputs[i].bsh,
            this.app.options.wallet.outputs[i].lc,
            this.app.options.wallet.outputs[i].rn
          );


          ////////////////////
          // update hashmap //
          ////////////////////
          let hmi = this.wallet.outputs[i].returnSignatureSource();
          this.outputs_hmap[hmi] = 1;
          this.outputs_hmap_counter++;

        }
      }
    }


    //
    // check pending transactions and update spent slips
    //
    for (let z = 0; z < this.wallet.pending.length; z++) {
      let ptx = new saito.transaction(this.wallet.pending[z]);

      for (let y = 0; y < ptx.transaction.from.length; y++) {

        let spent_slip = ptx.transaction.from[y];

        let ptx_bsh = spent_slip.bsh;
        let ptx_bid = spent_slip.bid;
        let ptx_tid = spent_slip.tid;
        let ptx_sid = spent_slip.sid;

        for (let x = 0; x < this.wallet.inputs.length; x++) {
          if (this.wallet.inputs[x].bid == ptx_bid) {
            if (this.wallet.inputs[x].tid == ptx_tid) {
              if (this.wallet.inputs[x].sid == ptx_sid) {
                if (this.wallet.inputs[x].bsh == ptx_bsh) {
      let d = new Date().getTime();
  console.log("\n\n\nWE ARE UPDATING OUR PENDING SLIP so it is spent: " + d);
  console.log(JSON.stringify(this.wallet.pending[z]));
                  this.wallet.spends[x] = 1;
                  x = this.wallet.inputs.length;
                }
              }
            }
          }
        }
      }
    }


    //
    // re-implement
    //
    this.purgeExpiredSlips();
    this.updateBalance();
    this.saveWallet();

  }



  purgeExpiredSlips() {

    let gid = this.app.blockchain.genesis_bid;
    for (let m = this.wallet.inputs.length-1; m >= 0; m--) {
      if (this.wallet.inputs[m].bid < gid) {
        this.wallet.inputs.splice(m, 1);
        this.wallet.spends.splice(m, 1);
      }
    }
    for (let m = this.wallet.outputs.length-1; m >= 0; m--) {
      if (this.wallet.outputs[m].bid < gid) {
        this.wallet.outputs.splice(m, 1);
      }
    }
  }


  resetExistingSlips(bid, bsh, lc) {

    for (let m = this.wallet.inputs.length-1; m >= 0; m--) {
      if (this.wallet.inputs[m].bid == bid && this.wallet.inputs[m].bsh == bsh) {
        this.wallet.inputs[m].lc = lc;
      }
      else {
        if (this.wallet.inputs[m].bid < block_id) {
          return;
        }
      }
    }
  }

  resetSpentInputs(bid=0) {
    if (bid == 0) {
      for (let i = 0; i < this.wallet.inputs.length; i++) {
        if (this.isSlipInPendingTransactions(this.wallet.inputs[i]) == false) {
          this.wallet.spends[i] = 0;
        }
      }
    } else {
      let target_bid = this.app.blockchain.returnLatestBlockId() - bid;
      for (let i = 0; i < this.wallet.inputs.length; i++) {
        if (this.wallet.inputs[i].bid <= target_bid) {
          if (this.isSlipInPendingTransactions(this.wallet.inputs[i]) == false) {
            this.wallet.spends[i] = 0;
          }
        }
      }
    }
  }



  returnBalance() {
    return this.wallet.balance;
  }

  returnPrivateKey() {
    return this.wallet.privatekey;
  }
  returnPublicKey() {
    return this.wallet.publickey;
  }

  saveWallet() {
    this.app.options.wallet = this.wallet;
    this.app.storage.saveOptions();
  }


  signMessage(msg) {
    return this.app.crypto.signMessage(msg, this.returnPrivateKey());
  }

  signTransaction(tx) {
    if (tx == null) { return null; }
    for (var i = 0; i < tx.transaction.to.length; i++) { tx.transaction.to[i].sid = i; }
    tx.transaction.sig = tx.returnSignature(this.app);
    return tx;

  }


  updateBalance() {

    let b = Big(0.0);
    let minid = this.app.blockchain.last_bid - this.app.blockchain.genesis_period + 1;
    for (let x = 0; x < this.wallet.inputs.length; x++) {
      let s = this.wallet.inputs[x];
      if (s.lc == 1 && s.bid >= minid) {
        b = b.plus(Big(s.amt));
      }
    }

    //
    // TODO - how are we updating module balance
    //
    //this.app.modules.updateBalance();
  }

  /**
   * create a transaction with the appropriate slips given
   * the desired fee and payment to associate with the
   * transaction, and a change address to receive any
   * surplus tokens. Use the default wallet fee.
   *
   * @param {string} recipient publickey
   * @param {decimal} fee to send with tx
   *
   * @returns {saito.transaction} if successful
   * @returns {null} if inadequate inputs
   **/
  createUnsignedTransactionWithDefaultFee(publickey, amt = 0.0) {
    // TODO: fix hardcoding
    //return this.createUnsignedTransaction(publickey, amt, this.returnDefaultFee());
    return this.createUnsignedTransaction(publickey, amt, 2.0);
  }

  createUnsignedTransaction(publickey, amt = 0.0, fee = 0.0) {

    var tx           = new saito.transaction();
    var total_fees   = Big(amt).plus(Big(fee));
    var wallet_avail = Big(this.returnBalance());

    //
    // check to-address is ok -- this just keeps a server
    // that receives an invalid address from forking off
    // the main chain because it creates its own invalid
    // transaction.
    //
    // this is not strictly necessary, but useful for the demo
    // server during testnet, which produces a majority of
    // blocks.
    //
    if (!this.app.crypto.isPublicKey(publickey)) {
      console.log("trying to send message to invalid address");
      return null;
    }


    if (total_fees.gt(wallet_avail)) {
      return null;
    }


    //
    // zero-fee transactions have fake inputs
    //
    if (total_fees == 0.0) {
      tx.transaction.from = [];
      tx.transaction.from.push(new saito.slip(this.returnPublicKey()));
    } else {
      tx.transaction.from = this.returnAdequateInputs(total_fees);
    }
    tx.transaction.ts   = new Date().getTime();
    tx.transaction.to.push(new saito.slip(publickey, amt));

    // specify that this is a normal transaction
    tx.transaction.to[tx.transaction.to.length-1].type = 0;
    if (tx.transaction.from == null) {
      return null;
    }

    // add change input
    var total_inputs = Big(0.0);
    for (let ii = 0; ii < tx.transaction.from.length; ii++) {
      total_inputs = total_inputs.plus(Big(tx.transaction.from[ii].amt));
    }

    //
    // generate change address(es)
    //
    var change_amount = total_inputs.minus(total_fees);

    if (Big(change_amount).gt(0)) {

      //
      // if we do not have many slips left, generate a few extra inputs
      //
      if (this.wallet.inputs.length < 8) {

        //
        // split change address
        //
        // this prevents some usability issues with APPS
        // by making sure there are usually at least 3
        // utxo available for spending.
        //
        let half_change_amount = change_amount.div(2);

        tx.transaction.to.push(new saito.slip(this.returnPublicKey(), half_change_amount.toFixed(8)));
        tx.transaction.to[tx.transaction.to.length-1].type = 0;
        tx.transaction.to.push(new saito.slip(this.returnPublicKey(), change_amount.minus(half_change_amount).toFixed(8)));
        tx.transaction.to[tx.transaction.to.length-1].type = 0;

      } else {

        //
        // single change address
        //
        tx.transaction.to.push(new saito.slip(this.returnPublicKey(), change_amount.toFixed(8)));
        tx.transaction.to[tx.transaction.to.length-1].type = 0;
      }
    }


    //
    // we save here so that we don't create another transaction
    // with the same inputs after broadcasting on reload
    //
    this.saveWallet();

    return tx;

  }
}

module.exports = Wallet;








