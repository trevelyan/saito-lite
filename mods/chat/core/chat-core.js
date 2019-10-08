const saito = require('../../../lib/saito/saito.js');
const ModTemplate = require('../../../lib/templates/modtemplate.js');

class ChatCore extends ModTemplate {
  constructor(app) {
    super(app);

    this.app = app;
    this.name = "Chat";

    this.message_queue = [];
    this.is_processing_message_queue = false;
  }

  installModule() {}

  initialize() {}

  handlePeerRequest(app, req, peer, mycallback) {
    if (req.request == null) { return; }
    if (req.data == null) { return; }

    switch (req.request) {
      case "chat send message":
        var tx = new saito.transaction(JSON.parse(req.data));
        if (tx == null) { return; }
        this._receiveMessage(app, tx);
        if (mycallback) {
          mycallback({
            "payload": "success",
            "error": {}
          });
        }
        break;
      // case "chat request create room":
      //   var tx = new saito.transaction(req.data);
      //   if (tx == null) { return; }
      //   this._handleCreateRoomRequest(app, tx, peer);
      //   break;
      // case "chat response create room":
      //   var tx = new saito.transaction(req.data);
      //   if (tx == null) { return; }
      //   if (tx.transaction.to[0].add == app.wallet.returnPublicKey()) { this._handleCreateRoomResponse(app, tx); }
      //   break;
      default:
        break;
    }
  }

  _receiveMessage(app, tx) {
    tx.decryptMessage(this.app);
    var txmsg = tx.returnMessage();

    // need to track the path of a message
    if (txmsg.publickey == this.app.wallet.returnPublicKey()) { return; }

    // core
    this.message_queue.push(tx);
    if (!this.is_processing_message_queue) { this._processMessageQueue(); }
  }

  _processMessageQueue() {
    this.is_processing_message_queue = true;
    while (this.message_queue.length > 0) {
      let tx = this.message_queue.shift();
      // this._notifyRoom(tx);
      // this._saveMessageToDB(tx);
      this.app.network.sendTransactionToPeers(tx, "chat send message");
    }
    this.is_processing_message_queue = false;
  }
}

module.exports = ChatCore;