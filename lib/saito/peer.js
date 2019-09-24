const io = require('socket.io-client');
const saito = require('./saito');

class Peer {

  constructor(app, peerjson = "") {

    this.app = app || {};

    this.peer 				= {};
    this.peer.host 			= "localhost";
    this.peer.port 			= "12101";
    this.peer.publickey 		= "";
    this.peer.protocol 			= "http";
    this.peer.synctype 			= "full";         // full = full blocks

    this.peer.sendblks 			= 1;
    this.peer.sendtxs 			= 1;
    this.peer.sendgts 			= 1;
    this.peer.minfee			= 0.001;	  // minimum propagation fee

    this.peer.endpoint = {};
    this.peer.endpoint.host 		= "localhost";
    this.peer.endpoint.port 		= "12101";
    this.peer.endpoint.publickey 	= "";
    this.peer.endpoint.protocol 	= "http";

    this.peer.keylist 			= [];
    this.peer.handshake 		= returnHandshake();

    //
    // queue to prevent flooding
    //
    this.message_queue = [];
    this.message_queue_speed = 1000;             // sent
    this.message_queue_timer = null;

    //
    // track events
    //
    this.events_active = 0;

    //
    // lite-client configuration
    //
    if (this.app.SPVMODE == 1 || this.app.BROWSER == 1) {
      this.peer.synctype = "lite";
    }


    if (peerjson != "") {
      let peerobj = JSON.parse(peerjson);

      if (peerobj.peer.endpoint == null) {
        peerobj.peer.endpoint 		= {};
        peerobj.peer.endpoint.host 	= peerobj.peer.host;
        peerobj.peer.endpoint.port 	= peerobj.peer.port;
        peerobj.peer.endpoint.protocol 	= peerobj.peer.protocol;
      }

      this.peer = peerobj.peer;

      //
      // handshake reset every time
      //
      this.peer.handshake

    }


    return this;
  }




  initialize() {

    //
    // manage blockchain sync queue
    //
    this.message_queue_timer = setInterval(() => {
      if (this.message_queue.length > 0) {
        if (this.message_queue.length > 10) { this.message_queue = this.message_queue.splice(10); }
        if (this.socket != null) {
          if (this.socket.connected == true) {
            this.socket.emit('request', this.message_queue[0]);
            this.message_queue.splice(0, 1);
          }
        }
      }
    }, this.message_queue_speed);

  }





  returnHandshake() {

    let handshake 			= {};
        handshake.step			= 0;
        handshake.ts 			= new Date().getTime();    
        handshake.attempts 		= 0;
        handshake.complete 		= 0;
        handshake.challenge_mine  	= "";
        handshake.challenge_peer  	= "";
        handshake.verified		= 0;

  }





  connect(mode=0) {

    //
    // we are starting an outbound connection
    //
    if (mode == 0) {

      console.log("Generating outbound connection request...");

      if (this.socket) {
        try {
          this.socket.destroy();
        } catch (err) {
          console.log(err);
        }
        delete this.socket;
        this.socket = null;
      }

      this.socket = io.connect(`${this.peer.protocol}://${this.peer.host}:${this.peer.port}`, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: Infinity,
        transports: ['websocket']
      });

      this.addSocketEvents();

    }


