const Big      = require('big.js');
const saito    = require('./saito');

/**
 * Transaction Constructor
 * @param {*} txjson
 */
function Transaction(txjson="") {

  if (!(this instanceof Transaction)) {
    return new Transaction(txjson);
  }

  /////////////////////////
  // consensus variables //
  /////////////////////////
  this.transaction               = {};
  this.transaction.id            = 1;
  this.transaction.from          = [];
  this.transaction.to            = [];
  this.transaction.ts            = "";
  this.transaction.sig           = "";  // sig of tx
  this.transaction.mhash         = "";  // hash of msg
  this.transaction.ver           = 1.0;
  this.transaction.path          = [];
  this.transaction.type          = 0; // 0 = normal
                                      // 1 = golden ticket
                                      // 2 = fee transaction
                                      // 3 = rebroadcasting
                                      // 4 = VIP rebroadcast
                                      // 5 = floating coinbase / golden chunk
                                      // 6 = staking pending ()rebroadcast
                  		      // 7 = staking current (
  this.transaction.msg           = {};
  this.transaction.ps            = 0;

  this.fees_total		 = "";
  this.work_available_to_me	 = "";
  this.work_available_to_creator = "";
  this.work_cumulative 		 = "0.0";
					// cumulative fees, inc. fees in this reflect
                                        // how much this transaction carries in the
                                        // weight of the block. we use this to find
                                        // the winning node in the block for the 
                                        // routing payment. i.e. this measures the 
                                        // cumulative weight of the usable fees that
                                        // are behind the transactions.

  this.dmsg			 = "";
  this.size                      = 0;
  this.is_valid                  = 1;

  if (txjson != "") {
    try {
      let tx.transaction = JSON.parse(txjson.toString("utf8"));
    } catch (err) {
      this.is_valid = 0;
    }
  }

  return this;

}
module.exports = Transaction;



Transaction.prototype.isFrom = function isFrom(senderPublicKey) {
  if (this.returnSlipsFrom(senderPublicKey).length != 0) { return true; }
  return false;
}

Transaction.prototype.isTo = function isTo(receiverPublicKey) {
  if (this.returnSlipsTo(receiverPublicKey).length > 0) { return true; }
  return false;
}

Transaction.prototype.isGoldenTicket = function isGoldenTicket() {
  if (this.transaction.type == 1) { return 1; }
  return 0;
}

Transaction.prototype.involvesPublicKey = function involvesPublicKey(publickey) {
  let slips = this.returnSlipsToAndFrom(publickey);
  if (slips.to.length > 0 || slips.from.length > 0) { return 1; }
  return 0;
}

Transaction.prototype.returnSlipsFrom = function returnSlipsFrom(fromAddress) {
  var x = [];
  if (this.transaction.from != null) {
    for (var v = 0; v < this.transaction.from.length; v++) {
      if (this.transaction.from[v].add === fromAddress) { x.push(this.transaction.from[v]); }
    }
  }
  return x;
}

Transaction.prototype.returnSlipsToAndFrom = function returnSlipsToAndFrom(theAddress) {
  var x = {};
  x.from = [];
  x.to = [];
  if (this.transaction.from != null) {
    for (var v = 0; v < this.transaction.from.length; v++) {
      if (this.transaction.from[v].add === theAddress) { x.from.push(this.transaction.from[v]); }
    }
  }
  if (this.transaction.to != null) {
    for (var v = 0; v < this.transaction.to.length; v++) {
      if (this.transaction.to[v].add === theAddress) { x.to.push(this.transaction.to[v]); }
    }
  }
  return x;
}

Transaction.prototype.returnSlipsTo = function returnSlipsTo(toAddress) {
  var x = [];
  if (this.transaction.to != null) {
    for (var v = 0; v < this.transaction.to.length; v++) {
      if (this.transaction.to[v].add === toAddress) { x.push(this.transaction.to[v]); }
    }
  }
  return x;
}

Transaction.prototype.decryptMessage = function decryptMessage(app) {
  try { this.dmsg = app.keys.decryptMessage(this.transaction.from[0].add, this.transaction.msg); } catch (e) {}
}

Transaction.prototype.returnMessage = function returnMessage() {
  if (this.dmsg != "") { return this.dmsg; }
  return this.transaction.msg;
}

