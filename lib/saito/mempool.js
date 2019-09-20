'use strict';
const Big = require('big.js')
const saito = require('./saito');
const path = require('path');


function Mempool(app) {

  if (!(this instanceof Mempool)) {
    return new Mempool(app);
  }

  this.app                      = app || {};

  //
  // 
  // 
  this.directory                = path.join(__dirname, '../../data/');
  this.blocks                   = [];
  this.transactions             = [];

  //
  // work in mempool
  //
  this.routing_work_needed 	= 0.0;
  this.routing_work_in_mempool	= 0.0;

  //
  // mempool safety caps
  //
  this.transaction_size_cap     = 1024000000;// bytes hardcap 1GB
  this.transaction_size_current	= 0.0;
  this.block_size_cap           = 1024000000; // bytes hardcap 1GB
  this.block_size_current       = 0.0;


  //
  // processing timer
  //
  this.processing_active        = false;
  this.processing_speed         = 1000;
  this.processing_timer         = null;

  //
  // bundling timer
  //
  this.bundling_active          = false;
  this.bundling_speed           = 1000;
  this.bundling_timer           = null;

  //
  // hashmap
  //
  this.transactions_hmap        = [];  // index is tx.transaction.sig
  this.transactions_inputs_hmap = [];  // index is slip returnIndex()

  return this;

}
module.exports = Mempool;




Mempool.prototype.canBundleBlock = function canBundleBlock() {

  let prevblk = this.app.blockchain.returnLatestBlock();

  if (prevblk != null) {
    this.routing_work_needed = this.app.burnfee.returnWorkNeeded(prevblk.block.ts);
  } else {
    this.routing_work_needed = this.app.burnfee.returnWorkNeeded();
  }

  console.log("RWN: " + this.routing_work_needed + " -- " + this.routing_work_in_mempool);

  if (this.routing_work_in_mempool >= this.routing_work_needed) {
    return 1;
  }
  return 0;
}

//
// !!!!!!!! NOT FINISHED !!!!!
//
Mempool.prototype.containsBlock = function containsBlock(blk) {

  if (blk == null)                  { return 0; }
  if (blk.block == null)	    { return 0; }
  if (blk.is_valid == 0) 	    { return 0; }

  if (this.blocks_hmap[blk.block.sig] == 1) { return 1; }

  return 0;
}

Mempool.prototype.containsTransaction = function containsTransaction(tx) {

  if (tx == null)                  { return 0; }
  if (tx.transaction == null)      { return 0; }
  if (tx.transaction.from == null) { return 0; }

  if (this.transactions_hmap[tx.transaction.sig] == 1) { return 1; }
  for (let i = 0; i < tx.transaction.from.length; i++) {
    var slip_index = tx.transaction.from[i].returnIndex();
    if (this.transactions_inputs_hmap[slip_index] == 1) {
      return 1;
    }
  }
  return 0;
}


Mempool.prototype.containsGoldenTicket = function containsGoldenTicket() {
  for (let m = 0; m < this.transactions.length; m++) {
    if (this.transactions[m].isGoldenTicket() == 1) { return 1; }
  }
  return 0;
}

Mempool.prototype.resetTransactions = function resetTransactions() {

  this.transactions = [];
  this.transactions_hmap        = [];  // index is tx.transaction.sig
  this.transactions_inputs_hmap = [];  // index is slip returnSignatureSource()
  this.transaction_size_current = 0;

}




Mempool.prototype.initialize = function initialize() {
  if (this.app.BROWSER == 1) { return; }
  if (this.app.SPVMODE == 1) { return; }
  try {
    this.bundling_timer = setInterval(() => {
      if (this.canBundleBlock()) {
	this.bundleBlock();
      }
    }, this.bundling_speed);
  } catch (err) {
    console.log(err);
  }
}

Mempool.prototype.returnRoutingWorkNeeded = function returnRoutingWorkNeeded(prevblk) {
  this.routing_work_needed = this.app.burnfee.returnRoutingWorkNeeded(prevblk);
  return this.routing_work_needed;
}


Mempool.prototype.returnRoutingWorkAvailable = function returnRoutingWorkAvailable() {

  let v = Big(0);

  for (let i = 0; i < this.transactions.length; i++) {
    if (this.transactions[i].is_valid == 1) {
      let available_work = Big(this.transactions[i].returnRoutingWorkAvailable(this.app, this.app.wallet.returnPublicKey()));

      if (this.transactions[i].transaction.type == 1) {
        if (this.transactions[i].transaction.msg.target != this.app.blockchain.returnLatestBlockHash()) { available_work = Big(0); }
      }

      v = v.plus(available_work);
    }
  }

  return v.toFixed(8);
}







