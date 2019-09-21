'use strict';

const saito    = require('./saito');
const fs       = require('fs-extra')
const path     = require('path');
const sqlite   = require('sqlite');


function Storage(app, data, dest="blocks") {

  if (!(this instanceof Storage)) {
    return new Storage(app);
  }

  var dir = data || path.join(__dirname, '../../data');

  this.app                 = app || {};
  this.directory           = dir;
  this.dest                = dest;
  this.db                  = null;
  this.loading_active      = false;

  return this;

}
module.exports = Storage;


Storage.prototype.initialize = async function initialize() {

  //
  // load options file
  //
  this.loadOptions();

  //
  // save the file
  //
  this.saveOptions();

  //
  // only servers will have sqlite3 installed
  //
  if (this.app.BROWSER == 0) {

    // database
    try {

      this.db = await sqlite.open(this.directory + '/database.sq3');

      await this.createDatabaseTables();

      await Promise.all([
        // pragma temp store -- temp objects in memory (2) (default = 0)
        this.db.run("PRAGMA temp_store = 2"),

        // controls pagesize. default is 4096
        this.db.run("PRAGMA page_size = 32768"),

        // increase cache size (default is 1024)
        this.db.run("PRAGMA cache_size = 512000"),

        // radically faster db writes at cost of corruption on power failure
        this.db.run("PRAGMA synchronous = OFF"),

        // depreciated by small tweak
        this.db.run("PRAGMA count_changes = false"),

        // no rollbacks and db corruption on power failure
        this.db.run("PRAGMA journal_mode = OFF"),
      ]);
    } catch(err) {
      console.log(err);
    }
  }

  return;
}

/**
 * Create DB Tables
 */
Storage.prototype.createDatabaseTables = async function createDatabaseTables() {

  if (this.app.BROWSER == 1) { return; }

  try {
    await this.db.run("DROP TABLE IF EXISTS blocks");
    await this.createDatabaseTablesNonDestructive();
  } catch(err) {
    console.log(err);
  }
}



Storage.prototype.createDatabaseTablesNonDestructive = async function createDatabaseTablesNonDestructive() {

  if (this.app.BROWSER == 1) { return; }

  try {
    await this.db.run("\
      CREATE TABLE IF NOT EXISTS blocks (\
        id INTEGER, \
        reindexed INTEGER, \
        block_id INTEGER, \
        golden_ticket INTEGER, \
        min_tx_id INTEGER, \
        max_tx_id INTEGER, \
        block_json_id INTEGER, \
        hash TEXT, \
        ts INTEGER, \
        conf INTEGER, \
        longest_chain INTEGER, \
        shashmap INTEGER DEFAULT 0, \
        UNIQUE (block_id, hash), \
        PRIMARY KEY(id ASC) \
      )");

    await Promise.all([
      this.db.run("CREATE INDEX IF NOT EXISTS blocks_idx ON blocks (block_id, longest_chain)"),
      this.db.run("CREATE INDEX IF NOT EXISTS blocks_idx2 ON blocks (reindexed)"),
      this.db.run("CREATE INDEX IF NOT EXISTS blocks_idx3 ON blocks (hash)")
    ]);
  } catch(err) {
    console.log(err);
  }
}


/**
 * Executes an SQL command like INSERT, UPDATE, etc.
 *
 * @param {string} sql command
 * @param {*} parameters
 */
Storage.prototype.execDatabase = async function execDatabase(sql, params, mycallback=null) {

  if (this.app.BROWSER == 1) { return; }

  try {
    let res = await this.db.run(sql, params)
    if (mycallback == null) { return; }
    mycallback(null, res);
  } catch (err) {
    if (mycallback == null) { return; }
    mycallback(err);
    console.error(err);
  }
}






/**
 * Saves a block to database and disk and shashmap
 *
 * @param {saito.block} blk block
 * @param {int} lc longest chain
 */
