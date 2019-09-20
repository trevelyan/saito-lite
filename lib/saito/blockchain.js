const saito    = require('./saito');
const Big      = require('big.js');

function Blockchain(app) {

  if (!(this instanceof Blockchain)) { return new Blockchain(app); }

  this.app                   = app || {};


  this.index		     	= {};
  this.index.blocks		= [];

  this.bsh_lc_hmap           	= [];
  this.bsh_bid_hmap          	= [];

  this.lc_pos_set          	= false
  this.lc_pos             	= 0;

  this.genesis_ts            	= 0;
  this.genesis_bid           	= 0;
  this.genesis_period       	= 0;

  this.last_bsh              	= "";
  this.last_bid              	= 0;
  this.last_ts               	= 0;
  this.last_bf              	= 0.0;

  this.lowest_acceptable_ts  	= 0;
  this.lowest_acceptable_bsh 	= "";
  this.lowest_acceptable_bid	= 0;

  this.indexing_active          = 0;

  return this;

}
module.exports = Blockchain;



Blockchain.prototype.addBlockToBlockchain = async function addBlockToBlockchain(blk, force=false) {

  this.indexing_active = 1;

  ///////////////////
  // SANITY CHECKS //
  ///////////////////
  if (blk.is_valid == 0) {
    console.log("ERROR 178234: block is not valid when adding to chain. terminating...");
    this.indexing_active = 0;
    return;
  }

  if (blk.block.ts < this.genesis_ts || blk.block.id < this.genesis_bid) {
    console.log("ERROR 792837: block id precedes genesis period. terminating...");
    this.indexing_active = 0;
    return;
  }

  if (this.isHashIndexed(blk.returnHash())) {
    console.log("ERROR 582039: blockchain already contains this block hash. terminating...");
    this.indexing_active = 0;
    return;
  }


  //
  // create reference for previous lc
  //
  let last_lc_pos = this.lc_pos;

  //
  // previous block not indexed, but acceptable
  //
  if (blk.block.ts < this.lowest_acceptable_ts) {
    this.lowest_acceptable_ts = blk.block.ts;
  }


  //
  // track first block
  //
  // if we are adding our first block, we set this as our lowest
  // acceptable ts to avoid requesting earlier blocks ad infinitum
  // into the past.
  //
  // lowest acceptable bid must be updated so that we know the
  // earliest block we need to worry about when handling full slip
  // validation.
  //
  if (this.lowest_acceptable_ts == 0) {

    this.lowest_acceptable_bid = blk.block.id;
    this.lowest_acceptable_bsh = blk.returnHash();

    //
    // !!!!!!!!!!!! BLOCK !!!!!!!!!!!!
    //
    //if (this.app.options.blockchain != null) {
      this.lowest_acceptable_ts = this.last_ts;
    //}

    if (this.lowest_acceptable_ts == 0) {
      this.lowest_acceptable_ts = blk.block.ts;
    }

  } else {

    if (this.lowest_acceptable_ts > blk.block.ts) {
      if (!force) {
        this.lowest_acceptable_ts = blk.block.ts;
      }
    }

  }


  //
  // fetch missing blocks
  //
  if (blk.block.ts > this.lowest_acceptable_ts) {
    if (!this.isHashIndexed(blk.block.prevbsh))  {
      if (this.lc_pos_set == true) {
        if (blk.block.id > (this.index.blocks[this.lc_pos].bid - this.genesis_period)) {

          //
          // TODO
          //
          // send request for missing block
          //

        }
      }
    }
  }



  ////////////////////
  // insert indexes //
  ////////////////////
  let pos = this.binaryInsert(this.index.blocks, blk, (a, b) => { return a.block.ts - b.block.ts; });
  //let pos = this.binaryInsert(this.index.ts, ts, (a,b) => { return a - b; });
  this.bsh_bid_hmap[blk.returnHash()] = blk.block.id;
  this.index.blocks[pos] = blk;





  ////////////////////////////
  // identify longest chain //
  ////////////////////////////
  let i_am_the_longest_chain		= 0;
  let shared_ancestor_pos	  	= 0;
  let shared_ancestor_pos_found		= false;


  //
  // find shared ancestor position
  //
  if (this.index.blocks.length == 1) {

    if (this.last_bid > 0) {
      if (blk.block.prevbsh == this.last_bsh) {
        i_am_the_longest_chain = 1;
      }
    } else {
      i_am_the_longest_chain = 1;
    }

  } else {

    if (blk.block.id >= this.index.blocks[this.lc_pos].block.id) {

      //
      // find the last shared ancestor
      //
      let lblk = this.index.blocks[this.lc_pos];
      let nblk = this.index.blocks[pos];

      if (blk.block.id == lblk.block.id) {
        i_am_the_longest_chain = 1;
      }

      if (blk.block.prevbsh == lblk.block.bsh) {
        i_am_the_longest_chain = 1;
      } else {

        let lchain_pos 		= this.lc_pos;
        let nchain_pos 		= pos;
        let lchain_len 		= 0;
        let nchain_len 		= 0;
        let lchain_bf  		= lblk.block.bf;
        let nchain_bf  		= nblk.block.bf;
        let lchain_ts  		= lblk.block.ts;
        let nchain_ts  		= nblk.block.ts;
        let lchain_prevbsh	= lblk.block.prevbsh;
        let nchain_prevbsh	= nblk.block.prevbsh;

        let search_pos       	= null;
        let search_bf        	= null;
        let search_ts        	= null;
        let search_bsh      	= null;
        let search_prevbsh  	= null;

        if (nchain_ts >= lchain_ts) {
          search_pos = nchain_pos - 1;
        } else {
          search_pos = lchain_pos - 1;
        }

        while (search_pos >= 0) {

  	  let sblk = this.index.blocks[search_pos];

          search_ts	= sblk.block.ts;
          search_bf       = sblk.block.bf;
          search_bsh      = sblk.block.bsh;
          search_prevbsh  = sblk.block.prevbsh;

          //
          // hey look, it's the common ancestor!
          //
          if (search_bsh == lchain_prevbsh && search_bsh == nchain_prevbsh) {
            shared_ancestor_pos_found = true;
            shared_ancestor_pos = search_pos;
            search_pos = -1;

          //
          // keep looking
          //
          } else {

            if (search_bsh == lchain_prevbsh) {
              lchain_len++;
              lchain_prevbsh = this.index.blocks[search_pos].block.prevbsh;
              lchain_bf = parseFloat(lchain_bf) + parseFloat(this.index.blocks[search_pos].returnBurnFeeValue());
            }

            if (search_bsh == nchain_prevbsh) {
              nchain_prevbsh = this.index.blocks[search_pos].block.prevbsh;
              nchain_len++;
              nchain_bf = parseFloat(lchain_bf) + parseFloat(this.index.blocks[search_pos].returnBurnFeeValue());
            }

            shared_ancestor_pos = search_pos;
            search_pos--;

            //
            // new chain completely disconnected
            //
            if (shared_ancestor_pos == 1) {
              if (nchain_prevbsh == "") {
                await this.addBlockToBlockchainSuccess(blk, pos, 0);
                return;
              }
            }
            if (shared_ancestor_pos == 0) {
              if (nchain_prevbsh != lchain_prevbsh) {
                await this.addBlockToBlockchainSuccess(blk, pos, 0);
                return;
              }
            }
          }
	}

        //
        // longest chain if more routing AND burning work
        //
        if (nchain_len > lchain_len && nchain_bf >= lchain_bf && shared_ancestor_pos_found == true) { 
         i_am_the_longest_chain = 1;
        }
      }
    } else {

      console.log("edge case with unordered blocks...");

      //
      // this catches an edge case that happens if we ask for blocks starting from
      // id = 132, but the first block we RECEIVE is a later block in that chain,
      // such as 135 or so.
      //
      // in this case our blockchain class will treat the first block as the starting
      // point and we run into issues unless we explicitly reset the blockchain to
      // treat block 132 as the proper first block.
      //
      // so we reset this to our first block and mark it as part of the longest chain
      // the network will figure this out in time as further blocks build on it.
      //
      if (blk.block.prevbsh == this.last_bsh && blk.block.prevbsh != "") {

        //
	// reset later blocks
	//
        for (let h = pos+1; h < this.index.blocks.length; h++) {
          this.bsh_lc_hmap[this.index.blocks[h].block.bsh] = i_am_the_longest_chain;
	}

        //
        // onChainReorganization
        //
        this.onChainReorganization(this.index.blocks[h].block.id, this.index.blocks[h].returnHash(), 0);
        i_am_the_longest_chain = 1;

      }
    }
  }



  //
  // insert into LC hashmap
  //
  this.bsh_lc_hmap[this.index.blocks[pos].bsh] = i_am_the_longest_chain;

  //
  // update blockchain state variables depending
  //
  if (i_am_the_longest_chain == 1) {
    this.last_bsh  = this.index.blocks[pos].block.bsh;
    this.last_ts   = this.index.blocks[pos].block.ts;
    this.last_bid  = this.index.blocks[pos].block.id;
    this.lc_pos = pos;
    this.lc_pos_set = true;
  }

  //
  // old and new chains
  //
  let new_hash_to_hunt_for 	= "";
  let old_hash_to_hunt_for  	= "";
  let new_block_hashes     	= [];
  let old_block_hashes		= [];


  //
  // first block
  //
  if (i_am_the_longest_chain == 1 && this.index.blocks.length == 1) {
    this.addBlockToBlockchainSuccess(blk, pos);
    return;
  }

  //
  // other blocks
  //
  if (i_am_the_longest_chain == 1 && this.index.blocks.length > 0) {

    new_hash_to_hunt_for = blk.returnHash();
    old_hash_to_hunt_for = "";
    new_block_hashes     = [];
    old_block_hashes     = [];
    if (last_lc_pos != pos) { old_hash_to_hunt_for = this.index.blocks[last_lc_pos].block.bsh; }

    //
    // our new block builds on the longest chain
    //
    if (blk.block.prevbsh == old_hash_to_hunt_for) {
      new_block_hashes.push(new_hash_to_hunt_for);
    }

    //
    // we need to wind / unwind the chain
    //
    else {

      let min_block_idx = shared_ancestor_pos + 1;
      let max_block_idx = this.index.blocks.length;

      for (let i = max_block_idx; i >= min_block_idx; i--) {

        if (this.index.blocks[i].block.bsh == old_hash_to_hunt_for) {
          old_hash_to_hunt_for = this.index.blocks[i].block.prevbsh;
          old_block_hashes.push(this.index.blocks[i].block.bsh);
        }

	if (this.index.blocks[i].bsh == new_hash_to_hunt_for) {
          new_hash_to_hunt_for = this.index.blocks[i].block.prevbsh;
          new_block_hashes.push(this.index.blocks[i].block.bsh);
        }

      }

      old_block_hashes.reverse();
      new_block_hashes.reverse();

    }

  } else {

    console.log("Block is not on the longest chain...");

  }

  this.validate(
    blk,
    pos,
    i_am_the_longest_chain,
    new_block_hashes,
    old_block_hashes
  );

}