Mempool.prototype.addBlock = function addBlock(blk) {

  if (blk == null) { return false; }
  if (!blk.is_valid) { return false; }

  //
  // confirm this will not cause memory-exhaustion attacks
  //
  if ( (this.block_size_current + blk.size) > this.block_size_cap) { 
    console.log("ERROR 629384: mempool block queue at size limit");
    return;
  }

  for (let i = 0; i < this.blocks.length; i++) {
    if (this.blocks[i].returnHash() == blk.returnHash()) { return false; }
  }

  this.blocks.push(blk);
  this.block_size_current += blk.size;

  if (this.blocks.length > 0) {
    this.processBlockQueue();
  }

  return true;
}

Mempool.prototype.processBlockQueue = function processBlockQueue() {

  if (this.processing_timer == 1) { return; }
  this.processing_timer = 1;

  try {
    this.processing_timer = setInterval(() => {

      if (this.blocks.length > 0) {
	if (this.app.blockchain.indexing_active == 0) {
	  let blk = this.blocks.shift();
	  this.app.blockchain.addBlockToBlockchain(blk);
	}

      } else {
	this.processing_timer = 0;
	clearInterval(this.processing_timer);
      }

    }, this.processing_speed);
  } catch (err) {
    console.log(err);
  }

}



Mempool.prototype.bundleBlock = async function bundleBlock() {

  //
  // bundling
  //
  if (this.bundling_active == true) { return; }
  this.bundling_active = true;


  //
  // don't spam the public network
  //
  if (this.transactions.length == 1) {
    if (! this.app.network.isPrivateNetwork() || this.app.network.isProductionNetwork()) {
      if (this.transactions[0].transaction.type == 1) {
console.log("our only transaction is a golden ticket, not spamming the network...");
        return;
      }
    }
  }

  //
  // create block
  //
  try {

    let blk = new saito.block(this.app);
    let prevblk = this.app.blockchain.returnLatestBlock();
    blk.block.creator = this.app.wallet.returnPublicKey();

    if (prevblk != null) {
      blk.block.prevhash = prevblk.returnHash();
    }


    //
    // add mempool transactions
    //
    for (let i = 0; i < this.transactions.length; i++) {

      let addtx = 1;

      //
      // outdated golden ticket
      //
      if (this.transactions[i].transaction.type == 1) {
        if (this.transactions[i].transaction.msg.target != prevblk.returnHash()) {
          this.transactions.splice(i, 1);
          this.bundling_active = false;
          return;
        }
      }
      //
      // invalid transaction
      //
      if (this.transactions[i].is_valid == 0) {
        addtx = 0;
      }

      if (addtx == 1) {
        blk.transactions.push(this.transactions[i]);
      } else {
        if (this.transactions[i].is_valid == 0) {
          this.transactions.splice(i, 1);
          i--;
        }
      }

    }

    //
    // sanity check
    //
    // if the number of transactions in the block == 0 then
    // we have put together a block with NOTHING and there
    // has been some sort of error. In this case we empty
    // our entire mempool as a sanity check, and print out
    // an error message....
    //
    if (blk.transactions.length == 0 && blk.block.id > 1) {

      console.log("ERROR 51958: produced block with zero transactions. Aborting.");

      this.resetTransactions();
      this.app.miner.stopMining();
      this.app.miner.startMining(this.app.blockchain.returnLatestBlock());
      this.bundling_active = false;
      return;

    }


    //
    // add block producer surplus transaction
    //
    if (prevblk != null) {

      let total_work_needed    = this.app.burnfee.returnWorkNeeded(prevblk.block.ts, blk.block.ts);
      let total_work_available = blk.returnEmbeddedRoutingWork();
      let surplus_work = Big(total_work_available).minus(Big(total_work_needed));
console.log("pre error? 2: " + total_work_available + " -- " + total_work_needed + " -- " + surplus_work);

        // add fee surplus
        let tx = new saito.transaction();
        tx.transaction.ts  = new Date().getTime();
        tx.transaction.type = 2;

        // from slips
        tx.transaction.from = [];
        tx.transaction.from.push(new saito.slip(blk.block.creator, 0.0, 2));

        // to slips
        tx.transaction.to.push(new saito.slip(blk.block.creator, surplus_work.toFixed(8), 2));
        tx = this.app.wallet.signTransaction(tx);
        blk.transactions.push(tx);
    }


    //
    // queue and process
    //
    await blk.bundle(prevblk);
    if (blk.is_valid == 0) {
      console.log("ERROR 105812: block invalid when bundling. Aborting block bundling...");
      this.bundling_active = 0;
      return;
    }

    //
    // add it to mempool 
    //
console.log("pre error?");
    this.addBlock(blk);

  } catch(err) {
    console.log("ERROR 781029: unexpected problem bundling block in mempool: " + err);
  }

  //
  // reset
  //
  this.bundling_active = false;

}