Storage.prototype.saveBlock = async function saveBlock(blk=null, lc=0) {

  ///////////////////////
  // slips to shashmap //
  ///////////////////////
  //
  // insert the "to" slips so that future blocks can manipulate them
  //
  for (let b = 0; b < blk.transactions.length; b++) {
    for (let bb = 0; bb < blk.transactions[b].transaction.to.length; bb++) {

      //
      // this information is also needed by the wallet when inserting slips
      // if we edit this, we need to check wallet.processPayments to be sure
      // that slip information is still valid.
      //
      blk.transactions[b].transaction.to[bb].bid = blk.block.id;
      blk.transactions[b].transaction.to[bb].bhash = blk.returnHash();
      blk.transactions[b].transaction.to[bb].tid = blk.transactions[b].transaction.id;
      blk.transactions[b].transaction.to[bb].lc = lc;

      if (blk.transactions[b].transaction.to[bb].amt > 0) {

        if (this.app.BROWSER != 1 && blk != null && blk.is_valid ) { 
          let slip_map_index = blk.transactions[b].transaction.to[bb].returnIndex();
          this.app.shashmap.insert_slip(slip_map_index, -1);
	}

      }
    }
  }


  ///////////////////////
  // block to database //
  ///////////////////////
  //
  // this is > -1 if we are reading the block
  // off disk and restoring our database, in
  // which case we want to use our prior IDs
  // to maintain consistency with the saved
  // blocks
  //
  var sql = "";
  var params = "";
  if (blk.save_db_id > -1) {
    sql = `INSERT INTO blocks (id, block_id, golden_ticket, reindexed, block_json_id, hash, ts, conf, longest_chain, min_tx_id, max_tx_id) VALUES ($dbid, $block_id, $golden_ticket, 1, $block_json_id, $hash, $ts, 0, $lc, $mintxid, $maxtxid)`;
    params =  {
      $dbid: blk.save_db_id,
      $block_id: blk.block.id,
      $golden_ticket: blk.containsGoldenTicket(),
      $block_json_id : 0,
      $hash: blk.returnHash(),
      $ts: blk.block.ts,
      $lc: lc,
      $mintxid: blk.returnMinTxId(),
      $maxtxid: blk.returnMaxTxId()
    }
  } else {
    sql = `INSERT INTO blocks (block_id, golden_ticket, reindexed, block_json_id, hash, ts, conf, longest_chain, min_tx_id, max_tx_id) VALUES ($block_id, $golden_ticket, 1, $block_json_id, $hash, $ts, 0, $lc, $mintxid, $maxtxid)`;
    params = {
      $block_id: blk.block.id,
      $golden_ticket: blk.containsGoldenTicket(),
      $block_json_id : 0,
      $hash: blk.returnHash(),
      $ts: blk.block.ts,
      $lc: lc,
      $mintxid: blk.returnMinTxId(),
      $maxtxid: blk.returnMaxTxId()
    }
  };


  //////////////////
  // block to disk //
  ///////////////////
  try {

    var res = await this.db.run(sql, params);
    blk.filename = `${blk.block.ts}-${blk.returnHash()}.blk`;
    var tmp_filepath = `${this.directory}/${this.dest}/${blk.filename}`;
    let blkjson = JSON.stringify(blk.block);
    let txsjson = JSON.stringify(blk.transactions);

    if (!fs.existsSync(tmp_filepath)) {
      //fs.writeFile(tmp_filepath, blkjson, 'UTF-8');
      //fs.writeFile(tmp_filepath, blkjson, 'UTF-8');
      fs.writeFileSync(tmp_filepath, blkjson, 'UTF-8');
      fs.writeFileSync(tmp_filepath, "\n", 'UTF-8');
      fs.writeFileSync(tmp_filepath, txsjson, 'UTF-8');
    }

    return true;

  } catch (err) {
    console.log("ERROR: " + err);
  }

  return true;

}





Storage.prototype.loadSingleBlockFromDiskWithCallback = async function loadSingleBlockFromDiskWithCallback(hash, mycallback) {
  let blk = await this.loadSingleBlockFromDisk(hash);
  mycallback(blk);
}
Storage.prototype.loadSingleBlockFromDisk = async function loadSingleBlockFromDisk(hash) {
  if (this.app.BROWSER == 1 || this.app.SPVMODE == 1) { return; }

  var sql = `SELECT id, ts, hash, block_id FROM blocks WHERE hash=$hash`;
  var params = {
    $hash: hash
  }
  try {
    var row = await this.db.get(sql, params)

    if (row == undefined){ return null; }

    let fileID = `${row.ts}-${row.hash}.blk`;
    let blk = this.openBlockByFilename(fileID);

    if (blk == null) {
      console.error("Error loading block from disk: missing block: " +fileID);
      return null;
      //this.app.logger.logError(`Error loading block from disk: missing block: ${fileID}`,
      //  { message: "", stack: "" });
      //process.exit();
    }

    return blk;

  } catch (err) {
    console.log(err);
    return null;
  }

}

