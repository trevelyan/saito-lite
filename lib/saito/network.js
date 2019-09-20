const saito = require('./saito');


/**
 * Network Constructor
 * @param {*} app
 */
function Network(app) {

  if (!(this instanceof Network)) {
    return new Network(app);
  }


  this.app                      = app || {};


  this.peers                    = [];
  this.peer_monitor_timer       = null;
  this.peer_monitor_timer_speed = 2500;  // check socket status every 2.5 seconds
  this.peers_connected          = 0;
  this.peers_connected_limit    = 1000; // max peers

  //
  // we don't transmit fees that have
  // less than this in payment, in order
  // to provide a baseline.
  //
  this.minimum_rebroadcast_fee              = 0.001;

  return this;

}
module.exports = Network;



/**
 * close all network connections -- called on shutdown
 **/
Network.prototype.close = function close() {
//  for (let i = 0; i < this.peers.length; i++) {
//    this.peers[i].socket.disconnect();
//  }
  return;
}



/**
 * Is Private Network
 *
 * Returns 1 if we are the only node on this network.
 *
 * This is used by the mempool class when producing blocks
 * as we do not want to flood a public network with blocks
 * created when the burn value hits 0.0 if we are on a public
 * network -- it may just be that our connection dropped.
 */
Network.prototype.isPrivateNetwork = function isPrivateNetwork() {

  return 1;


  // we calculate the number of peers to which we ARE connected
  // and/or the number of peers we have specified that we want
  // to be connected with in order to determine if we are on a
  // private network.

  // private networks are useful for testing functionality, as
  // we will not produce blocks without transactions on a public
  // network.

  for (let i = 0; i < this.peers.length; i++) {
    if (this.peers[i].isConnected()) { return false; }
  }

  if (this.app.options.peers != null) { return false; }

  return true;

}

/**
 * In production, we never want to be freely producing blocks
 */
Network.prototype.isProductionNetwork = function isProductionNetwork() {
  if (this.app.BROWSER === 0) {
    return process.env.NODE_ENV === 'prod'
  } else {
    return false
  }
}