    //
    // we have received a connection message (handshake)
    //
    if (mode == 1) {

      console.log("Incoming connection request, handshake getting initialized...");


    }

  }



  sendRequest(message, data="") {

    //
    // respect prohibitions
    //
    if (this.peer.sendblks == 0 && message == "block") { return; }
    if (this.peer.sendblks == 0 && message == "blockchain") { return; }
    if (this.peer.sendtxs == 0 && message == "transaction") { return; }
    if (this.peer.sendgts == 0 && message == "golden ticket") { return; }


    // find out initial state of peer and blockchain
    var um = {};
        um.request = message;
        um.data = data;

    if (this.socket != null) {
      if (this.socket.connected == true) {
        this.socket.emit('request', JSON.stringify(userMessage));
      } else {
        this.message_queue.push(JSON.stringify(userMessage));
        return;
      }
    }
  }




  addSocketEvents() {

    this.events_active = 1;

    try {

      //
      // connect
      //
      this.socket.on('connect', () => {

        console.log("socket connection has fired!");

	//
	// inform event channel
	//
        this.app.connection.emit('connection_up');

        // browsers get paranoid and rebroadcast any pending txs on connection to any peer
        //if (this.app.BROWSER == 1) {
        //  this.app.wallet.validateWalletSlips(this);
        //  this.app.network.sendPendingTransactions();
        //}

      });


      //
      // disconnect
      //
      this.socket.on('disconnect', () => {
        this.app.connection.emit('connection_dropped');
        this.app.connection.emit('peer_disconnect', this);
      });


      //
      // non-saito events
      //
      this.socket.on('event', () => { });


      //
      // saito events
      //
      this.socket.on('request', async (data, mycallback = null) => {

        if (data === undefined) { 
	  console.log("ERROR 012482: received undefined data from peer.");
	  return;
	}

        let message = JSON.parse(data.toString());

        //
        // module callback
        //
        //try {
        //  if (message.request != undefined) {
        //    this.app.modules.handlePeerRequest(message, this, mycallback);
        //  }
        //} catch (err) {
        //  console.log("Error triggered by: " + JSON.stringify(message));
        //  console.log(err);
        //}


        switch(message.request) {
/*
          case 'offchain':
            this.handleOffchainRequest();
            break;
          case 'handshake':
            this.handleHandshakeRequest(message);
            break;
          case 'connect-sig':
            this.handleConnectSigRequest(message);
            break;
          case 'connect-deny':
            this.socket = null;
            this.app.network.cleanupDisconnectedSocket(this);
            break;
          case 'handshake request':
            this.handshake_requests_out++;
            if (this.handshake_requests > 5) {
              this.socket = null;
              this.app.network.cleanupDisconnectedSocket(this);
            }
            this.sendHandshake();
            break;
          case 'slip check':
            this.handleSlipCheckRequest(message, mycallback);
            break;
          case 'slip check multiple':
            this.handleSlipCheckMultipleRequest(message, mycallback);
            break;
          case 'block':
            this.handleBlockRequest(message);
            break;
          case 'missing block':
            this.handleMissingBlockRequest(message, mycallback);
            break;
          case 'blockchain':
            this.handleBlockchainRequest(message);
            break;
          case 'keylist':
            this.handkeKeylistRequest(message);
            break;
          case 'transaction':
            this.handleTransactionRequest(message, mycallback);
            break;
          case 'golden ticket':
            this.handleGoldenTicketRequest(message);
            break;
          case 'dns':
            this.handleDNSRequest(message, mycallback);
            break;
          case 'dns multiple':
            this.handleDNSMultipleRequest(message, mycallback);
            break;
          case 'module':
            this.handleModuleRequest(message, mycallback);
            break;
*/
          default:
            //if (mycallback != null) {
            //  mycallback();
            //}
            break;
        }
      });

    } catch(err) {
      console.error("ERROR 581023: error handling peer request - " + err);
    }
  }





  inTransactionPath(tx) {
    if (tx == null) { return 0; }
    if (tx.isFrom(this.peer.publickey)) { return 1; }
    for (let i = 0; i < tx.transaction.path.length; i++) {
      if (tx.transaction.path[i].from == this.peer.publickey) { return 1; }
    }
    return 0;
  }


  addPathToTransaction(tx) {

    var tmptx = new saito.transaction();
    tmptx.transaction = JSON.parse(JSON.stringify(tx.transaction));

    // add our path
    var tmppath = new saito.path();
    tmppath.from = this.app.wallet.returnPublicKey();
    tmppath.to = this.returnPublicKey();
    tmppath.sig = this.app.crypto.signMessage(tmppath.to, this.app.wallet.returnPrivateKey());

    tmptx.transaction.path.push(tmppath);
    return tmptx;
  }
}

module.exports = Peer;
