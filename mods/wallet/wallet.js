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

  }


  onConfirmation(blk, tx, conf, app) {

    if (conf == 0) {
    }

  }



  shouldAffixCallbackToModule(module_name, tx=null) {
    if (tx != null) {
      if (tx.transaction.from[0].add == this.app.wallet.returnPublicKey()) { return 1; }
      if (this.returnSlipsTo(receiverPublicKey).length > 0) { return 1; }
    }
    return 0;
  }

}


module.exports = Wallet;

