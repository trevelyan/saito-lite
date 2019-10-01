//
// Our wallet is now a module...
//
var saito = require('../../lib/saito/saito');
var ModTemplate = require('../../lib/templates/modtemplate.js');


//////////////////
// CONSTRUCTOR  //
//////////////////
class Wallet extends ModTemplate {
  constructor(app) {
    super();

    this.app             = app;
    this.name            = "Wallet";
    this.handlesEmail    = 1;
    this.emailAppName    = "Saito Wallet";
    return this;
  }

  onChainReorganization(bid, bsh, lc) {

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

  onConfirmation(blk, tx, conf, app) {}

}


module.exports = Wallet;