Transaction.prototype.returnSignature = function returnSignature(app) {
  if (this.transaction.sig != "") { return this.transaction.sig; }
  this.transaction.sig = app.wallet.signMessage(this.returnSignatureSource(app));
  return this.transaction.sig;
}

Transaction.prototype.returnSignatureSource = function returnSignatureSource(app) {
  return JSON.stringify(this.transaction);
}

Transaction.prototype.returnFees = function returnFees(app) {
  if (this.fees_total == "") { 

    //
    // sum inputs
    //
    let inputs = Big(0.0);
    if (this.transaction.from != null) {
      for (let v = 0; v < this.transaction.from.length; v++) {
        inputs = inputs.plus(Big(this.transaction.from[v].amt));
      }
    }

    //
    // sum outputs
    //
    let outputs = Big(0.0);
    for (let v = 0; v < this.transaction.to.length; v++) {

      //
      // only count non-gt transaction outputs
      //
      if (this.transaction.to[v].type != 1 && this.transaction.to[v].type != 2) {
        outputs = outputs.plus(Big(this.transaction.to[v].amt));
      }
    }

    let tx_fees = inputs.minus(outputs);
    this.fees_total = tx_fees.toFixed(8);
  }

  return this.fees_total;
}


Transaction.prototype.returnRoutingWorkAvailable = function returnRoutingWorkAvailable(app, publickey="") {

  let uf = Big(this.returnFees(app));  

  for (let i = 0; i < this.transaction.path.length; i++) {
    let d = 1;
    for (let j = i; j > 0; j--) { d = d*2; } 
    uf = uf.div(d);
  }

  return uf.toFixed(8);

}

























