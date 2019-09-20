'use strict'


const saito         = require('./saito');


/////////////////
// Constructor //
/////////////////
function Shashmap() {

  if (!(this instanceof Shashmap)) {
    return new Shashmap();
  }

  this.slips          = [];

  return this;

}
module.exports = Shashmap;




Shashmap.prototype.unspend_transaction = function unspend_transaction(tx) {
  for (let i = 0; i < tx.transaction.from.length; i++) {
    this.insert_slip(tx.transaction.from[i].returnSignatureSource(), -1);
  }
}

Shashmap.prototype.spend_transaction = function spend_transaction(tx, bid) {
  for (let i = 0; i < tx.transaction.from.length; i++) {
    this.insert_slip(tx.transaction.from[i].returnSignatureSource(), bid);
  }
}

Shashmap.prototype.insert_new_transaction = function insert_new_transaction(tx) {
  for (let i = 0; i < tx.transaction.to.length; i++) {
    this.insert_slip(tx.transaction.to[i].returnSignatureSource());
  }
}

Shashmap.prototype.insert_slip = function insert_slip(slipidx="", val=-1) {
  this.slips[slipidx] = val;
}

Shashmap.prototype.delete_slip = function delete_slip(slipidx="") {
  delete this.slips[slipidx];
}

Shashmap.prototype.validate_slip = function validate_slip(slipidx="", bid) {
  if (this.slips[slipidx] <= bid) { return 1; }
  return 0;
}

Shashmap.prototype.validate_mempool_slip = function validate_mempool_slip(slipidx="") {
  if (this.slips[slipidx] == 0) { return 0; }
  if (this.slips[slipidx] == -1) { return 1; }
  return 0;
}

Shashmap.prototype.slip_value = function slip_value(slipidx="") {
  return this.slips[slipidx];
}



