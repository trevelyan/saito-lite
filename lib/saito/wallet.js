'use strict';

const saito = require('./saito');
//const Big      = require('big.js');

/**
 * Mempool Constructor
 * @param {*} app
 */
function Wallet(app) {

  if (!(this instanceof Wallet)) {
    return new Wallet(app);
  }

  this.app     			= app || {};

  this.wallet			= {};
  this.wallet.balance 		= 0;
  this.wallet.publickey 	= 0;
  this.wallet.privatekey 	= 0;

  return this;
}
module.exports = Wallet;




Wallet.prototype.returnBalance = function returnBalance() {
  return this.wallet.balance;
}

Wallet.prototype.returnPrivateKey = function returnPrivateKey() {
  return this.wallet.privatekey;
}
Wallet.prototype.returnPublicKey = function returnPublicKey() {
  return this.wallet.publickey;
}

Wallet.prototype.signMessage = function signMessage(msg) {
  return saito.crypto().signMessage(msg, this.returnPrivateKey());
}

Wallet.prototype.signTransaction = function signTransaction(tx) {
  if (tx == null) { return null; }
  for (var i = 0; i < tx.transaction.to.length; i++) { tx.transaction.to[i].sid = i; }
  tx.transaction.sig    = tx.returnSignature(this.app);
  return tx;
}



