'use strict';

class Slip {
  constructor(add="", amt="0", type=0, bid=0, tid=0, sid=0, bsh="", lc=1) {
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

    //
    // TYPES
    //
    // 0 = normal transaction
    // 1 = golden ticket
    // 2 = fee ticket
    // 3 = automatic tx rebroadcasting
    // 4 = VIP transaction
    // 5 = golden chunk
    // 6 = staked, pending
    // 7 = staked, current
    this.slip.type 	= type;

    //
    // non-consensus variables
    //
    this.lc     = lc;

    return this;
  }

  returnSignatureSource() {
    return this.slip.type.toString() + this.slip.bid.toString() + this.slip.tid.toString() + this.slip.sid.toString() + this.slip.bsh + this.slip.amt.toString();
  }

}

module.exports = Slip;


