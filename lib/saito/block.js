'use strict';

const saito = require('./saito');
const Big = require('big.js');


class Block {

  constructor(app, blkjson = "", txsjson = "", confirmations = -1) {

    this.app = app || {};

    //
    // consensus variables
    //
    this.block 		        = {};
    this.block.ts 	      = new Date().getTime();
    this.block.prevhash 	= "";
    this.block.merkle 	  = "";
    this.block.creator 	  = "";
    this.block.id 	      = 1;
    this.block.bf 	      = 0;
    this.block.difficulty = 0.0;
    this.block.paysplit 	= 0.5;
    this.block.powsplit 	= 0.5;
    this.block.treasury 	= Big("2868100000.0");
                            // TODO
                            // fix initial treasury amount based on allocation of tokens
    this.block.stakepool  = Big("0");
    this.block.coinbase 	= Big("0.0");
    this.block.reclaimed 	= Big("0.0");
    this.block.sr 	      = 0;			// 0 - staking table not refreshed
                                    // 1 - staking table refreshed

    //
    // block transactions
    //
    this.transactions = [];



    //
    // non-consensus variables
    //
    this.maxtid 		= 0;
    this.mintid 		= 0;
    this.avgfee 		= 0;

    this.size_in_bytes 	= 0;           // size of block in bytes
    this.hash 		= "";          // block hash == hash(this.prehash+last_block.hash)
    this.prehash 		= "";          // hash of signature
    this.filename 	= "";          // name of file on disk if set

    this.confirmations = confirmations;

    this.is_valid = 1;           // set to zero if there is an


    //
    // import block headers
    //
    if (blkjson != "") {
      try {
        if (typeof blkjson === 'string') {
          this.block = JSON.parse(blkjson.toString("utf8"));
        } else {
          this.block = blkjson;
        }
      } catch (err) {
        this.is_valid = 0;
        return;
      }
    }

    //
    // import transactions
    //
    if (txsjson != "") {
      try {
        if (typeof txsjson === 'string') {
          let txs = JSON.parse(txsjson.toString("utf8"));
          for (var i = 0; i < txs.length; i++) {
            this.transactions[i] = new saito.transaction(txs[i]);
            if (!this.transactions[i].is_valid) {
              this.is_valid = 0;
              return;
            }
          }
        }
      } catch (err) {
        this.is_valid = 0;
        return;
      }
    }


    //
    // min/max ids //
    //
    if (this.transactions.length > 0) {
      if (this.transactions.length > 0) {
        this.mintid = this.transactions[0].transaction.id;
        this.maxtid = this.transactions[this.transactions.length - 1].transaction.id;
      }
    }

    return this;
  }

  bundle(prevblk=null) {

    //
    // default values
    //
    if (prevblk != null) {
      this.block.id 		= prevblk.block.id + 1;
      this.block.treasury 	= Big(prevblk.block.treasury).plus(Big(prevblk.block.reclaimed));
      this.block.coinbase 	= Big(this.block.treasury).div(this.app.blockchain.genesis_period).toFixed(8);
      this.block.treasury 	= this.block.treasury.minus(Big(this.block.coinbase)).toFixed(8);
      this.block.prevhash 	= prevblk.returnHash();
      this.block.difficulty = prevblk.block.difficulty;
      this.block.paysplit 	= prevblk.block.paysplit;
      this.block.powsplit 	= prevblk.block.powsplit;
      this.block.ts		= new Date().getTime();
      this.block.bf 		= this.app.burnfee.returnBurnFee(prevblk, this);
    }

    return this;
  }

  containsGoldenTicket() {
    for (let i = 0; i < this.transactions.length; i++) {
      if (this.transactions[i].isGoldenTicket() == 1) {
        return 1;
      }
    }
    return 0;
  }

  decryptTransactions() {
    for (let i = 0; i < this.transactions.length; i++) {
      if (this.transactions[i].involvesPublicKey(this.app.wallet.returnPublicKey()) == 1) {
        this.transactions[i].decryptMessage(this.app);
      }
    }
  }

  returnFilename() {
    return this.block.ts + "-" + this.returnHash() + ".blk";
  }

  returnRoutingWorkNeeded() {
    return this.block.bf.current;
  }

  returnCoinbase() {
    return this.block.coinbase;
  }

  returnDifficulty() {
    return this.block.difficulty;
  }