/**
 * Load block from disk by Id
 * @param {integer} block_id block id
 */
Storage.prototype.loadSingleBlockFromDiskByIdWithCallback = async function loadSingleBlockFromDiskByIdWithCallback(block_id, mycallback) {
  let blk = await this.loadSingleBlockFromDiskById(block_id);
  mycallback(blk);
}
Storage.prototype.loadSingleBlockFromDiskById = async function loadSingleBlockFromDiskById(block_id) {
  if (this.app.BROWSER == 1 || this.app.SPVMODE == 1) { return; }

  var sql = `SELECT id, ts, hash FROM blocks WHERE block_id=$block_id AND longest_chain = 1`;
  var params = {
    $block_id: block_id
  }

  try {

    let row = await this.db.get(sql, params);

    if (row == undefined) { return null; }

    let fileID = `${row.ts}-${row.hash}.blk`;

    let blk = this.openBlockByFilename(fileID);

    if (blk == null) {
      console.error("Error loading block from disk: missing block: " +fileID);
      return null;
      //this.app.logger.logError(`Error loading block from disk: missing block: ${fileID}`,
      //  { message: "", stack: "" });
      //process.exit();
    }

    return blk;
  } catch(err) {
    console.log("ERROR HERE!");
    console.log(err);
    return null;
  }
}


/**
 * if a block exists with name, open it from disk and
 * returns the block data
 *
 * @param {string} block filename
*/
Storage.prototype.openBlockByFilename = function openBlockByFilename(filename) {


  let block_filename = `${this.directory}/${this.dest}/${filename}`;

  try {
  //
  // readFileSync leads to issues loading from
  // disk. for some reason the only file is not
  // opened and we never hit the function inside
  //
  if (fs.existsSync(block_filename)) {
    let data = fs.readFileSync(block_filename, 'utf8');
    var blk = new saito.block(this.app, data);
    blk.filename = filename;

    if (!blk.is_valid) {
      console.log("BLK IS NOT VALID!");
      return null;
    }

    return blk;

  } else {
    //this.app.logger.logInfo(`cannot open: ${block_filename} as it does not exist on disk`);
    console.error(`cannot open: ${block_filename} as it does not exist on disk`)
    return null;
  }
  } catch (err) {
    console.log("Error reading block from disk");
    console.error(err);
    // this.app.logger.logError("Error reading block from disk", {message: "", stack: err})
  }

  return null;
}



/**
 * Load the options file
 */
Storage.prototype.loadOptions = async function loadOptions() {

  //
  // servers
  //
  if (this.app.BROWSER == 0) {


    if (fs.existsSync(__dirname + '/../../config/options')) {

      //
      // open options file
      //
      try {
        let optionsfile = fs.readFileSync(__dirname + '/../../config/options', 'utf8');
        this.app.options = JSON.parse(optionsfile);
      } catch (err) {
        // this.app.logger.logError("Error Reading Options File", {message:"", stack: err});
        console.error(err);
        process.exit();
      }

    } else {

      //
      // default options file
      //
      this.app.options = JSON.parse('{"server":{"host":"localhost","port":12101,"protocol":"http"}}');

    }
  //////////////
  // browsers //
  //////////////
  } else {

    let data = null;

    ///////////////////////////////
    // fetch from Chrome Storage //
    ///////////////////////////////
    //
    // we should have already fetched
    // our data from the Chrome backend
    // storage. (start.js)
    //
    //if (this.app.CHROME == 1) {
    //  if (this.app.options == null) { this.app.options = {}; }
    //  return;
    //}

    ////////////////////////////
    // read from localStorage //
    ////////////////////////////
    if (typeof(Storage) !== "undefined") {
      data = localStorage.getItem("options");
      this.app.options = JSON.parse(data);
    }

    //////////////////////////
    // or fetch from server //
    //////////////////////////
    if (data == null) {

      //
      // jquery
      //
      $.ajax({
        url: '/options',
        dataType: 'json',
        async: false,
        success: (data) => {
          this.app.options = data;
          console.log("LOADING: " + JSON.stringify(this.app.options));
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
          console.log("ERROR loading options file from server");
        }
      });
    }
  }
}

/**
 * Save the options file
 */
