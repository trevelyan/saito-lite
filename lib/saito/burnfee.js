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



BurnFee.prototype.returnWorkNeeded = function returnWorkNeeded(prevts=0, start=this.start, heartbeat=this.heartbeat) {

  let elapsed_time = prevts - (new Date().getTime());

  if (elapsed_time == 0) { elapsed_time = 1; }
  if (elapsed_time > (2000 * heartbeat)) { return 0; }
  
  return Math.floor(start / elapsed_time);

}