  returnEmbeddedRoutingWork() {

    let v = Big(0);

    for (let i = 0; i < this.transactions.length; i++) {
      if (this.transactions[i].is_valid == 1) {
        let available_work = Big(this.transactions[i].returnRoutingWorkAvailable(this.app, this.block.creator));
        if (this.transactions[i].transaction.type == 1) {
          if (this.transactions[i].transaction.msg.target != this.prevhash) { available_work = Big(0); }
        }
        v = v.plus(available_work);
      }
    }
    return v.toFixed(8);
  }


  returnHash() {
    if (this.hash != "") { return this.hash; }
    this.prehash = this.app.crypto.hash(this.returnFingerprint());
    this.hash = this.app.crypto.hash(this.prehash + this.block.prevhash);
    return this.hash;
  }

  returnId() {
    return this.block.id;
  }

  returnMaxTxId() {
    if (this.maxtid != 0) { return this.maxtid; }
    for (var z = 0; z < this.transactions.length; z++) {
      if (this.transactions[z].transaction.id > this.maxtid) {
        this.maxtid = this.transactions[z].transaction.id;
      }
    }
    return this.maxtid;
  }

  returnMinTxId() {
    if (this.mintid != 0) { return this.mintid; }
    if (this.transactions.length == 0) { return this.app.blockchain.returnMinTxId(); };
    this.mintid = this.transactions[0].transaction.id;
    for (var z = 1; z < this.transactions.length; z++) {
      if (this.transactions[z].transaction.id < this.mintid) {
        this.mintid = this.transactions[z].transaction.id;
      }
    }
    return this.mintid;
  }

  returnPaysplit() {
    return this.block.paysplit;
  }

  returnPowsplit() {
    return this.block.powsplit;
  }

  returnReclaimed() {
    return this.block.reclaimed;
  }

  returnFingerprint() {
    return JSON.stringify(this.block);
  };

  returnTreasury() {
    return this.block.treasury;
  }

  spendInputs() {
    for (let b = 0; b < this.transactions.length; b++) {
      for (let bb = 0; bb < this.transactions[b].transaction.from.length; bb++) {
        if (this.transactions[b].transaction.from[bb].amt > 0) {
          this.app.shashmap.insert_slip(this.transactions[b].transaction.from[bb].returnSignatureSource(), this.block.id);
        }
      }
    }
    return 1;
  }

  unspendInputs() {
    for (let b = 0; b < this.transactions.length; b++) {
      for (let bb = 0; bb < this.transactions[b].transaction.from.length; bb++) {
        if (this.transactions[b].transaction.from[bb].amt > 0) {
          this.app.shashmap.insert_slip(this.transactions[b].transaction.from[bb].returnSignatureSource(), -1);
        }
      }
    }
    return 1;
  }

  returnAvailableFees(publickey = "") {
    if (publickey == "") { publickey = this.app.wallet.returnPublicKey(); }

    let v = Big(0);
    for (let i = 0; i < this.transactions.length; i++) {
      v = v.plus(Big(this.transactions[i].returnFeesUsable(this.app, publickey)));
    }
    return v.toFixed(8);
  }

  returnTotalFees() {
    let v = Big(0);
    for (let i = 0; i < this.transactions.length; i++) {
      v = v.plus(Big(this.transactions[i].returnTotalFees(this.app, this.block.creator)));
    }
    return v.toFixed(8);
  }

  updateConfirmations(num) { if (num > this.confirmations) { this.confirmations = num; } }

}

module.exports = Block;