/**
 * calculates the fee weight for the transaction, so that we can rapidly cycle through the 
 * transactions in a block and determine which routing node is the lucky winner based on the
 * total volume of transaction fees that they have generated.
 *
Transaction.prototype.calculateCumulativeFees = function calculateCumulativeFees(app, cumulative_fee) {

  // TODO
  // 
  // simplify without loops and crap
  //
  // fee + fee ( 1 - 1/n )
  // 
  // at this point the transaction is valid and we have checked that
  // the path is legit, so we just calculate the cumulative fees
  //
  let uf = Big(this.returnFeesTotal(app));  
  let cf = Big(0.0);

  for (let i = 0; i < this.transaction.path.length; i++) {
    let d = 1;
    for (let j = i; j > 0; j--) { d = d*2; } 
    cf = cf.plus(Big(uf.div(d)));
  }

  this.fees_cumulative = Big(cumulative_fee).plus(cf).toFixed(8);

  return this.fees_cumulative;

}

Transaction.prototype.calculateFees = function calculateFees(app, publickey="") {

  //
  // keep track of which key these were calculated against
  // so that we can refresh the figures if a different key
  // is submitted in the future, and do not just return
  // the wrong figure out of habit.
  //
  this.fees_publickey == publickey;

  //
  // publickey should be block creator, or default to me
  //
  if (publickey == "") {
    publickey = app.wallet.returnPublicKey();
  }

  //
  // calculate total fees
  //
  var inputs = Big(0.0);
  if (this.transaction.from != null) {
    for (var v = 0; v < this.transaction.from.length; v++) {
      //
      // inputs counted on all tx types
      //
      inputs = inputs.plus(Big(this.transaction.from[v].amt));
    }
  }

  var outputs = Big(0.0);
  for (var v = 0; v < this.transaction.to.length; v++) {
    //
    // only count outputs on non-gt transactions
    //
    if (this.transaction.to[v].type != 1 && this.transaction.to[v].type != 2) {
      outputs = outputs.plus(Big(this.transaction.to[v].amt));
    }
  }

  let tx_fees = inputs.minus(outputs);
  this.fees_total = tx_fees.toFixed(8);

  //
  // mark negative total as invalid tx
  //
  if (tx_fees.lt(0)) {

    //
    // type 4 is the exception as it can only be valid
    // if signed by the GENESIS key. We put a hard 
    // restriction on this in block limit so that the
    // exception can only be used to generate the pre-
    // mined key at the beginning.
    //
    if ((this.transaction.type == 4 || this.transaction.type == 5) && app.blockchain.returnLatestBlockId() < 2) {} else {
      console.log("SETTING TX AS INVALID IN CALCULATE FEES")
      this.is_valid = 0;
    }

  }

  //
  // calculate usable fees
  //
  if (this.transaction.path.length == 0) {
    // only valid if creator is originator
    if (publickey != this.transaction.from[0].add) {
      this.fees_usable = "0";
      return;
    }
  } else {
    // check publickey is last recipient
    if (publickey != "") {
      if (this.transaction.path[this.transaction.path.length-1].to != publickey) {
        this.fees_usable = "0";
        return;
      }
    }
  }

  //
  // check path integrity
  //
  let from_node = this.transaction.from[0].add;

  for (let i = 0; i < this.transaction.path.length; i++) {

    if (this.transaction.path[i].from != from_node) {
      // path invalid
      console.log("TX INVALID, INVALID PATH");
      this.fees_usable = "0";
      this.is_valid = 0;
      return;
    }

    let msg_to_check = this.transaction.path[i].to;
    let sig_to_check = this.transaction.path[i].sig;

    if (!app.crypto.verifyMessage(msg_to_check, sig_to_check, from_node)) {
      // path invalid
      console.log("ERROR: transaction has invalid path signatures");
      this.fees_usable = "0";
      this.is_valid = 0;
      return;
    }

    from_node = this.transaction.path[i].to;
  }

  //
  // adjust usable fee for pathlength
  //
  var pathlength = this.returnPathLength();
  for (var x = 1; x < pathlength; x++) {
    tx_fees = tx_fees.div(2);
  }

  this.fees_usable = tx_fees.toFixed(8);
  return;

}


Transaction.prototype.returnPathLength = function returnPathLength() {
  return this.transaction.path.length;
}
Transaction.prototype.returnSender = function returnSender() {
  if (this.transaction.from.length >= 1) {
    return this.transaction.from[0].add;
  }
}


 * validate that a transaction is valid for importing to the mempool
 * this is redundant but it fixes the issue that if we are spending
 * a slip that has just been spent it can sneak through our mempool
 * using the existing validation check.
 *
 * 1. when adding transaction to mempool
 *
 * @returns {boolean} true_if_validates

Transaction.prototype.validateSlipsForMempool = function validateSlipForMempool(app, blk=null) {

  if (app.BROWSER == 1 || app.SPVMODE == 1) { return true; }


  ////////////////////////////
  // confirm inputs unspent //
  ////////////////////////////
  if (!app.storage.validateTransactionInputsForMempool(this.transaction.from)) {
    console.log("Transaction Invalid: checking inputs in mempool validate function");
    app.mempool.removeTransaction(this);
    return false;
  }

  return true;

}



 * validate that a transaction is valid given the consensus rules
 * of the blockchain. Note that this function can be called in two
 * different contents:
 *
 * 1. when adding transaction to mempool
 * 2. when confirming block is valid
 *
 * In the first case, we expect the block provided to the function
 * to be null. In the latter case, we expect to have the actual
 * block.
 *
 * @returns {boolean} true_if_validates
Transaction.prototype.validate = function validate(app, blk=null) {

  if (app.BROWSER == 1 || app.SPVMODE == 1) { return true; }

  //
  // set defaults
  //
  let block_id = app.blockchain.returnLatestBlockId();
  let block_paysplit_vote = 0;
  let avg_fee = 2;

  if (blk != null) { block_id = blk.block.id; }

  if (this.is_valid == 0) { return false; }


  ////////////////////////////
  // confirm inputs unspent //
  ////////////////////////////
  if (!app.storage.validateTransactionInputs(this.transaction.from, app.blockchain.returnLatestBlockId())) {
    console.log("Transaction Invalid: checking inputs in validate function");
    app.mempool.removeTransaction(this);
    return false;
  }


  /////////////////////////////////
  // min one sender and receiver //
  /////////////////////////////////
  if (this.transaction.from.length < 1) {
    console.log("no from address in transaction");
    return false;
  }
  if (this.transaction.to.length < 1) {
    console.log("no to address in transaction");
    return false;
  }


  /////////////
  // VIP TXs //
  /////////////
  //
  // these are only valid if signed by the GENESIS_PUBLICKEY which is 
  // hardcoded. Note that in transaction calculateFees we are OK with
  // VIP transactions being created by the GenesisKey BEFORE block 10
  // so that we can allocate easily on startup.
  //
  if ((this.transaction.type == 5 || this.transaction.type == 4) && this.transaction.msg == {}) {
    if (this.transaction.from[0].add != app.GENESIS_PUBLICKEY) {
      console.log("Unapproved VIP transaction - we have to pay fees to support the network, folks!");
      return 0; 
    }
  }



  //////////////////////////
  // no negative payments //
  //////////////////////////
  let total_from = Big(0.0);
  for (let i = 0; i < this.transaction.from.length; i++) {
    total_from = total_from.plus(Big(this.transaction.from[i].amt));
    if (total_from.lt(0)) { 
      console.log("WE HAVE FOUND A NEGATIVE PAYMENT IN THE FROM AMT");
      return 0; 
    }
  }
  let total_to = Big(0.0);
  for (let i = 0; i < this.transaction.to.length; i++) {
    total_to = total_to.plus(Big(this.transaction.to[i].amt));
    if (total_to.lt(0)) { 
      console.log("WE HAVE FOUND A NEGATIVE PAYMENT IN THE TO AMT");
      return 0;
    }
  }
  if (this.transaction.type == 0 || this.transaction.type >= 3) {
    if (total_to.gt(total_from)) {
      console.log("WE HAVE FOUND A NEGATIVE PAYMENT - TO > FROM");
      return 0;
    }
  }


  //
  // ensure that the path is valid!
  //
  // this allows us to insist that you cannot include transactions
  // with invalid paths in your transaction. returnFeesUsable will
  // mark the transaction as invalid if the sig fails to register
  //
  let uf = this.returnFeesUsable(app);
  if (this.is_valid == 0) {
    console.log("Transaction is not valid -- likely a path signature is wrong");
    return 0;
  }

  //
  // NOTE
  //
  // at this point we have done all of the validation that would happen
  // if we were provided a transaction without a block. From this point
  // on our checks are for things that require consistency between the
  // transaction and the block / blockchain containing it.
  //
  // return 1 because there is no block provided, so if we have hit this
  // point the transaction has passed our superficial validation tests
  //
  if (blk == null) { return 1; }

  //
  // update variables
  //
  block_paysplit_vote = blk.block.vote;
  block_id = blk.block.id;
  avg_fee = 2;


  ////////////////////
  // validate votes //
  ////////////////////
  if (block_paysplit_vote == 1) {
    if (this.transaction.ps != 1 && this.transaction.type == 0) {
      console.log("transaction paysplit vote differs from block paysplit vote");
      return false;
    }
  }
  if (block_paysplit_vote == -1) {
    if (this.transaction.ps != -1 && this.transaction.type == 0) {
      console.log("transaction paysplit vote differs from block paysplit vote");
      app.mempool.removeTransaction(this);
      return false;
    }
  }


  ///////////////////////////
  // within genesis period //
  ///////////////////////////
  let acceptable_lower_block_limit = block_id - app.blockchain.returnGenesisPeriod();
  for (let tidx = 0; tidx < this.transaction.from.length; tidx++) {
    if (this.transaction.from[tidx].bid < acceptable_lower_block_limit && this.transaction.type == 0) {
      if (Big(this.transaction.from[tidx].amt).gt(0)) {
        console.log("transaction outdated: tries to spend input from block "+this.transaction.from[tidx].bid);
        console.log(this.transaction.from[tidx]);
        app.mempool.removeTransaction(this);
        return false;
      }
    }
    //
    // check block hash of spent inputs also longest chain
    //
    // bhash will always be set for something in a previous block
    //
    if (this.transaction.from[tidx].bhash != "") {
      if (app.blockchain.isBlockHashOnLongestChain(this.transaction.from[tidx].bhash) != 1) {
        console.log("1----> " + this.transaction.from[tidx].bhash);
        console.log("2----> " + app.blockchain.block_hash_lc_hmap[this.transaction.from[tidx].bhash]);
        console.log("transaction contains slip on non-longest chain:" + JSON.stringify(this.transaction.from[tidx]));
console.log(JSON.stringify(app.blockchain.block_hash_lc_hmap));
        app.mempool.removeTransaction(this);
        return false;
      }
    }
  }

  return true;

}

 * Validate
Transaction.prototype.clusterValidate = function clusterValidate(app) {

  ///////////////////////////
  // validate tx signature //
  ///////////////////////////
  if (!app.crypto.verifyMessage(this.returnSignatureSource(app), this.transaction.sig, this.returnSender())) {

    //
    // maybe this is a rebroadcast tx
    //
    // check if we can make its tx-within-a-tx validate
    //
    if (this.transaction.type >= 3 && this.transaction.type <= 5) {

      if ((this.transaction.type == 4 || this.transaction.type == 5) && this.transaction.msg == {}) {
        //
        // the transaction class needs to check that this passes muster
        // on the sender restrictions.
        //
        console.log("validating first-time rebroadcast VIP transaction");
        return 1;
      }

      if (this.transaction.msg.tx == undefined) {
        console.log("transaction message signature does not verify, and there is no internal rebroadcast tx");
        return 0;
      }

      var oldtx = new saito.transaction(this.transaction.msg.tx);

      //
      // fee tickets and golden tickets have special rules
      //
      if (oldtx.transaction.type == 1 || oldtx.transaction.type == 2) {
        for (let vi = 0; vi < oldtx.transaction.to.length; vi++) {
          oldtx.transaction.to[vi].bid = 0;
          oldtx.transaction.to[vi].tid = 0;
          oldtx.transaction.to[vi].sid = vi;
          oldtx.transaction.to[vi].bhash = "";
        }
      } else {

        // all but the first (source of funds) txs will be new for VIP
        // and thus must have bhash reset to nothing
        for (let vi = 0; vi < oldtx.transaction.to.length; vi++) {
          oldtx.transaction.to[vi].bid = 0;
          oldtx.transaction.to[vi].tid = 0;
          oldtx.transaction.to[vi].sid = vi;
          oldtx.transaction.to[vi].bhash = "";
        }

      }

      if (!app.crypto.verifyMessage(oldtx.returnSignatureSource(app), oldtx.transaction.sig, oldtx.returnSender())) {
        console.log("transaction signature in original rebroadcast tx does not verify");
        return 0;
      } else {
//        console.log("ATR TX Validated: ");
//        console.log(oldtx.returnSignatureSource(app) + " -- " + oldtx.transaction.sig + " -- " + oldtx.returnSender());
        return 1;
      }
    } else {
      console.log("transaction message signature does not verify 1");
      console.log(JSON.stringify(this.transaction));
      console.log("Failed TX Source: " + this.returnSignatureSource(app) + " -- " + this.returnSender());
      app.mempool.removeTransaction(this);
      return 0;
    }
  }

  return 1;

}







/**
 * Returns true if we should rebroadcast this tx according to the
 * consensus criteria.
 *
 * @param {string} slip_id slip index used to fetch slip in tx
 * @returns {boolean} should we automatically rebroadcast?
 **/
