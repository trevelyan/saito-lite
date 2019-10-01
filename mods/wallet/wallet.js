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
            newtx = app.wallet.signTransaction(newtx);
            if (newtx != null) {
              app.wallet.wallet.pending[i] = JSON.stringify(newtx);
            }
          }
        }
        this.recreate_pending_transactions = 0;
      }

    } else {
      if (this.doesSlipInPendingTransactionsSpendBlockHash(block_hash)) {
        this.recreate_pending_transactions = 1;
      }
    }

    this.resetExistingSlips(bid, bsh, lc);

  }


  onConfirmation(blk, tx, conf, app) {

    let slips 		= tx.returnSlipsToAndFrom(app.wallet.returnPublicKey());
    let to_slips  	= slips.to;
    let from_slips 	= slips.from;

    if (conf == 0) {

      //
      // any txs in pending should be checked to see if
      // we can remove them now that we have received
      // a transaction that might be it....
      //
      if (app.wallet.wallet.pending.length > 0) {

        for (let i = 0; i < app.wallet.wallet.pending.length; i++) {
          if (app.wallet.wallet.pending[i].indexOf(tx.transaction.sig) > 0) {
            app.wallet.wallet.pending.splice(i, 1);
            i--;
          } else {

            //
            // 10% chance of deletion
            //
            if (Math.random() <= 0.1) {

              let ptx = new saito.transaction(app.wallet.wallet.pending[i]);
              let ptx_ts = ptx.transaction.ts;
              let blk_ts = blk.block.ts;

              if ((ptx_ts + 12000000) < blk_ts) {
                app.wallet.wallet.pending.splice(i, 1);
                i--;
              }
            }
          }
        }
      }
 
 
      //
      // inbound payments
      //
      if (to_slips.length > 0) {
        for (let m = 0; m < to_slips.length; m++) {
          if (to_slips[m].amt > 0) {
            if (app.wallet.containsInput(to_slips[m]) == 0) {
              if (app.wallet.containsOutput(to_slips[m]) == 0) {
                app.wallet.addInput(to_slips[m]);
              }
            } else {
              if (lc == 1) {
                let our_index = to_slips[m].returnIndex();
                for (let n = app.wallet.wallet.inputs.length-1; n >= 0; n--) {
                  if (app.wallet.wallet.inputs[n].returnIndex() === our_index) {
                    app.wallet.wallet.inputs[n].lc = lc;
                  }
                }
              }
            }
          }
        }
      }


      //
      //
      //
      return;

/****
  //
  // outbound payments
  //
  if (from_slips.length > 0) {
    for (var m = 0; m < from_slips.length; m++) {

      var s = from_slips[m];

      //
      // TODO: optimize search based on BID
      //
      for (var c = 0; c < app.wallet.wallet.inputs.length; c++) {
        var qs = app.wallet.wallet.inputs[c];
        if (
          s.bid   == qs.bid &&
          s.tid   == qs.tid &&
          s.sid   == qs.sid &&
          s.bhash == qs.bhash &&
          s.amt   == qs.amt &&
          s.add   == qs.add &&
          s.rn    == qs.rn
        ) {
          if (app.wallet.containsOutput(s) == 0) {
            app.wallet.addOutput(app.wallet.wallet.inputs[c]);
          }
          app.wallet.wallet.inputs.splice(c, 1);
          app.wallet.wallet.spends.splice(c, 1);
          c = app.wallet.wallet.inputs.length+2;
        }
      }
    }
  }

****/

    } // conf = 0
  }


module.exports = Wallet;