/****






Mempool.prototype.processBlocks = async function processBlocks() {

  if (this.processing_active) {
    console.log("Mempool processing.... not adding new block to blockchain");
    return;
  }

  if (this.blocks.length == 0) {
    console.log("Mempool processing.... no blocks to add to blockchain");
    this.processing_active = false;
    return;
  }

  this.processing_active = true;

  while(this.blocks.length > 0 && this.app.monitor.canBlockchainAddBlockToBlockchain()) {
    console.log("CAN ADD BLOCK TO BLOCKCHAIN")
    let block_to_add = this.blocks.shift();
    if (block_to_add.created_on_empty_mempool &&
      this.app.blockchain.returnLatestBlockHash() != block_to_add.block.prevhash) {

      //
      // check it is still getting added to the longest chain, otherwise
      // we will need to dissolve it to recapture the transactions as
      // we will not notice if this block is pushed off the longest-chain
      // by someone else
      //

      for (let i = 0; i < block_to_add.transactions.length; i++) {
        console.log("RECOVERING TRANSACTIONS FROM BADLY-TIMED BLOCK WE PRODUCED: ");
        this.app.mempool.recoverTransaction(block_to_add.transactions[i]);
        this.app.mempool.reinsertRecoveredTransactions();
      }
    } else {
      await this.app.blockchain.addBlockToBlockchain(block_to_add);
    }
  }

  this.processing_active = false;
}












Mempool.prototype.importTransaction = function importTransaction(txjson) {
  var tx = new saito.transaction(txjson);
  if (tx == null) { return; }
  if (tx.is_valid == 0) { return; }
  tx.size = txjson.length;
  try {
    this.addTransaction(tx);
  } catch(err) {
    console.log(err)
  }
}


Mempool.prototype.addTransaction = async function addTransaction(tx, relay_on_validate=0) {

  let transaction_imported = 0;

  //
  // avoid adding if there is an obvious problem
  //
  if (this.containsTransaction(tx) == 1) { console.error("ALREADY CONTAIN TRANSACTION"); return; }
  if (tx == null)                        { console.error("NULL TX"); return; }
  if (tx.transaction == null)            { console.error("NULL TRANSACTION BODY"); return; }
  if (tx.is_valid == 0)                  { console.error("INVALID TX"); return; }
  //
  // do not add if it pushes us past our limit
  //
  if ( (tx.size + this.transaction_size_current) > this.transaction_size_cap) {
    console.error("TRANSACTION SIZE TOO LARGE")
    return;
  }

  //
  // check inputs all on longest chain
  //
  for (let z = 0; z < tx.transaction.from.length; z++) {
    if (tx.transaction.from[z].bhash != "") {
      if (this.app.blockchain.isBlockHashOnLongestChain(tx.transaction.from[z].bhash) != 1) {
        console.log(JSON.stringify(tx.transaction));
        console.log("received transaction with inputs not on longest chain. rejecting");
        return;
      }
    }
  }

  //
  // only accept one golden ticket
  //
  if (tx.isGoldenTicket()) {

    //
    // ensure golden ticket is for the latest block
    //
    if (tx.transaction.msg.target != this.app.blockchain.returnLatestBlockHash()) {
      return;
    }

    for (let z = 0; z < this.transactions.length; z++) {

      if (this.transactions[z].isGoldenTicket()) {

	//
	// double-check existing slip is for the right block
	//
        if (this.transactions[z].transaction.msg.target == this.app.blockchain.returnLatestBlockHash()) {

          //
          // if we already have a golden ticket solution, we will
          // replace it with this new one if the new one pays us
          // more in fees and/or is going to pay us money.
          //
          if (
            Big(tx.returnFeesUsable(this.app, this.app.wallet.returnPublicKey())).gt(Big(this.transactions[z].returnFeesUsable(this.app, this.app.wallet.returnPublicKey()))) || (
              this.transactions[z].transaction.from[0].add != this.app.wallet.returnPublicKey() &&
              tx.transaction.from[0].add == this.app.wallet.returnPublicKey()
            )
          ) {
            this.removeGoldenTicket();
            z = this.transactions.length+1;
          } else {
            transaction_imported = 1;
          }
        } else {
          this.removeGoldenTicket();
        }
      }
    }
  }


  if (transaction_imported === 0) {

    //
    // sending NULL as the block is used when adding to the mempool
    // the transaction validation function will by default then check
    // only for a transaction that is being added to the mempool, and
    // not for a transaction getting validated as part of a specific
    // block (i.e. vote consistency, etc.)
    //
    if (tx.validate(this.app, null)) {

      //
      // the slip validation code by default is checking to see if the slip is spend <= current_block_id
      // so that it can handle chain-reorganizations, but here we only want to make sure the slip is 
      // unspent, because a block we create should not be triggering a chain reorganization. So we 
      // have this extra function. In the next version we should fold this into transaction validation.
      //
      if (!tx.validateSlipsForMempool(this.app)) { return; }

      //
      // propagate if we can't use tx to create a block
      //
      if ( Big(this.bundling_fees_needed).gt(Big(tx.returnFeesUsable(this.app, this.app.wallet.returnPublicKey()))) ) {

        //
        // add to mempool before propagating
        //
        // console.log("ADDING TO MEMPOOL", JSON.stringify(tx));
        this.transactions.push(tx);
        this.transactions_size_current += tx.size;
        this.transactions_hmap[tx.transaction.sig] = 1;
        for (let i = 0; i < tx.transaction.from.length; i++) {
          // console.log("ADDING TO HMAP: ", tx.transaction.from[i].returnIndex());
          this.transactions_inputs_hmap[tx.transaction.from[i].returnIndex()] = 1;
        }

        if (relay_on_validate == 1) {
          this.app.network.propagateTransaction(tx);
        }
        return;

      } else {

        // propagate if we are a lite-client (not block-producer)
        if (this.app.BROWSER == 1 || this.app.SPVMODE == 1) {
          if (relay_on_validate == 1) {
            this.app.network.propagateTransaction(tx);
          }
        } else {


          //
          // add to mempool before propagating
          //
          this.transactions_size_current += tx.size;
          this.transactions.push(tx);

          // console.log("ADDING TO MEMPOOL", JSON.stringify(tx));
          this.transactions_hmap[tx.transaction.sig] = 1;
          for (let i = 0; i < tx.transaction.from.length; i++) {
            // console.log("ADDING TO HMAP: ", tx.transaction.from[i].returnIndex());
            this.transactions_inputs_hmap[tx.transaction.from[i].returnIndex()] = 1;
          }

        }
      }
    } else {
      console.log("totally failed to validate tx....");
      console.log("TX: ", JSON.stringify(tx));
      tx.is_valid = 0;
    }
  }
}






Mempool.prototype.removeBlock = function removeBlock(blk=null) {
  if (blk == null) { return; }
  for (let b = this.blocks.length-1; b >= 0; b--) {
    if (this.blocks[b].returnHash() == blk.returnHash()) {
      this.block_size_current -= this.blocks[b].size;
      this.blocks.splice(b, 1);
    }
  }
}


Mempool.prototype.removeBlockAndTransactions = function removeBlockAndTransactions(blk=null) {

  if (blk == null) { return; }

  this.clearing_active = true;

  // console.log("CURRENT TX IN MEMPOOL", this.transactions);

  //
  // lets make some hmaps
  //
  let mempool_transactions = [];
  let replacement          = [];

  //
  // create hashmap for mempool transactions
  //
  for (let b = 0; b < this.transactions.length; b++) {
    mempool_transactions[this.transactions[b].transaction.sig] = b;
  }

  //
  // find location of block transactions in mempool
  //
  for (let b = 0; b < blk.transactions.length; b++) {
    let location_in_mempool = mempool_transactions[blk.transactions[b].transaction.sig];
    if (location_in_mempool != undefined) {
      console.log("DEEMING TRANSACTION AS INVALID");
      this.transactions[location_in_mempool].is_valid = 0;
      this.transaction_size_current -= this.transactions[location_in_mempool].size;
    }
  }

  //
  // fill our replacement array
  //
  for (let t = 0; t < this.transactions.length; t++) {
    if (this.transactions[t].is_valid != 0) {
      console.log("TX RE-ADDED to REPLACEMENT ARRAY");
      console.log(this.transactions[t]);
      replacement.push(this.transactions[t]);
    } else {
      // console.log("TX DROPPED");
      // console.log(this.transactions[t]);
    }
  }

  this.transactions = replacement;

  //
  // and delete UTXO too
  //
  for (let b = 0; b < blk.transactions.length; b++) {
    //console.log("TX WE'RE REMOVING SLIPS FROM");
    //console.log(JSON.stringify(blk.transactions[b]));
    delete this.transactions_hmap[blk.transactions[b].transaction.sig];
    for (let i = 0; i < blk.transactions[b].transaction.from.length; i++) {
      //console.log("REMOVING: ", blk.transactions[b].transaction.from[i].returnIndex());
      //console.log(JSON.stringify(blk.transactions[b].transaction.from[i]));
      delete this.transactions_inputs_hmap[blk.transactions[b].transaction.from[i].returnIndex()];
    }
  }

  this.clearing_active = false;

  this.removeBlock(blk);

  // console.log("TX IN MEMPOOL", this.transactions.length);
  // console.log("TX INPUTS IN HMAP");
  // console.log(JSON.stringify(this.transactions_inputs_hmap));
}



Mempool.prototype.removeGoldenTicket = function removeGoldenTicket() {
  for (let i = this.transactions.length-1; i >= 0; i--) {
    if (this.transactions[i].transaction.type == 1) {
      //console.log("REMOVE GOLDEN TICKET");
      //console.log(JSON.stringify(this.transactions[i]));
      this.removeTransaction(this.transactions[i]);
      return;
    }
  }
}

Mempool.prototype.purgeExpiredGoldenTickets = function purgeExpiredGoldenTickets(prevblk_hash="") {
  for (let i = this.transactions.length - 1; i >= 0; i--) {
    if (this.transactions[i].transaction.type === 1) {
      if (this.transactions[i].transaction.msg.target != prevblk_hash) {
        this.removeTransaction(this.transactions[i]);
      }
    }
  }

  // Guaruntee that if we have no transactions in our mempool, then our inputs hmap is reset
  if (this.transactions.length == 0) { this.transactions_inputs_hmap = []; }
}


Mempool.prototype.removeTransaction = function removeTransaction(tx=null) {
  if (tx == null) { return; }

  //
  // remove transactions from queue
  //
  for (let t = this.transactions.length-1; t >= 0; t--) {
    if (this.transactions[t].transaction.sig == tx.transaction.sig) {
      this.transaction_size_current -= this.transactions[t].size;


      //
      // we safeguard to make sure we are not removing blocks
      // right now. If we ARE we just mark the transaction as
      // invalid so that it will be purged the next time a block
      // is added to our blockchain.
      //
      if (this.clearing_active == true) {
        this.transactions[t].is_valid == 0;
      } else {
        this.transactions.splice(t, 1);
      }
    }
  }

  //
  // and delete their UTXO too
  //
  delete this.transactions_hmap[tx.transaction.sig];
  for (let i = 0; i < tx.transaction.from.length; i++) {
    //console.log("REMOVING: ", tx.transaction.from[i].returnIndex());
    //console.log(JSON.stringify(tx.transaction.from[i]));
    delete this.transactions_inputs_hmap[tx.transaction.from[i].returnIndex()];
  }

}


Mempool.prototype.recoverTransaction = function recoverTransaction(tx) {

  if (tx == null) { return; }
  if (tx.is_valid == 0) { return; }
  if (tx.type != 0) { return; }
  if (!tx.validate(this.app)) { return; }
  console.log("RECOVERING TX");
  this.recovered.push(tx);

}


Mempool.prototype.reinsertRecoveredTransactions = function reinsertRecoveredTransactions() {

  if (this.recovered.length == 0) { return; }

  //
  // loop through recovered, getting txs
  //
  console.log("REINSERTING INTO MEMPOOL");
  while (this.recovered.length > 0) {
    var tx2insert = this.recovered[0];
    this.recovered.splice(0, 1);
    console.log(tx2insert);
    if (tx2insert.transaction.type == 0) {
      try {
        console.log("ADDING TX BACK");
        this.addTransaction(tx2insert, 0);
      } catch(err) {
        console.log(err);
      }
    }
  }

  //
  // should already be empty
  //
  this.recovered = [];

}

// https://www.youtube.com/watch?v=2k0SmqbBIpQ
Mempool.prototype.stop = function stop() {
 clearInterval(this.bundling_timer);
}


****/



