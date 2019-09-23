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
    this.block.ts 	      	= new Date().getTime();
    this.block.prevbsh 		= "";
    this.block.merkle 	  	= "";
    this.block.creator 	  	= "";
    this.block.id 	      	= 1;
    this.block.bf 	      	= 0; 
    this.block.difficulty 	= 0.0;
    this.block.paysplit 	= 0.5;
    this.block.powsplit 	= 0.5;
    this.block.treasury 	= Big("2868100000.0");  // TODO
							//
							// fix treasury amount
							//
    this.block.stakepool  	= Big("0");		
    this.block.coinbase 	= Big("0.0");
    this.block.reclaimed 	= Big("0.0");
    this.block.sr 	      	= 0;			// 0 - staking table not refreshed
							// 1 - staking table refreshed

    //
    // hashmaps
    //
    this.txs_hmap		= [];


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




  async bundle(prevblk=null) {

    let mintxid = 1;
    let tx_sigs = [];

    //
    // default values
    //
    if (prevblk != null) {

      this.block.id 		= prevblk.block.id + 1;
      this.block.treasury 	= Big(prevblk.block.treasury).plus(Big(prevblk.block.reclaimed));
      this.block.coinbase 	= Big(this.block.treasury).div(this.app.blockchain.genesis_period).toFixed(8);
      this.block.treasury 	= this.block.treasury.minus(Big(this.block.coinbase)).toFixed(8);
      this.block.prevbsh 	= prevblk.returnHash();
      this.block.difficulty = prevblk.block.difficulty;
      this.block.paysplit 	= prevblk.block.paysplit;
      this.block.powsplit 	= prevblk.block.powsplit;
      this.block.ts		= new Date().getTime();
      this.block.bf 		= this.app.burnfee.returnBurnFee(prevblk, this);

      mintxid			= prevblk.returnMaxTxId() + 1;

    }


    //
    // reclaimed funds are the tokens that are
    // unspent in the block 1 GENESIS period ago
    // and thus will fall off the chain with the 
    // addition of this block.
    //
    // we add these to our treasury in the next 
    // block (see above)
    //
    let eblkd = await this.calculateRebroadcasts();


    //
    // reclaimed txs
    //
    this.block.reclaimed = eblkd.reclaimed;


    //
    // automatic transaction rebroadcasting
    //
    let rebroadcast_amt = Big(0.0);
    for (let i = 0; i < eblkd.rebroadcast.length; i++) {
      for (let ii = 0; ii < eblkd.rebroadcast[i].transaction.to.length; ii++) {
        rebroadcast_amt = rebroadcast_amt.plus(Big(rebroadcast_txarray[i].transaction.to[ii].amt));
      }
      this.transactions.push(eblk.rebroadcast[i]);
    }
      

    //
    // now check transactions
    //
    for (let i = 0; i < this.transactions.length; i++) {

      //
      // sequential ids
      //
      this.transactions[i].transaction.id = (mintxid + i);

      //
      // golden ticket
      //
      if (this.transactions[i].transaction.msg.target != prevblk.returnHash()) { this.is_valid = 0; }

      //
      // merkle sigs
      //
      tx_sigs[i] = this.transactions[i].returnMessageSignatureSource(this.app);;

      //
      // hashmap of txs
      //
      for (let ii = 0; ii < this.transactions[i].transaction.from.length; ii++) { this.txs_hmap[this.transactions[i].transaction.from[ii].add] = 1; }
      for (let ii = 0; ii < this.transactions[i].transaction.to.length; ii++) { this.txs_hmap[this.transactions[i].transaction.to[ii].add] = 1; }

    }


    //
    // merkle root
    //
    this.block.merkle = this.app.crypto.returnMerkleTree(tx_sigs);


    //
    // update difficulty and paysplit
    //

    return this;

  }





  async calculateRebroadcasts() {

    let expiring_data = { 
      reclaimed: "0.0", 
      rebroadcast: [], 
      validates: true 
    }

    if (this.app.BROWSER == 1 || this.app.SPVMODE == 1) { return expiring_data; }

    //
    // eliminated block id
    //
    let eblk_id = this.block.id - this.app.blockchain.genesis_period - 1;

    //
    // if no blocks to eliminate, return 0.0 and confirm valid
    //
    if (eblk_id < 1) { return expiring_data; }

    let txarray = [];
    let unspent_amt = Big(0.0);
    let eblk = await this.app.blockchain.loadBlockById(eblk_id, 1);

    for (let i = 0; i < eblk.transactions.length; i++) {
      for (var ii = 0; ii < eblk.transactions[i].transaction.to.length; ii++) {

        let slip 	= eblk.transactions[i].transaction.to[ii];
        slip.bid   	= eblk.returnId();
        slip.tid   	= eblk.transactions[i].transaction.id;
        slip.bhash 	= eblk.returnHash();
        slip.sid 	= ii;


        if (Big(slip.amt).gt(0)) {
          if (this.app.shashmap.validate_slip(slip.returnSignatureSource(), this.block.id)) {
            if (eblk.transactions[i].isRebroadcast(eblk, this, ii)) {

              //
              // create rebroadcast tx
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
              let tx = eblk.transactions[i].generateRebroadcastTransaction(slip.tid, slip.sid, 2);
              if (tx == null) {
                console.log("ERROR 481029: issue generating rebroadcast transaction...");
                process.exit();
              }

              //
              // update tx with bid
              //
              for (let iii = 0; iii < tx.transaction.from.length; iii++) {
                tx.transaction.from[iii].bid = this.block.id;
              }

	      expiring_data.rebroadcast.push(tx);

	    } else {
              unspent_amt = unspent_amt.plus(Big(slip.amt));
	    }
	  }
	}
      }
    }

    expiring_data.reclaimed = unspent_amt.toFixed(8);

    return expiring_data;
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
          if (this.transactions[i].transaction.msg.target != this.prevbsh) { available_work = Big(0); }
        }
        v = v.plus(available_work);
      }
    }
    return v.toFixed(8);
  }


  returnHash() {
    if (this.hash != "") { return this.hash; }
    this.prehash = this.app.crypto.hash(this.returnFingerprint());
    this.hash = this.app.crypto.hash(this.prehash + this.block.prevbsh);
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


  returnBlockPayouts(gt=null) {

    let payments = {};

    payments.producer_publickey 	= "";
    payments.producer_share 	= "0.0";

    payments.miner_publickey 	= "";
    payments.miner_share 		= "0.0";

    payments.router_publickey 	= "";
    payments.router_share 	= "0.0";

    payments.staker_publickey 	= "";
    payments.staker_share 	= "0.0";

    //////////////////////
    // no golden ticket //
    //////////////////////
    if (gt == null) {
      return payments;
    }


    let prevblk = this.app.blockchain.returnBlockByHash(this.block.prevbsh, 0)


    ///////////////////////////////////////////
    // golden ticket, but not for this block //
    ///////////////////////////////////////////
    if (0) {

    }


    ////////////////////////////////
    // golden ticket (this block) //
    ////////////////////////////////
    if (gt.target == this.returnHash()) {

      let producer_publickey		= this.block.creator;
      let miner_publickey			= gt.publickey;
      let router_publickey		= "";
      let staker_publickey		= "";

      let total_work_needed		= this.app.burnfee.returnWorkNeeded(prevblk.block.ts, this.block.ts, prevblk.block.bf); // int
      let total_work_available 		= this.returnEmbeddedRoutingWork();	// string
      let total_fees_in_block            	= this.returnTotalFees();		// string
      let producer_share			= Big(total_work_available).minus(Big(total_work_needed)); // Big
      let paysplit_share			= Big(total_fees_in_block).minus(producer_share).plus(this.returnCoinbase()); // Big
      let miner_share 			= paysplit_share.div(2).toFixed(8); 	// string
      let routing_share 			= paysplit_share.minus(Big(miner_share)).toFixed(8); // string

      if (Big(routing_share).gt(0)) {

        //
        // random decimal between 0-1 picks winning tx
        //
        let winnerHash = this.app.crypto.hash(solution.random).slice(0,12);
        let maxHash    = "ffffffffffff";
        let winnerNum  = parseInt(winnerHash, 16); // 16 = num is hex
        let maxNum     = parseInt(maxHash, 16);    // 16 = num is hex
        let winnerDec  = winnerNum / maxNum;

        let winner_fee = Big(total_fees_in_block).times(winnerDec);

        let winning_tx_idx = -1;
        let cumulative_fee = Big(0.0); 
        let stop = 0;

        //
        // TODO - faster search algorithm
        //
        // find winning tx randomly
        //
        for (let i = 0; i < this.transactions.length && stop == 0; i++) {
  	  cumulative_fee.plus(Big(this.transactions[i].returnFeesTotal(this.app)));
	  if (cumulative_fee.gte(winner_fee)) {
	    stop = 1;
	    winning_tx_idx = i-1;
	  }
        }

        //
        // assign winners
        //
        if (winning_tx_idx == -1) { 
  	  router_publickey = this.block.creator;	
        }

        //
        // or find winner in routing portion
        //
        else {

	  let winning_tx = this.transactions[winning_tx_idx];

	  //
	  // no path info, default to sender
	  //
	  if (winning_tx.transaction.path.length == 0) {
    	    router_publickey = winning_tx.transaction.from[0].add;
	  }

	  //
	  // path info, repeat random generation
	  //
    	  let winner2Hash = this.app.crypto.hash(winnerHash).slice(0,12);
    	  let winner2Num  = parseInt(winner2Hash, 16);
    	  let winner2Dec  = winner2Num / maxNum;

    	  let pathlength = winning_tx.transaction.path.length;
    	  let pathtotal  = winning_tx.returnFeesTotal(this.app);

    	  if (winner2Dec == 0) {
      	    router_publickey = winning_tx.transaction.path[0].to;
    	  } else {

      	    if (winnerDec == 1) {
    	      router_publickey = winning_tx.transaction.path[pathlength].to;
    	    } else {

	      let y = pathlength;
	      let x = 2 - (1/(Math.pow(2,(y-1))));  // i.e. 1.75 for 3 node path
	      let z = y * winner2Dec;

	      for (let i = 0; i < pathlength; i++) {
	        let a = 2 - (1/(Math.pow(2,(i-1))));
	        if (a <= z) { router_publickey = winning_tx.transaction.path[i].to; }
	      }

	    }
  	  }
        }
      }

      payments.producer_publickey	= producer_publickey;
      payments.miner_publickey 	= miner_publickey;
      payments.router_publickey	= router_publickey;
      payments.staker_publickey	= staker_publickey;

      payments.producer_share	= producer_share;
      payments.miner_share 	= miner_share;
      payments.router_share	= router_share;
      payments.staker_share	= staker_share;

    }

    return payments;

  }


  returnTotalFees() {
    let v = Big(0);
    for (let i = 0; i < this.transactions.length; i++) {
      v = v.plus(Big(this.transactions[i].returnTotalFees(this.app, this.block.creator)));
    }
    return v.toFixed(8);
  }

}

module.exports = Block;


