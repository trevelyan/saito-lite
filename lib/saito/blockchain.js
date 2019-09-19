const saito    = require('./saito');
const Big      = require('big.js');

function Blockchain(app) {

  if (!(this instanceof Blockchain)) { return new Blockchain(app); }

  this.app                   = app || {};

  return this;

}
module.exports = Blockchain;





Blockchain.prototype.returnLatestBlock = function returnLatestBlock() {
  return null;
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