Blockchain.prototype.validate = function validate(blk, pos, i_am_the_longest_chain, new_block_hashes, old_block_hashes) {

  console.log("VALIDATING: " + blk.returnHash() + " -- " + pos + " -- " + i_am_the_longest_chain + " -- " + JSON.stringify(new_block_hashes) + " --- " + JSON.stringify(old_block_hashes));

  this.addBlockToBlockchainSuccess(blk, pos, i_am_the_longest_chain);

}
Blockchain.prototype.addBlockToBlockchainSuccess = function addBlockToBlockchainSuccess(blk, pos, i_am_the_longest_chain, force=false) {

  console.log("SUCCESS ADDING BLOCK: " + blk.returnHash() + " -- " + pos + " -- " + i_am_the_longest_chain);

  //
  // permit addition of next block
  //
  this.indexing_active = 0;

}
Blockchain.prototype.addBlockToBlockchainFailure = function addBlockToBlockchainFailure(blk, pos, i_am_the_longest_chain, force=no) {

  console.log("FAILURE ADDING BLOCK: " + blk.returnHash() + " -- " + pos + " -- " + i_am_the_longest_chain);

  //
  // permit addition of next block
  //
  this.indexing_active = 0;

}


/**
 * Binary Insert algorithm
 * @param {array} list
 * @param {string} item
 * @param {string} compare
 * @param {string} search
 */
