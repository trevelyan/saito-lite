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
    this.outputs_hmap 		      = [];

    return this;
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
}

module.exports = Wallet;








