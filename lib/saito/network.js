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