Storage.prototype.saveOptions = function saveOptions() {

  // if (this.app.options == null) { this.app.options = {}; }
  this.app.options = Object.assign({}, this.app.options);

  if (this.app.CHROME == 1) {
    chrome.storage.local.set({'options': JSON.stringify(this.app.options)});
    return;
  }

  //
  // servers
  //
  if (this.app.BROWSER == 0) {
    try {
      fs.writeFileSync(`${__dirname}/../../config/options`, JSON.stringify(this.app.options), null, 4);
    } catch (err) {
      // this.app.logger.logError("Error thrown in storage.saveOptions", {message: "", stack: err});
      console.error(err);
      return;
    }

  //
  // browsers
  //
  } else {
    if (typeof(Storage) !== "undefined") {
      localStorage.setItem("options", JSON.stringify(this.app.options));
    }
  }
}



/**
 * Reset the options file
 */
Storage.prototype.resetOptions = function resetOptions() {

  //
  // prevents caching
  //
  let tmpdate = new Date().getTime();
  let loadurl = `/options?x=${tmpdate}`;

  return new Promise((resolve, reject) => {
    $.ajax({
      url: loadurl,
      dataType: 'json',
      async: false,
      success: (data) => {
        this.app.options = data;
        this.saveOptions();
        resolve();
      },
      error: (XMLHttpRequest, textStatus, errorThrown) => {
        console.error(err);
        // this.app.logger.logError("Reading client.options from server failed", {message: "", stack: errorThrown});
        reject();
      }
    });
  })

}




///////////////////////
// saveClientOptions //
///////////////////////
//
// when browsers connect to our server, we check to see
// if the client.options file exists in our web directory
// and generate one here if it does not.
//
// this is fed out to client browsers and serves as their
// default options, specifying us as the node to which they
// should connect and through which they can route their
// transactions. :D
//
Storage.prototype.saveClientOptions = function saveClientOptions() {

  if (this.app.BROWSER == 1) { return; }
  let client_peer = Object.assign({}, this.app.server.server.endpoint, {synctype: "lite"});
  //
  // mostly empty, except that we tell them what our latest
  // block_id is and send them information on where our
  // server is located so that they can sync to it.
  //
  var t                      = {};
      t.keys                 = [];
      t.peers                = [];
      t.proxymod             = [];
      t.dns                  = [];
      t.blockchain           = {};
      t.registry             = this.app.options.registry;
      t.dns                  = this.app.dns.dns.domains;
      t.peers.push(client_peer);
      t.proxymod.push(client_peer);

  //
  // write file
  //
  try {
    fs.writeFileSync(`${__dirname}/web/client.options`, JSON.stringify(t));
  } catch(err) {
    console.log(err);
    console.error(err);
    // this.app.logger.logError("Error thrown in storage.saveBlock", {message: "", stack: err});
  }

  // fs.writeFileSync("saito/web/client.options", JSON.stringify(t), (err) => {
  //   if (err) {
  //   console.log(err);
  //   this.app.logger.logError("Error thrown in storage.saveBlock", {message: "", stack: err});
  //   }
  // });

}


/**
 * TODO: uses a callback and should be moved to await / async promise
 **/
Storage.prototype.returnBlockFilenameByHash = async function returnBlockFilenameByHash(block_hash, mycallback) {

  let sql    = "SELECT id, ts, block_id FROM blocks WHERE hash = $block_hash";
  let params = { $block_hash : block_hash };

  try {
    let row = await this.db.get(sql, params)
    if (row == undefined) {
      mycallback(null, "Block not found on this server");
      return
    }
    let filename = `${row.ts}-${block_hash}.blk`;
    mycallback(filename, null);
  } catch (err) {
    console.log("ERROR getting block filename in storage: " + err);
    mycallback(null, err);
  }

}


Storage.prototype.returnBlockFilenameByHashPromise = function returnBlockFilenameByHashPromise(block_hash) {
  return new Promise((resolve, reject) => {
    this.returnBlockFilenameByHash(block_hash, (filename, err) => {
      if (err) { reject(err) }
      resolve(filename);
    })
  })
}




/**
 * Query database
 **/
Storage.prototype.queryDatabase = async function queryDatabase(sql, params, callback) {
  if (this.app.BROWSER == 1) { return; }
  var row = await this.db.get(sql, params)
  var err = {};
  if (row == undefined) { return null; }
  callback(null, row);
}
Storage.prototype.queryDatabaseArray = async function queryDatabaseArray(sql, params, callback) {
  if (this.app.BROWSER == 1) { return; }
  var rows = await this.db.all(sql, params)
  var err = {};
  if (rows == undefined) { return null; }
  callback(null, rows);
}




