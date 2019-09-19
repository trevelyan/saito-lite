const saito = require('./saito');



/**
 * Constructor
 */
function Server(app) {

  if (!(this instanceof Server)) {
    return new Server(app);
  }

  return this;

}
module.exports = Server;




Server.prototype.close = function close() {
  //this.webserver.close();
}