Blockchain.prototype.binaryInsert = function binaryInsert(list, item, compare, search) {

  var start = 0;
  var end = list.length;

  while (start < end) {

    var pos = (start + end) >> 1;
    var cmp = compare(item, list[pos]);

    if (cmp === 0) {
      start = pos;
      end = pos;
      break;
    } else if (cmp < 0) {
      end = pos;
    } else {
      start = pos + 1;
    }
  }

  if (!search) { list.splice(start, 0, item); }

  return start;
}


Blockchain.prototype.onChainReorganization = function onChainReorganization(bsh, bid, lc) {

  console.log("ON CHAIN REORG: " + bsh + " - " + bid + " / " + lc);

}

Blockchain.prototype.isHashIndexed = function isHashIndexed(hash) {
  if (this.bsh_bid_hmap[hash] > 0) { return true; }
  return false;
};


Blockchain.prototype.returnLatestBlock = function returnLatestBlock() {
  if (this.index.blocks.length == 0) { return null; }
  return this.index.blocks[this.lc_pos];
}
Blockchain.prototype.returnLatestBlockHash = function returnLatestBlockHash() {
  let blk = this.returnLatestBlock();
  if (blk == null) { return ""; }
  return blk.returnHash();
}
Blockchain.prototype.returnLatestBlockTimestamp = function returnLatestBlockTimestamp() {
  let blk = this.returnLatestBlock();
  if (blk == null) { return 0; }
  if (blk.block == null) { return 0; }
  return blk.block.ts;
}




