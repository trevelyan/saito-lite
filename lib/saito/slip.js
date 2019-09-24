'use strict';

class Slip {
  constructor(add="", amt="0", type=0, bid=0, tid=0, sid=0, bsh="", lc=1) {
    //
    // consensus variables
    //
    this.add 	= add;
    this.bid   	= bid;
    this.tid   	= tid;
    this.sid   	= sid;
    this.bsh  	= bsh;
    this.amt 	= amt.toString();

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
    this.type 	= type;

    //
    // non-consensus variables
    //
    this.lc     = lc;

    return this;
  }

  returnSignatureSource() {
    return this.type.toString() + this.bid.toString() + this.tid.toString() + this.sid.toString() + this.bsh + this.amt.toString();
  }

}

module.exports = Slip;


