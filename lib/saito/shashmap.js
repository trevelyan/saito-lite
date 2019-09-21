'use strict'
const saito         = require('./saito');

class Shashmap {
  constructor() {
    this.slips          = [];

    return this;
  }

  unspend_transaction(tx) {
    for (let i = 0; i < tx.transaction.from.length; i++) {
      this.insert_slip(tx.transaction.from[i].returnSignatureSource(), -1);
    }
  }

  spend_transaction(tx, bid) {
    for (let i = 0; i < tx.transaction.from.length; i++) {
      this.insert_slip(tx.transaction.from[i].returnSignatureSource(), bid);
    }
  }

  insert_new_transaction(tx) {
    for (let i = 0; i < tx.transaction.to.length; i++) {
      this.insert_slip(tx.transaction.to[i].returnSignatureSource());
    }
  }

  insert_slip(slipidx="", val=-1) {
    this.slips[slipidx] = val;
  }

  delete_slip(slipidx="") {
    delete this.slips[slipidx];
  }

  validate_slip(slipidx="", bid) {
    if (this.slips[slipidx] <= bid) { return 1; }
    return 0;
  }

  validate_mempool_slip(slipidx="") {
    if (this.slips[slipidx] == 0) { return 0; }
    if (this.slips[slipidx] == -1) { return 1; }
    return 0;
  }

  slip_value(slipidx="") {
    return this.slips[slipidx];
  }

}

module.exports = Shashmap;
