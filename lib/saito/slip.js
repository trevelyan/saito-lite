'use strict';


function Slip(add="", amt="0", type=0, bid=0, tid=0, sid=0, bsh="", lc=1) {

  if (!(this instanceof Slip)) {
    return new Slip(add, amt, type, bid, tid, sid, bsh, lc);
  }

  //
  // consensus variables
  //
  this.slip     	= {};
  this.slip.add 	= add;
  this.slip.bid    	= bid;
  this.slip.tid    	= tid;
  this.slip.sid    	= sid;
  this.slip.bsh    	= bsh;
  this.slip.amt 	= amt.toString();
  this.slip.type 	= type; // 0 = normal transaction
		        	// 1 = golden ticket
		         	// 2 = fee ticket
		         	// 3 = automatic tx rebroadcasting
		         	// 4 = VIP transaction
		         	// 5 = golden chunk
				// 6 = staked, pending
				// 7 = staked, current

  //
  // non-consensus variables
  //
  this.lc     = lc;

  return this;

}
module.exports = Slip;

Slip.prototype.returnSignatureSource = function returnSignatureSource() {
  return this.slip.type.toString() + this.slip.bid.toString() + this.slip.tid.toString() + this.slip.sid.toString() + this.slip.bsh + this.amt.toString();
}


