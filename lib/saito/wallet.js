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

  return this;
}
module.exports = Wallet;




Wallet.prototype.returnBalance = function returnBalance() {
  return this.wallet.balance;
}

Wallet.prototype.returnPublicKey = function returnPublicKey() {
  return this.wallet.publickey;
}

Wallet.prototype.signMessage = function signMessage(msg) {
  return saito.crypto().signMessage(msg, this.returnPrivateKey());
}



