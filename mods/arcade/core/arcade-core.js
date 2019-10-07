const saito = require('../../../lib/saito/saito.js');
const ModTemplate = require('../../../lib/templates/modtemplate.js');

class ArcadeCore extends ModTemplate {
  constructor(app) {
    super(app);
  }

  async onConfirmation(blk, tx, conf, app) {
    let arcade_self = app.modules.returnModule("Arcade");
    if (tx == null) { return; }

    if (conf == 0) {
      let txmsg = tx.returnMessage();
      switch (txmsg.request) {
        case 'invite':
          break;
        case 'gameover':
          break;
        case 'accept':
          break;
        case 'opengame':
          if (txmsg.module != "Arcade") { return; }
          break;
        default:
          break;
      }
    }
  }
}

module.exports = ArcadeCore;