/******

Block.prototype.bundle = async function bundle(prevblk = null) {

  //
  // set default values
  //
  if (prevblk != null) {

    this.block.id = prevblk.block.id + 1;
    this.block.treasury = Big(prevblk.block.treasury).plus(Big(prevblk.block.reclaimed));
    this.block.coinbase = Big(this.block.treasury).div(this.app.blockchain.genesis_period).toFixed(8);
    this.block.treasury = this.block.treasury.minus(Big(this.block.coinbase)).toFixed(8);
    this.block.prevhash = prevblk.returnHash();
    this.block.difficulty = prevblk.block.difficulty;
    this.block.paysplit = prevblk.block.paysplit;

  }

  //
  // update burn fee
  //
  this.block.bf = this.app.burnfee.adjustBurnFee(prevblk, this);
  if (this.block.bf == null) { this.block.bf = {}; }

  //
  // this calculates the amount of tokens that
  // are unspent and cannot be rebroadcast in
  // the block that will fall off the chain when
  // we add this to the head of the chain.
  //
  // reclaimed = how many tokens to add to our
  // treasury (next block) because they will disappear
  // (when we add this block).
  //
  let reclaimed = await this.calculateReclaimedFunds();
  this.block.reclaimed = reclaimed.reclaimed;


  //
  // automatic transaction rebroadcasting
  //
  let rebroadcast_txarray = await this.calculateRebroadcastTransactions();

  let rebroadcast_amt = Big(0.0);
  for (let m = 0; m < rebroadcast_txarray.length; m++) {
    for (let n = 0; n < rebroadcast_txarray[m].transaction.to.length; n++) {
      rebroadcast_amt = rebroadcast_amt.plus(Big(rebroadcast_txarray[m].transaction.to[n].amt));
    }
  }

//console.log("\n\nCALCULATE REBROADCAST TXS: " + rebroadcast_amt.toFixed(8));
//console.log(JSON.stringify(rebroadcast_txarray));
// console.log("\n\n");

  for (let i = 0; i < rebroadcast_txarray.length; i++) {
    this.transactions.push(rebroadcast_txarray[i]);
  }


  //
  // sequential ids and stringify
  //
  let starting_id = 1;
  if (prevblk != null) { starting_id = prevblk.returnMaxTxId() + 1; }
  for (let i = 0; i < this.transactions.length; i++) {
    this.transactions[i].transaction.id = (starting_id + i);
    this.block.txsjson.push(this.transactions[i].stringify(1));  // 1 = escape dbl quotes

    //
    // sanity check on
    //
    if (this.transactions[i].transaction.type == 1) {
      if (this.transactions[i].transaction.msg.target != prevblk.returnHash()) {
	this.is_valid = 0;
	return;
      }
    }

  }


  //
  // add tx merkle root
  //
  if (this.block.txsjson.length > 0) {

    let tx_strings = [];
    for (let z = 0; z < this.transactions.length; z++) {
      tx_strings[z] = this.transactions[z].returnMessageSignatureSource(this.app);
    }

    let mt = this.app.crypto.returnMerkleTree(tx_strings);
    this.block.merkle = mt.root;

  }


  //
  // update difficulty and paysplit if golden ticket exists
  //
  if (prevblk != null) {
    for (let i = 0; i < this.transactions.length; i++) {
      if (this.transactions[i].isGoldenTicket() == 1) {
        let golden = new saito.goldenticket(this.app, JSON.stringify(this.transactions[i].transaction.msg));
        this.block.difficulty = golden.calculateDifficulty(prevblk);
        this.block.paysplit = golden.calculatePaysplit(prevblk);
      }
    }
  }


  //
  // bloom filters
  //
  this.transactions_bloom_hmap = [];
  for (let i = 0; i < this.transactions.length; i++) {
    for (let ii = 0; ii < this.transactions[i].transaction.from.length; ii++) {
      this.transactions_bloom_hmap[this.transactions[i].transaction.from[ii].add] = 1;
    }
    for (let ii = 0; ii < this.transactions[i].transaction.to.length; ii++) {
      this.transactions_bloom_hmap[this.transactions[i].transaction.to[ii].add] = 1;
    }
  }

  //
  // temporary response to memory issues with BloomFilter class - we are replacing
  // with a hashmap and can return to the bloom filter once we have a more robust
  // solution that will not crash a long-running server.
  //
  //  this.transactions_bloom = BloomFilter.create(this.transactions_bloom_n,  this.transactions_bloom_err);
  //  for (let i = 0; i < this.transactions.length; i++) {
  //    for (let ii = 0; ii < this.transactions[i].transaction.from.length; ii++) {
  //      this.transactions_bloom.insert(new Buffer(this.transactions[i].transaction.from[ii].add, 'utf8'));
  //    }
  //    for (let ii = 0; ii < this.transactions[i].transaction.to.length; ii++) {
  //      this.transactions_bloom.insert(new Buffer(this.transactions[i].transaction.to[ii].add, 'utf8'));
  //    }
  //  }


  // and let us know
  return true;

}


Block.prototype.calculateRebroadcastTransactions = async function calculateRebroadcastTransactions() {

  let txarray = [];

  if (this.app.BROWSER == 1 || this.app.SPVMODE == 1) { return []; }

  var eliminated_block_id = this.returnId() - this.app.blockchain.returnGenesisPeriod() - 1;
  var goldenticket_block_id = eliminated_block_id + 1;
  //
  // if no blocks to eliminate, return 0.0 and confirm valid
  //

  if (eliminated_block_id < 1) { return []; }

  //
  // otherwise, load the relevant blocks
  //
  var eblk = await this.app.storage.loadSingleBlockFromDiskById(eliminated_block_id);
  var gblk = await this.app.storage.loadSingleBlockFromDiskById(goldenticket_block_id);

  var unspent_amt = Big(0.0);

  for (var i = 0; i < eblk.transactions.length; i++) {

    //
    // the TO slips are the ones that may or may
    // not have been spent, so we check to see if
    // they are spent using our hashmap.
    //
    for (var ii = 0; ii < eblk.transactions[i].transaction.to.length; ii++) {

      var slip = eblk.transactions[i].transaction.to[ii];
      slip.bid = eblk.returnId();
      slip.tid = eblk.transactions[i].transaction.id;
      slip.bhash = eblk.returnHash();
      slip.sid = ii;

      if (Big(slip.amt).gt(0)) {

        //
        // if the tx has NOT been spent
        //
        if (this.app.storage.validateTransactionInput(slip, this.block.id)) {
          if (eblk.transactions[i].isAutomaticallyRebroadcast(eblk, this, ii)) {

            //
            // create a transaction to rebroadcast this slip
            //
            // 2 = average fee in block
            //
            // TODO -- make this the actual average fee in the block
            //
            // we submit transaction_id as well as block_id, since we only
            // filter to reject txs based on block id, but we need a unique
            // tx id in all of the slips in order for them to count as unique
            // when avoiding duplicates. Since no TX IDs + SLIP IDs will be
            // repeated, we just use our original data.
            //
            var newtx = eblk.transactions[i].generateRebroadcastTransaction(slip.tid, slip.sid, 2);
            if (newtx == null) {
              console.log("ERROR GENERATING REBROADCAST TX: null tx returned");
              process.exit(1);
              return [];
            }

            //
            // update newtx with bid
            //
            for (let iii = 0; iii < newtx.transaction.from.length; iii++) {
              newtx.transaction.from[iii].bid = this.block.id;
            }

            txarray.push(newtx);

          }
        } else {
// console.log("THIS SLIP FAILED: " + JSON.stringify(slip) + " -- " + this.block.id);
	}
      }
    }
  }

  return txarray;
}




Block.prototype.validateRebroadcastTransactions = async function validateRebroadcastTransactions() {

  if (this.app.BROWSER == 1 || this.app.SPVMODE == 1) { return true; }

  let needs_rebroadcast = 0;
  let total_rebroadcast = 0;

  var eliminated_block_id = this.returnId() - this.app.blockchain.returnGenesisPeriod() - 1;
  var goldenticket_block_id = eliminated_block_id + 1;

console.log("ELIMINATED BLOCK ID: " + eliminated_block_id);

  //
  // if no blocks to eliminate, return 0.0 and confirm valid
  //
  if (eliminated_block_id < 1) { return true; }

  //
  // otherwise, load the relevant blocks
  //
  var eblk = await this.app.storage.loadSingleBlockFromDiskById(eliminated_block_id);
  var gblk = await this.app.storage.loadSingleBlockFromDiskById(goldenticket_block_id);

  var unspent_amt = Big(0.0);

  for (var i = 0; i < eblk.transactions.length; i++) {

    //
    // the TO slips are the ones that may or may
    // not have been spent, so we check to see if
    // they are spent using our hashmap.
    //
    for (var ii = 0; ii < eblk.transactions[i].transaction.to.length; ii++) {

      var slip = eblk.transactions[i].transaction.to[ii];
      slip.bid = eblk.returnId();
      slip.tid = eblk.transactions[i].transaction.id;
      slip.bhash = eblk.returnHash();
      slip.sid = ii;

      if (Big(slip.amt).gt(0)) {
        if (this.app.storage.validateTransactionInput(slip, this.block.id)) {
          if (eblk.transactions[i].isAutomaticallyRebroadcast(eblk, this, ii)) {

            needs_rebroadcast++;
            let is_tx_in_block = 0;

            for (let v = 0; v < this.transactions.length; v++) {
              if (this.transactions[v].transaction.sig == eblk.transactions[i].transaction.sig) {
                is_tx_in_block = 1;
                v = this.transactions.length + 1;
              }
            }

            //
            // we have an eligible tx that has not
            // been rebroadcast! this constitutes
            // an attack
            //
            if (is_tx_in_block == 0) {
              return false;
            }

          }
        } else {

	}
      }
    }
  }


  /////////////////////////////
  // check total rebroadcast //
  /////////////////////////////
  for (let v = 0; v < this.transactions.length; v++) {
    if (this.transactions[v].transaction.type >= 3) {

      //
      // all rebroadcast txs that are new
      // should have an empty message field
      //
      // if someone manually screws with this
      // they will just trigger a block that
      // will not be accepted by the network and
      // included in the longest chain.
      //
      if (this.transactions[v].transaction.msg.tx != undefined) {
        total_rebroadcast++;
      }

    }
  }


  if (total_rebroadcast != needs_rebroadcast) {
    console.log("Validation Error: unmatched rebroadcast transactions: " + total_rebroadcast + " - " + needs_rebroadcast);
    return false;
  } else {
    //console.log("Validation OK: matched rebroadcast transactions: " + total_rebroadcast + " - " + needs_rebroadcast);
  }

  return true;
}





Block.prototype.calculateReclaimedFunds = async function calculateReclaimedFunds() {

  if (this.app.BROWSER == 1 || this.app.SPVMODE == 1) { return { reclaimed: "0.0", validates: true }; }

  var eliminated_block_id = this.returnId() - this.app.blockchain.returnGenesisPeriod() - 1;
  var goldenticket_block_id = eliminated_block_id + 1;

  //
  // if no blocks to eliminate, return 0.0 and confirm valid
  //
  if (eliminated_block_id < 1) { return { reclaimed: "0.0", validates: true }; }

  //
  // otherwise, lets load the relevant blocks
  //
  var eblk = await this.app.storage.loadSingleBlockFromDiskById(eliminated_block_id);
  var gblk = await this.app.storage.loadSingleBlockFromDiskById(goldenticket_block_id);

  var unspent_amt = Big(0.0);

  //
  // loop through the transactions in this block, and check
  // which ones of them need to be checked to see if they have
  // been unspent. If these transactions are UNSPENT and do not
  // need to be rebroadcast, add their value to our unspent_amt
  //
  for (var i = 0; i < eblk.transactions.length; i++) {
    for (var j = 0; j < eblk.transactions[i].transaction.to.length; j++) {

      var slip = eblk.transactions[i].transaction.to[j];
      slip.bid = eblk.returnId();
      slip.tid = eblk.transactions[i].transaction.id;
      slip.sid = j;
      slip.bhash = eblk.returnHash();

      if (Big(slip.amt).gt(0)) {

        //
        // if the tx has NOT been spent
        //
        if (this.app.storage.validateTransactionInput(slip, this.block.id)) {

          if (eblk.transactions[i].isAutomaticallyRebroadcast(eblk, this, j)) {

          } else {

            /////////////////////
            // slip is unspent //
            /////////////////////
            unspent_amt = unspent_amt.plus(Big(slip.amt));

          }
        }
      }
    }
  }

  //
  // we have added up the unspent TX slips, now we
  // need to figure out if we need to reclain the
  // golden ticket coinbase
  //
  if (gblk.containsGoldenTicket() == 0) {
    unspent_amt = unspent_amt.plus(Big(eblk.block.coinbase));
    if (eblk.block.bf.current != undefined) {

      //
      // burn fee paid reclaimed in addition to coinbase
      //
      unspent_amt = unspent_amt.plus(Big(eblk.block.bf.current));
    }
  }

  return { reclaimed: unspent_amt.toFixed(8), validates: true };

}


Block.prototype.validate = async function validate() {

  try {

    //
    // fetch prev block
    //
    if (this.block.prevhash == "") { return 1; }
    var prevblk = await this.app.blockchain.returnBlockByHash(this.block.prevhash);
    if (prevblk == null) { return 1; }


    //
    // do we have a full genesis period
    //
    let do_we_have_a_full_genesis_period = this.app.blockchain.hasFullGenesisPeriod();


    //
    // my timestamp must be bigger than last timestamp
    //
    if (prevblk.block.ts >= this.block.ts) {
      console.log("Block invalid: doublespend input");
      //this.app.logger.logError("Block timestamp problem: block timestamp appears to be before its preceeding block", {message:"",err:""});
      return 0;
    }


    //
    // check transactions
    //
    // we will delete txsjson, which means that the transactions array
    // may be longer in the event of a chain reorganization.
    //
    if (this.block.txsjson.length > this.transactions.length) {
      console.log("Block transaction and txsjson arrays do not match. Discarding.");
      //this.app.logger.logError("Block transactions do not match. Discarding.", { message: "", err: "" });
      return 0;
    }


    //
    // ensure no duplicate input slips
    //
    let transaction_input_hmap = [];
    for (let i = 0; i < this.transactions.length; i++) {
      for (let j = 0; j < this.transactions[i].transaction.from.length; j++) {
        if (transaction_input_hmap[this.transactions[i].transaction.from[j].returnIndex()] != undefined) {
          console.log("Block invalid: doublespend input");
          //this.app.logger.logError("Block invalid: doublespent input - " + this.transactions[i].transaction.from[j].returnIndex(), { message: "", err: "" });
          console.log(i + " -- " + j);
          console.log(JSON.stringify(this.transactions[i].transaction.from[j]));
          return 0;
        }
        transaction_input_hmap[this.transactions[i].transaction.from[j].returnIndex()] = 1;
      }
    }


    //
    // validate non-rebroadcast transactions
    //
    for (let i = 0; i < this.transactions.length; i++) {
      if (this.transactions[i].transaction.type < 3) {
        if (!this.transactions[i].validate(this.app, this)) {
          console.log(`Block invalid: contains invalid transaction: ${i}`);
          console.log(JSON.stringify(this.transactions[i]));
          this.transactions[i].is_valid = 0;
          //this.app.logger.logError("Block invalid: contains invalid transaction: " + i, { message: "", err: "" });
          return 0;
        }
      }
    }

    //
    // validate non-rebroadcast transactions
    //
    console.log(" ---> before sigs validate: " + new Date().getTime());
    let did_successfully_validate = await this.app.cluster.validateTransactions(this);
    console.log(" ---> after sigs validate: " + new Date().getTime());

    if (did_successfully_validate == 0) {
      console.log('Block invalid: contains invalid transaction -- sig invalid');
      //this.app.logger.logError("Block invalid: contains invalid transaction: " + i, { message: "", err: "" });
      return 0;
    }
    //console.log(" ---> after sigs:  " + new Date().getTime());


    //
    // figure out cumulative fees
    //
    let block_cumulative_fees = "0.0";
    for (let i = 0; i < this.transactions.length; i++) {
      block_cumulative_fees = this.transactions[i].calculateCumulativeFees(this.app, block_cumulative_fees);
    }

    //
    // validate rebroadcast txs
    //
    if (do_we_have_a_full_genesis_period == 1) {
      let rebroadcast_validated = await this.validateRebroadcastTransactions();
      if (!rebroadcast_validated) {
        console.log("Cannot validate rebroadcast transactions!");
        return 0;
      }
    }

    //
    // validate reclaimed funds
    //
    if (do_we_have_a_full_genesis_period == 1) {
      let block_reclaimed = await this.calculateReclaimedFunds();
      if (block_reclaimed.reclaimed !== this.block.reclaimed) {
        console.log("Block invalid: reclaimed funds do not match - " + block_reclaimed.reclaimed + " vs " + this.block.reclaimed)
        return 0;
      }
    }


    //console.log(" ---> pre merkle:  " + new Date().getTime());
    //
    // validate merkle root
    //
    if (this.block.txsjson.length > 0) {

      let tx_strings = [];
      for (let z = 0; z < this.transactions.length; z++) {
        tx_strings[z] = this.transactions[z].returnMessageSignatureSource(this.app);
      }

      let mt = this.app.crypto.returnMerkleTree(tx_strings);
      let t = mt.root;

      if (t != this.block.merkle) {
        console.log("Block merkle root hash is not as expected");
        //this.app.logger.logError("Block merkle root hash is not as expected", { message: "", err: "" });
        return 0;
      }

      //
      // use merkle tree to ensure all transaction mhashs (i.e. no msgs altered)
      //
      // NOTE: we can make this more efficient by making the content checks something that
      // happens in parallel during transaction validation.... right? confirm and change this
      // on next re-write if sensible.
      //
      for (let m = 0; m < this.transactions.length; m++) {
        if (mt[this.transactions[m].transaction.mhash] != undefined) {
          if (mt[this.transactions[m].transaction.mhash].level !== 0) {
            console.log("Block merkle tree does not contain MHASH of transaction");
            //this.app.logger.logError("Block merkle tree does not contain MHASH of transaction", { message: "", err: "" });
            return 0;
          }
        }
      }
      //console.log(" ---> pst merkle:  " + new Date().getTime());
    }


    //
    // validate burn fee and fee transaction
    //
    if (this.block.txsjson.length > 0) {

      //
      // we must use returnMovingBurnFee as it recalculates based on the block
      // provided. using "ForThisBlock" will fetch the information from the
      // bf object if it exists.
      //
      let burn_fee_needed = Big(this.app.burnfee.returnMovingBurnFee(prevblk, (this.block.ts - prevblk.block.ts)));
      let credits_available = Big(this.returnAvailableFees(this.block.creator));
      let surplus_available = credits_available.minus(burn_fee_needed);


      if (credits_available.lt(burn_fee_needed)) {
        console.log(`Block invalid: transaction fees inadequate: ${credits_available.toFixed(8)} -- ${burn_fee_needed.toFixed(8)}`);
        //this.app.logger.logError("Block invalid: transaction fees inadequate", { message: "", err: "" });
        console.log(this.stringify(1));
        process.exit(1);
        return 0;
      }

      //////////////////////////////
      // validate fee transaction //
      //////////////////////////////
      if (surplus_available.gt(0)) {

        let feetx = null;
        let feetx_count = 0;

        for (let i = 0; i < this.transactions.length; i++) {
          if (this.transactions[i].transaction.type == 2) {
            feetx = this.transactions[i];
            feetx_count++;
          }
        }

        if (feetx == null) {
          console.log("Block invalid: surplus exists but no fee ticket");
          //this.app.logger.logError("Block invalid: surplus exists but no fee ticket", { message: "", err: "" });
          return 0;
        }

        if (feetx_count > 1) {
          console.log("Block invalid: multiple fee transactions found in block");
          //this.app.logger.logError("Block invalid: multiple fee transactions found in block", { message: "", err: "" });
          return 0;
        }

        let v = Big(0);
        for (let i = 0; i < feetx.transaction.to.length; i++) { v = v.plus(feetx.transaction.to[i].amt); }

        if (!Big(v.toFixed(8)).eq(Big(surplus_available.toFixed(8)))) {
          console.log(`Block invalid: surplus exists but does not match fee ticket: ${v.toFixed(8)} -- ${surplus_available.toFixed(8)}`);
          //this.app.logger.logError("Block invalid: surplus exists but does not match fee ticket", { message: "", err: "" });
          return 0;
        }
      }
    }

    ////////////////////////////
    // validate golden ticket //
    ////////////////////////////
    let gttx = null;
    let gttx_count = 0;

    // check for golden ticket
    for (let i = 0; i < this.transactions.length; i++) {
      if (this.transactions[i].transaction.type == 1) {
        gttx_count++;
        gttx = this.transactions[i];
      }
    }

    if (gttx_count > 1) {
      console.log("Block invalid: has more than one golden ticket");
      //.logError("Block invalid: has more than one golden ticket", { message: "", err: "" });
      return 0;
    }

    // no golden ticket
    if (gttx == null) {

      // difficulty, paysplit should be unchanged
      if (this.returnPaysplit() != prevblk.returnPaysplit()) {
        console.log("Block invalid: no golden ticket yet paysplit differs");
        //this.app.logger.logError("Block invalid: no golden ticket yet paysplit differs", { message: "", err: "" });
        return 0;
      }
      if (this.returnDifficulty() != prevblk.returnDifficulty()) {
        console.log("Block invalid: no golden ticket yet difficulty differs");
        //this.app.logger.logError("Block invalid: no golden ticket yet difficulty differs", { message: "", err: "" });
        return 0;
      }

    } else {

      // ensure golden ticket consistent
      let golden = new saito.goldenticket(this.app, JSON.stringify(gttx.transaction.msg));

      if (!golden.validateSolution(this, prevblk, gttx.transaction.from[0].add)) {
        console.log("Block invalid: contains invalid golden ticket (solution invalid)");
        console.log(gttx.transaction);
       // this.app.logger.logError("Block contains invalid golden ticket (solution invalid)", { message: "", err: "" });
        return 0;
      }

      //
      // ensure golden ticket miner and node payouts are exactly right
      //
      let total_fees_needed_for_prevblk = await this.app.burnfee.returnBurnFeePaidForThisBlock(prevblk);
      let total_fees_available_for_creator = prevblk.returnAvailableFees(prevblk.block.creator);
      let total_fees_in_prevblk = prevblk.returnFeesTotal();
      let creator_surplus = Big(total_fees_available_for_creator).minus(Big(total_fees_needed_for_prevblk));
      let total_fees_for_miners_and_nodes = Big(total_fees_in_prevblk).minus(creator_surplus).plus(prevblk.returnCoinbase());


      // miner and node shares
      let miner_share = total_fees_for_miners_and_nodes.div(2).toFixed(8);
      let node_share = total_fees_for_miners_and_nodes.minus(Big(miner_share)).toFixed(8);


      if (gttx.transaction == null) {
        console.log("Block invalid: contains invalid golden ticket transaction");
        //this.app.logger.logError("Block invalid: contains invalid golden ticket transaction", { message: "", err: "" });
        return 0;
      }
      if (gttx.transaction.to.length < 2) {
        console.log("Block invalid: contains insufficient transaction to slips");
        //this.app.logger.logError("Block invalid: contains insufficient transaction to slips", { message: "", err: "" });
        return 0;
      }

      // create the golden ticket transaction
      if (gttx.transaction.to[0].amt != miner_share) {
        console.log("Block invalid: contains invalid miner share in golden ticket");
        //this.app.logger.logError("Block invalid: contains invalid miner share in golden ticket", { message: "", err: "" });
        return 0;
      }
      if (gttx.transaction.to[1].amt != node_share) {
        console.log("Block invalid: contains invalid node share in golden ticket");
        //this.app.logger.logError("Block invalid: contains invalid node share in golden ticket", { message: "", err: "" });
        return 0;
      }


      //
      // PICK WINNING NODE
      //
      let winning_node = golden.findWinner(golden.solution, prevblk);
      if (gttx.transaction.to[0].add != gttx.transaction.from[0].add) {
        console.log("Block invalid: miner payment is not to miner address");
        //.logError("Block invalid: miner payment is not to miner address");
        return 0;
      }

      if (gttx.transaction.to[1].add != winning_node) {
        console.log("Block invalid: charlie is getting inappropriately screwed");
        //this.app.logger.logError("Block invalid: charlie is getting inappropriately screwed");
        return 0;
      }



      //
      // ensure there are no new tokens snuck into this transaction
      //
      let gttx_from_amt = Big(0);
      for (let i = 0; i < gttx.transaction.from.length; i++) {
        gttx_from_amt = gttx_from_amt.plus(Big(gttx.transaction.from[i].amt));
      }
      let gttx_to_amt = Big(0);
      for (let i = 2; i < gttx.transaction.to.length; i++) {
        gttx_to_amt = gttx_to_amt.plus(Big(gttx.transaction.to[i].amt));
      }
      if (gttx_from_amt.lt(gttx_to_amt)) {
        console.log("Block invalid: golden ticket transaction tries to sneak money into change slip");
        //this.app.logger.logError("Block invalid: golden ticket transaction tries to sneak money into change slip", { message: "", err: "" });
        return 0;
      }


      //
      // confirm difficulty
      //
      if (this.returnDifficulty() != golden.calculateDifficulty(prevblk)) {
        console.log("Block invalid: difficulty adjustment is incorrect");
        //this.app.logger.logError("Block invalid: difficulty adjustment is incorrect", { message: "", err: "" });
        return 0;
      }
      if (this.returnPaysplit() != golden.calculatePaysplit(prevblk)) {
        console.log("Block invalid: paysplit adjustment is incorrect");
        //this.app.logger.logError("Block invalid: paysplit adjustment is incorrect", { message: "", err: "" });
        return 0;
      }

      // validate monetary policy
      if (golden !== null) {
        if (golden.validateMonetaryPolicy(this.returnTreasury(), this.returnCoinbase(), prevblk) != 1) {
          console.log("Block invalid: monetary policy does not validate");
          //this.app.logger.logError("Block invalid: monetary policy does not validate", { message: "", err: "" });
          return 0;
        }
      }
    }
  } catch (err) {
    console.error(err)
    return 0;
  }

  return 1;
}

Block.prototype.returnAvailableFees = function returnAvailableFees(publickey = "") {

  if (publickey == "") { publickey = this.app.wallet.returnPublicKey(); }

  let v = Big(0);
  for (let i = 0; i < this.transactions.length; i++) {
    v = v.plus(Big(this.transactions[i].returnFeesUsable(this.app, publickey)));
  }
  return v.toFixed(8);

}
Block.prototype.returnFeesTotal = function returnFeesTotal() {

  let v = Big(0);
  for (let i = 0; i < this.transactions.length; i++) {
    v = v.plus(Big(this.transactions[i].returnFeesTotal(this.app, this.block.creator)));
  }
  return v.toFixed(8);

}







//
// avg fee paid by non-rebroadcast txs
//
Block.prototype.returnAverageFee = function returnAverageFee() {

  if (this.average_fee != "") { return this.average_fee; }

  var total_fees = Big(0.0);
  var total_txs = 0;

  for (let i = 0; i < this.transactions.length; i++) {
    if (this.transactions[i].transaction.type == 0) {
      total_txs++;
      total_fees = total_fees.plus(Big(this.transactions[i].returnFeesTotal(this.app, "")));
    }
  }
  if (total_txs > 0) {
    this.average_fee = total_fees.div(total_txs).toFixed(8);
  } else {
    this.average_fee = "0";
  }
  return this.average_fee;

}




******/




