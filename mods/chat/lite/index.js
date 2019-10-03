// const  = require('../../../lib/saito.js');
const saito_lib = require('../../../lib/index.js').saito_lib;
const ModTemplate = require('../../../lib/templates/modtemplate.js');

class ChatLite extends ModTemplate {
  constructor(app) {
    super(app)

    this.app = app
    this.name = "Chat"
    this.rooms = {
      'ALL': {
        messages: [
          {
            id: "1",
            timestamp: new Date().getTime(),
            author: "bearguy@saito",
            message: "Welcome to Chat!"
          }
        ]
      }
    };
  }

  initialize() {}

  handlePeerRequest(app, req, peer, mycallback) {
    if (req.request == null) { return; }
    if (req.data == null) { return; }

    switch (req.request) {
      case "chat send message":
        var tx = new saito_lib.transaction(req.data);
        if (tx == null) { return; }
        this._receiveMessage(app, tx);
        if (mycallback) {
          mycallback({
            "payload": "success",
            "error": {}
          });
        }
        break;
      default:
        break;
    }
  }

  _receiveMessage(app, tx) {
    // let room_idx = this._returnRoomIDX(txmsg.room_id);
    // if (room_idx === parseInt(room_idx, 10)) {
    // let txmsg = tx.returnMsg();

    this.addMessageToRoom(tx);

    // need to call some sort of passed function here to render our room;

    // should only bind if we're in the right place
    this.addMessageToDOM(tx);
    this.scrollToBottom();

    //this._addMessageToRoom(tx, room_idx, app);
    // }
  }

  addMessageToRoom(tx) {
    var txmsg = tx.returnMessage();
    let { room_id, publickey, message, sig } = txmsg;
    this.rooms[room_id].messages.push({id: sig, timestamp: tx.transaction.ts, author: publickey, message});
  }

  // will be binded
  addMessageToDOM(tx) {}
  scrollToBottom() {}
}

module.exports = ChatLite;