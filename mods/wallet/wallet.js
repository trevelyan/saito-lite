//
// Our wallet is now a module...
//
var saito = require('../../lib/saito/saito');
var ModTemplate = require('../../lib/templates/template');
var util = require('util');


//////////////////
// CONSTRUCTOR  //
//////////////////
function Wallet(app) {

  if (!(this instanceof Wallet)) { return new Wallet(app); }

  Wallet.super_.call(this);

  this.app             = app;
  this.name            = "Wallet";
  this.handlesEmail    = 1;
  this.emailAppName    = "Saito Wallet";
  return this;

}
module.exports = Wallet;
util.inherits(Wallet, ModTemplate);




Wallet.prototype.onChainReorganization = function onChainReorganization(bid, bsh, lc) {

  if (lc == 1) {

    this.app.wallet.purgeExpiredSlips();
    this.app.wallet.resetSpentInputs();

    //
    // recreate pending slips
    //
    if (this.app.wallet.recreate_pending_transactions == 1) {

      for (let i = 0; i < this.app.wallet.wallet.pending.length; i++) {
        let ptx = new saito.transaction(this.app.wallet.wallet.pending[i]);
        let newtx = this.app.wallet.createReplacementTransaction(ptx);
        if (newtx != null) {
          newtx = this.app.wallet.signTransaction(newtx);
          if (newtx != null) {
            this.wallet.pending[i] = JSON.stringify(newtx);
          }
        }
      }
      this.recreate_pending_transactions = 0;
    }

  //
  //
  //
  } else {
    if (this.doesSlipInPendingTransactionsSpendBlockHash(block_hash)) {
      this.recreate_pending_transactions = 1;
    }
  }

  this.resetExistingSlips(bid, bsh, lc);

}


Wallet.prototype.onConfirmation = function onConfirmation(blk, tx, conf, app) {

}






