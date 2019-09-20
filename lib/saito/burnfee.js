'use strict'

const Big = require('big.js')

/**
 * BurnFee Constructor
 */
function BurnFee() {

  if (!(this instanceof BurnFee)) {
    return new BurnFee();
  }

  // default values
  this.start         = 10 * 1000; // seconds times milliseconds
  this.heartbeat     = 10;        // expect new block every 20 seconds
				  // maximum heartbeat is 2x the heartbeat
				  // see below in returnMovingBurnFee
  return this;
}
module.exports = BurnFee;



BurnFee.prototype.returnWorkNeeded = function returnWorkNeeded(prevts=0, current_time=(new Date().getTime()), start=this.start) {

  if (prevts == 0) { return 0; }

  let elapsed_time = current_time - prevts;

  if (elapsed_time <= 0) { elapsed_time = 1; }
  if (elapsed_time > (2000 * this.heartbeat)) { return 0; }
  
  return Math.floor(start / elapsed_time);

}


BurnFee.prototype.returnBurnFeeObject = function returnBurnFeeObject(prevblk=null, blk=null) {

  if (prevblk == null || blk == null) {
    return { start: this.start, current: 0 };
  }

  let bf = { start : 0, current : 0 };
  
  bf.start = prevblk.block.bf.start * Math.sqrt((this.heartbeat * 1000)/(Math.abs(blk.block.ts - prevblk.block.ts) + 1));

  if (prevblk != null && blk != null) {
    let elapsed_time = blk.block.ts - prevblk.block.ts;
    bf.current = Math.floor(prevblk.block.bf.start / elapsed_time);
  }

  return bf;

}