Transaction.prototype.isAutomaticallyRebroadcast = function isAutomaticallyRebroadcast(oldblk, newblk, slip_id) {

  //
  // fee-capture and golden tickets never rebroadcast
  //
  // if (this.transaction.type == 1) 				         { console.log('no 1'); return false; }
  // if (this.transaction.type == 2) 				         { console.log('no 2'); return false; }
  // if (this.transaction.type == 3) 				         { console.log('no 3'); return false; }
  //
  // Golden Chunk transactions must point to the trapdoor address in order to be considered valid
  //
  if (this.transaction.to[slip_id].add  == this.atr_trapdoor_address) {
    if (this.transaction.to[slip_id].type == 5) { return true; }
    return false;
  }

  if (this.transaction.to.length == 0) { return false; }
  if (this.transaction.type == 4)      { return true; }
  if (Big(this.transaction.to[slip_id].amt).gt(this.atr_rebroadcasting_limit)) { return true; }

  return false;

}





 * create a transaction that is valid and that will rebroadcast the relevant tokens
 *
 * the rebroadcast transactions are handled on a slip-by-slip basis. So we will be
 * splitting up a transaction according to its UTXO if needed.
 *
Transaction.prototype.generateRebroadcastTransaction = function generateRebroadcastTransaction(tid, slip_id, avg_fee=2) {

  if (this.transaction.to.length == 0) { return null; }

  var newtx = new saito.transaction();
  newtx.transaction.sig = this.transaction.sig;
  newtx.transaction.msg = {};
  newtx.transaction.ts  = new Date().getTime();

  var fee = Big(avg_fee);
  if (avg_fee == 0) { fee = Big(2); }


  /////////////////////////
  // normal rebroadcasts //
  /////////////////////////
  //
  // TODO
  //
  // we don't want to circulate golden tickets or fee transactions
  // people should be spending them.
  //
  if (this.transaction.type >= 0 && this.transaction.type <= 3) {

    newtx.transaction.type = 3;
    if (this.transaction.msg.loop == undefined) {
      newtx.transaction.msg.loop = 1;
    } else {
      newtx.transaction.msg.loop = this.transaction.msg.loop+1;
    }

    for (i = 1; i < newtx.transaction.msg.loop; i++) { fee = fee.times(2); }

    var amt = Big(this.transaction.to[slip_id].amt).minus(fee);
    if (amt.lt(0)) {
      fee = Big(this.transaction.to[slip_id].amt);
      amt = Big(0);
    }

    if (this.transaction.msg.tx != undefined) {
      newtx.transaction.msg.tx = this.transaction.msg.tx;
    } else {
      newtx.transaction.msg.tx = this.stringify(2);
    }

    var from = new saito.slip(this.transaction.to[slip_id].add, this.transaction.to[slip_id].amt, 3);
        from.tid = tid;
        from.sid = slip_id;
    var to   = new saito.slip(this.transaction.to[slip_id].add, amt.toFixed(8), 3);
    var fees = new saito.slip(this.atr_trapdoor_address, fee.toFixed(8));
    fees.sid = 1;

    newtx.transaction.from.push(from);
    newtx.transaction.to.push(to);
    newtx.transaction.to.push(fees);

  }


  ///////////////////////////
  // prestige rebroadcasts //
  ///////////////////////////
  if (this.transaction.type == 4) {

    newtx.transaction.type = this.transaction.type;

    if (this.transaction.msg.tx != undefined) {
      newtx.transaction.msg.tx = this.transaction.msg.tx;
    } else {
      newtx.transaction.msg.tx = this.stringify(2);
    }

    var from = new saito.slip(this.transaction.to[slip_id].add, this.transaction.to[slip_id].amt, 4);
        from.tid = tid;
        from.sid = slip_id;
    var to   = new saito.slip(this.transaction.to[slip_id].add, this.transaction.to[slip_id].amt, 4);
    newtx.transaction.from.push(from);
    newtx.transaction.to.push(to);

  }



  //////////////////
  // golden chunk //
  //////////////////
  if (this.transaction.type == 5) {

    newtx.transaction.type = this.transaction.type;

    // calculate fee
    //
    // average fee * 10
    //
    var fee = Big(Big(avg_fee).times(10).toFixed(8));

    //
    // minimum of 20
    //
    if (fee.lt(20)) { fee = Big(20); }
    var amt = Big(this.transaction.to[slip_id].amt).minus(fee);
    if (amt.lt(0)) {
      fee = Big(this.transaction.to[slip_id].amt);
      amt = Big(0);
    }

    if (this.transaction.msg.tx != undefined) {
      newtx.transaction.msg.tx = this.transaction.msg.tx;
    } else {
      newtx.transaction.msg.tx = this.stringify(2);
    }

    var from = new saito.slip(this.transaction.to[slip_id].add, this.transaction.to[slip_id].amt, 5);
        from.tid = tid;
        from.sid = slip_id;
    var to   = new saito.slip(this.transaction.to[slip_id].add, amt.toFixed(8), 5);
    var fees = new saito.slip(this.atr_trapdoor_address, fee.toFixed(8));
    fees.sid = 1;

    newtx.transaction.from.push(from);
    newtx.transaction.to.push(to);
    newtx.transaction.to.push(fees);   // this ensures fee falls into money supply

  }

  return newtx;

}




***/

