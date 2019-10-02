// const  = require('../../../lib/saito.js');
import { saito_lib } from '../../../lib/index.js';
const ModTemplate = require('../../../lib/templates/modtemplate.js');

class ChatLite extends ModTemplate {
  constructor(app) {
    super(app)

    this.app = app
    this.name = "Chat"
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
    //let room_idx = this._returnRoomIDX(txmsg.room_id);
    //if (room_idx === parseInt(room_idx, 10)) {
    // let txmsg = tx.returnMsg();
    console.log(tx);
    //this._addMessageToRoom(tx, room_idx, app);
    // }
  }
}

export default ChatLite;