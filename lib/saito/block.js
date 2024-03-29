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
    // callbacks
    //
    this.callbacks  	= [];
    this.callbacksTx 	= [];


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
        // if (typeof blkjson === 'string') {
        //   this.block = JSON.parse(blkjson.toString("utf8"));
        // } else {
        this.block = blkjson.block;
        this.transactions = blkjson.transactions.map(tx => new saito.transaction(tx.transaction));
        // }
      } catch (err) {
        this.is_valid = 0;
        return;
      }
    }


    return this;
  }



  affixCallbacks() {
    for (let z = 0; z < this.transactions.length; z++) {
      var txmsg = this.transactions[z].returnMessage();
      this.app.modules.affixCallbacks(this.transactions[z], z, txmsg, this.callbacks, this.callbacksTx, this.app);
    }
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
      this.block.difficulty 	= prevblk.block.difficulty;
      this.block.paysplit 	= prevblk.block.paysplit;
      this.block.powsplit 	= prevblk.block.powsplit;
      this.block.ts		= new Date().getTime();
      this.block.bf 		= this.app.burnfee.returnBurnFee(prevblk, this);
      if (prevblk.transactions.length == 0) {
        mintxid			= prevblk.returnMaxTxId();
	if (mintxid == 0) 	{ mintxid = 1; }
      } else {
        mintxid			= prevblk.returnMaxTxId() + 1;
      }
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
    let number_of_golden_tickets = 0;
    for (let i = 0; i < this.transactions.length; i++) {

      //
      // sequential ids
      //
      this.transactions[i].transaction.id = (mintxid + i);

      //
      // golden ticket
      //
      if (this.transactions[i].transaction.type == 1) {

        number_of_golden_tickets++;
	if (number_of_golden_tickets > 1) {
	  console.log("ERROR 412523: second golden ticket found in block");
	  this.is_valid = 0;
	  return this;
        }

        //
        // add payment outputs
        //
        if (prevblk != null) {

          let payments = await prevblk.returnBlockPayouts(this.transactions[i].transaction.msg);

	  //
	  // add reclaimed from block
	  //
	  this.block.reclaimed = Big(this.block.reclaimed).plus(Big(payments.reclaimed)).toFixed(8);

	  let slips = [];
	  for (let i = 0; i < payments.blocks.length; i++) {

	    if (payments.blocks[i].producer_share > 0) {
	      slips.push(new saito.slip(payments.blocks[i].producer_publickey, payments.blocks[i].producer_share, 1));
      	    }
      	    if (payments.blocks[i].miner_share > 0) {
      	      slips.push(new saito.slip(payments.blocks[i].miner_publickey, payments.blocks[i].miner_share, 1));
      	    }
      	    if (payments.blocks[i].router_share > 0) {
              slips.push(new saito.slip(payments.blocks[i].router_publickey, payments.blocks[i].router_share, 1));
      	    }
      	    if (payments.blocks[i].staker_share > 0) {
      	      slips.push(new saito.slip(payments.blocks[i].staker_publickey, payments.blocks[i].staker_share, 1));
      	    }

    	  }
          if (slips.length > 0) {

            let newtx = new saito.transaction();
            newtx.transaction.from.push(new saito.slip(this.app.wallet.returnPublicKey(), 0.0, 2));
            newtx.transaction.to = slips;
            newtx.transaction.type = 2;

      	    //
            // including for reference
            //
      	    newtx.transaction.id  = this.transactions.length;
      	    newtx.transaction.msg = payments;
      	    newtx = this.app.wallet.signTransaction(newtx);
      	    this.transactions.push(newtx);


          }
        }


        if (this.transactions[i].transaction.msg.target != prevblk.returnHash()) { 
	  this.is_valid = 0; 
	  return this;
        }

      }

      //
      // merkle sigs
      //
      tx_sigs[i] = this.transactions[i].returnSignatureSource(this.app);

      //
      // hashmap of txs
      //
      for (let ii = 0; ii < this.transactions[i].transaction.from.length; ii++) { this.txs_hmap[this.transactions[i].transaction.from[ii].add] = 1; }
      for (let ii = 0; ii < this.transactions[i].transaction.to.length; ii++) { this.txs_hmap[this.transactions[i].transaction.to[ii].add] = 1; }

    }

    //
    // merkle root
    //
    if (tx_sigs.length > 0) {
      this.block.merkle = this.app.crypto.returnMerkleTree(tx_sigs).root;
    }

    //
    // update difficulty and paysplit
    //

    return this;

  }




  //
  // in validation mode, we provide list of TXS to check
  //
  async calculateRebroadcasts(txs=null) {

    let expiring_data = { 
      reclaimed: "0.0", 
      rebroadcast: [], 
      validates: true ,
      total_rebroadcast: 0
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

	      expiring_data.total_rebroadcast++;

	      //
	      // creating
	      //
	      if (txs == null) {

                //
                // create rebroadcast tx
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

	      //
	      // validating
	      //
	      } else {

            	let is_tx_in_block = 0;

		//
		// TODO - surely we can speed this loop up
		//
            	for (let v = 0; v < txs.length; v++) {
            	  if (txs[v].transaction.sig == eblk.transactions[i].transaction.sig) {
            	    is_tx_in_block = 1;
            	    v = txs.length + 1;
            	  }
            	}

            	//
            	// we have an eligible tx that has not
            	// been rebroadcast! this constitutes
            	// an attack
            	//
            	if (is_tx_in_block == 0) {
            	  expiring_data.validates = false;
		}

	      }

	    } else {
              unspent_amt = unspent_amt.plus(Big(slip.amt));
	    }
	  }
	}
      }
    }

    //
    // validate no extra txs
    //
    if (txs != null) {

      for (let v = 0; v < txs.length; v++) {
        if (txs[v].transaction.type >= 3) {

	  //
	  // all rebroadcast TXS can be identified by tx field
	  //
          if (this.transactions[v].transaction.msg.tx != undefined) {
            total_rebroadcast++;
          }
        }
      }

      if (total_rebroadcast != needs_rebroadcast) {
        expiring_data.validates = false;
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

  async runCallbacks(conf) {
    for (let i = this.confirmations + 1; i <= conf; i++) {
      for (let ii = 0; ii < this.callbacks.length; ii++) {
        this.callbacks[ii](this, this.transactions[this.callbacksTx[ii]], i, this.app);
      }
    }
    this.confirmations = conf;
  }

  spendInputs() {
    for (let i = 0; i < this.transactions.length; i++) {
      for (let ii = 0; ii < this.transactions[i].transaction.from.length; ii++) {
        if (this.transactions[i].transaction.from[ii].amt > 0) {
          this.app.shashmap.insert_slip(this.transactions[i].transaction.from[ii].returnSignatureSource(), this.block.id);
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



  async validate() {

    if (this.block.prevbsh == "") { return 1; }

    try {

      let reclaimed = "0";
      let prevblk = await this.app.blockchain.returnBlockByHash(this.block.prevbsh);
      let mintxid = 1;
      let tx_sigs = [];
      if (prevblk != null) { 
	if (prevblk.transactions.length == 0) {
	  mintxid = prevblk.returnMaxTxId(); 
	  if (mintxid == 0) { mintxid = 1; }
	} else {
	  mintxid = prevblk.returnMaxTxId()+1;
	}
      }

      //
      // check block headers
      //
      if (this.block.id != (prevblk.block.id+1)) {
	console.log("ERROR 482039: block id is not single increment over previous block");
	return 0;
      }

      let bt = Big(prevblk.block.treasury).plus(Big(prevblk.block.reclaimed));
      let cb = Big(bt).div(this.app.blockchain.genesis_period).toFixed(8);
          bt = bt.minus(Big(cb)).toFixed(8);

      if (this.block.treasury != bt) {
	console.log("ERROR 410829: block treasury does not validate in new block");
	return 0;
      }

      if (this.block.coinbase != cb) {
	console.log("ERROR 410829: block coinbase does not validate in new block");
	return 0;
      }

      if (this.block.difficulty != prevblk.block.difficulty) {
	console.log("ERROR 571928: block difficulty does not validate in new block");
	return 0;
      }
      if (this.block.paysplit != prevblk.block.paysplit) {
	console.log("ERROR 571928: block paysplit does not validate in new block");
	return 0;
      }
      if (this.block.powsplit != prevblk.block.powsplit) {
	console.log("ERROR 571928: block difficulty does not validate in new block");
	return 0;
      }

      let bf = this.app.burnfee.returnBurnFee(prevblk, this);
      if (this.block.bf != bf) {
	console.log("ERROR 571928: block difficulty does not validate in new block");
	return 0;
      }

      //
      // my timestamp must be bigger than last timestamp
      //
      if (prevblk.block.ts >= this.block.ts) {
        console.log("ERROR 729384: block timestamp not incremented from previous block");
        return 0;
      }



      let hmap = [];
      let number_of_golden_tickets = 0;
      let index_of_block_payment = -1;

      for (let i = this.transactions.length-1; i >= 0; i--) {

        //
        // sequential ids
        //
        if (this.transactions[i].transaction.id != (mintxid + i)) {
	  console.log("ERROR 517324: transaction ids are out-of-order when validating block - " + mintxid + "-" + i + " ------- " + this.transactions[i].transaction.id);
	  return 0;
	}

	//
	// fee transaction always follows golden ticket (if exists)
	//
	if (this.transactions[i].transaction.type == 2) {
	  if (index_of_block_payment != -1) {
	    console.log("ERROR 581029: two block paymeet (type=2) transactions in block");
	    return 0;
	  }
	  index_of_block_payment = i;
	}

        //
        // golden ticket
        //
        if (this.transactions[i].transaction.type == 1) {
	  if (this.transactions[i].transaction.msg.target != prevblk.returnHash()) {

	    console.log("ERROR 029312: golden ticket does not match prevblk hash");
	    return 0;

	  } else {

	    number_of_golden_tickets++;
	    if (number_of_golden_tickets > 1) {
	      console.log("ERROR 189842: two golden tickets in block");
	      return 0;
	    }

	    if (index_of_block_payment == -1) {
	      console.log("ERROR 697812: golden ticket in block, but not block payment transaction");
	      return 0;
	    }


	    //
	    // prevblk is not null here
	    //
            let payments = await prevblk.returnBlockPayouts(this.transactions[i].transaction.msg);
	    reclaimed = payments.reclaimed;	
	

            let slips = [];
            for (let x = 0; x < payments.blocks.length; x++) {
              if (payments.blocks[x].producer_share > 0) {
                slips.push(new saito.slip(payments.blocks[x].producer_publickey, payments.blocks[x].producer_share, 1));
              }
              if (payments.blocks[x].miner_share > 0) {
                slips.push(new saito.slip(payments.blocks[x].miner_publickey, payments.blocks[x].miner_share, 1));
              }
              if (payments.blocks[x].router_share > 0) {
                slips.push(new saito.slip(payments.blocks[x].router_publickey, payments.blocks[x].router_share, 1));
              }
              if (payments.blocks[x].staker_share > 0) {
                slips.push(new saito.slip(payments.blocks[x].staker_publickey, payments.blocks[x].staker_share, 1));
              }
	    }
	    for (let x = 0; x < slips.length; x++) { slips[x].sid = x; }

	    //
	    // check accurate
	    //
	    if (this.app.crypto.hash(JSON.stringify(slips)) == this.app.crypto.hash(JSON.stringify(this.transactions[index_of_block_payment].transaction.to))) {
	    } else {
	      console.log("ERROR 840192: to slips in block fee transaction invalid");
	      return 0;
	    }
	  }
	}

        //
        // merkle sigs
        //
        tx_sigs[i] = this.transactions[i].returnSignatureSource(this.app);;

        //
        // no duplicate inputs slips
        //
        for (let j = 0; j < this.transactions[i].transaction.from.length; j++) {
          if (hmap[this.transactions[i].transaction.from[j].returnSignatureSource()] != undefined) {
            console.log("ERROR 820493: multiple transactions spend same input detected");
            return 0;
          }
	  if (this.transactions[i].transaction.from[j].amt > 0) {
            hmap[this.transactions[i].transaction.from[j].returnSignatureSource()] = 1;
	  }
        }

        //
        // validate transactions
        //
        if (!this.transactions[i].validate(this.app, this)) {
          console.log(`ERROR 174233: block contains invalid transaction: ${i}`);
          this.transactions[i].is_valid = 0;
          return 0;
        }

      }


      //
      // if fully-synced
      //
      if (this.app.blockchain.isFullySynced() == 1) {

        let eblkd	= await this.calculateRebroadcasts(this.transactions);
	
        //
        // reclaimed txs
        //
	reclaimed = Big(reclaimed).plus(Big(eblkd.reclaimed));
        if (!Big(this.block.reclaimed).eq(reclaimed)) {
          console.log("ERROR 241948: reclaimed funds do not match expected when validating");
          return 0;
	};

	//
	// atr validates
	//
        if (eblkd.validates == false) {
	  console.log("ERROR 115293: rebroadcast transactions do not match when validating");
	  return 0;
	};
      }


      //
      // check merkle root
      //
      if (tx_sigs.length > 0) {
        if (this.block.merkle != this.app.crypto.returnMerkleTree(tx_sigs).root) {
	  console.log("ERROR 258102: merkle root does not match provided root");
  	  return 0;
        }
      }

      //
      // check difficulty and paysplit
      //

      //
      // check payments are OK
      //

    } catch (err) {
      console.log("ERROR 921842: unknown error while validating block...: " + err);
      return 0;
    }

    return 1;

  }








  async returnBlockPayouts(gt=null, rvalue={}, rloop=0) {

    if (rvalue.blocks == undefined) { 
      rvalue.blocks 			= []; 
      rvalue.reclaimed 			= "0";
    }

    let payments = {};
    payments.producer_publickey 	= "";
    payments.producer_share 		= "0.0";
    payments.miner_publickey 		= "";
    payments.miner_share 		= "0.0";
    payments.router_publickey 		= "";
    payments.router_share 		= "0.0";
    payments.staker_publickey 		= "";
    payments.staker_share 		= "0.0";

    payments.bsh			= this.returnHash();
    payments.bid			= this.block.id;
    payments.rloop			= rloop;


    //
    // no golden ticket? check treasury
    //
    if (gt == null) {

      if (this.block.prevbsh == "") {
	if (rloop == 10) {
          rvalue.reclaimed = Big(rvalue.reclaimed).plus(Big(payments.total_fees_in_block)).toFixed(8);
	  return rvalue;
	} else {
	  return rvalue;
	}
      } else {
        let prevblk = await this.app.blockchain.returnBlockByHash(this.block.prevbsh, 0);
	if (this.containsGoldenTicket()) {
	  return rvalue;
	} else {
	  return prevblk.returnBlockPayouts(gt, rvalue, rloop+1);
	}
      }    

    }


    //
    // first block
    //
    if (this.block.prevbsh == "") {
      if (rloop == 10) {
        rvalue.reclaimed = Big(rvalue.reclaimed).plus(Big(this.returnFees())).toFixed(8);
        return rvalue;
      } else {
        return rvalue;
      }
    }


    //
    // golden ticket
    //
    let prevblk = await this.app.blockchain.returnBlockByHash(this.block.prevbsh, 0);

    let producer_publickey            	= this.block.creator;
    let miner_publickey               	= "";
    let router_publickey              	= "";
    let staker_publickey              	= "";

    let total_work_needed             	= this.app.burnfee.returnWorkNeeded(prevblk.block.ts, this.block.ts, prevblk.block.bf); // int
    let total_work_available          	= this.returnEmbeddedRoutingWork();     // string
    let total_fees_in_block           	= this.returnFees();                    // string
    let producer_share                	= Big(total_work_available).minus(Big(total_work_needed)); // Big
    let paysplit_share                	= Big(total_fees_in_block).minus(producer_share).plus(this.returnCoinbase()); // Big
    let miner_share                   	= paysplit_share.div(2).toFixed(8);     // string
    let router_share                  	= paysplit_share.minus(Big(miner_share)).toFixed(8); // string
    let staker_share                  	= "0.0";


    //
    // pick the router
    //
    if (Big(router_share).gt(0)) {

      //
      // random decimal between 0-1 picks winning tx
      //
      let winnerHash = this.app.crypto.hash(gt.random).slice(0,12);
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
        cumulative_fee.plus(Big(this.transactions[i].returnFees(this.app)));
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
    	let pathtotal  = winning_tx.returnFees(this.app);

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



    if (rloop == 0) {
      //
      // winning miner
      //
      miner_publickey = gt.publickey; 
    } else {
      //
      // winning staker
      //
      staker_share = miner_share;
      miner_share = "0.0";
    }


    payments.producer_publickey	= producer_publickey;
    payments.miner_publickey 	= miner_publickey;
    payments.router_publickey	= router_publickey;
    payments.staker_publickey	= staker_publickey;

    payments.producer_share	= producer_share;
    payments.miner_share	= miner_share;
    payments.staker_share	= staker_share;
    payments.router_share	= router_share;

    payments.total_fees_in_block      	= total_fees_in_block;
    payments.total_work_needed     	= total_work_needed;
    payments.total_work_available     	= total_work_available;
    payments.paysplit_share           	= paysplit_share;


    rvalue.blocks.push(payments);

    if (this.containsGoldenTicket() || rloop == 10) {
      return rvalue;
    } else {
      return prevblk.returnBlockPayouts(gt, rvalue, rloop+1);
    }    

  }




  returnFees() {
    let v = Big(0);
    for (let i = 0; i < this.transactions.length; i++) {
      v = v.plus(Big(this.transactions[i].returnFees(this.app)));
    }
    return v.toFixed(8);
  }

  // Use this when we're saving data to disk
  returnBlockFileData() {
    let blkcontent = {
      block: JSON.parse(JSON.stringify(this.block)),
      transactions: JSON.parse(JSON.stringify(this.transactions))
    };
    return JSON.stringify(blkcontent);
  }

}

module.exports = Block;


