const saito = require('../../../lib/saito/saito.js');
const ModTemplate = require('../../../lib/templates/modtemplate.js');
const sqlite = require('sqlite');
const fs = require('fs');

class ExplorerCore extends ModTemplate {
    constructor(app) {
        super(app);

        this.app = app;
        this.name = "Explorer";

    }

    // Install Module //
    async installModule() {

        try {
            this.db = await sqlite.open('./data/explorer.sq3');
            var sql = "CREATE TABLE IF NOT EXISTS mod_explorer_tx (id INTEGER, address TEXT, amt TEXT, bid INTEGER, tid INTEGER, sid INTEGER, bhash TEXT, lc INTEGER, rebroadcast INTEGER, PRIMARY KEY (id ASC))";
            let res = await this.db.run(sql, {});
        } catch (err) { console.error(err); }

    };

    // Initialize Module //
    async initialize() {
        if (this.db == null) {
            try {
                this.db = await sqlite.open('./data/explorer.sq3');
            } catch (err) { console.error(err); }
        }

    }

    onConfirmation(blk, tx, conf, app) {
        if (conf == 0) {
            var explorer_self = app.modules.returnModule("Explorer");
            explorer_self.addTransactionsToDatabase(blk);
        }
    }

    onNewBlock(blk, lc) {
        console.log('explorer - on new block');
    }

    async addTransactionsToDatabase(blk) {
        try {
            console.log(blk.transactions.length);
            for (let i = 0; i < blk.transactions.length; i++) {
                if (blk.transactions[i].transaction.type >= -999) {
                    for (let ii = 0; ii < blk.transactions[i].transaction.to.length; ii++) {
                        if (blk.transactions[i].transaction.to[ii].type >= -999) {
                            let sql = "INSERT INTO mod_explorer_tx (address, amt, bid, tid, sid, bhash, lc, rebroadcast) VALUES ($address, $amt, $bid, $tid, $sid, $bhash, $lc, $rebroadcast)";
                            let params = {
                                $address: blk.transactions[i].transaction.to[ii].add,
                                $amt: blk.transactions[i].transaction.to[ii].amt,
                                $bid: blk.block.id,
                                $tid: blk.transactions[i].transaction.id,
                                $sid: ii,
                                $bhash: blk.returnHash(),
                                $lc: 1,
                                $rebroadcast: 0
                            }
                            let rows = await this.db.run(sql, params);
                        }
                    }
                }
            }
            return;
        } catch (err) {
            console.error(err);
        }

    }

    /*webServer(app, expressapp) {
        expressapp.get('/explorer', (req, res) => {
            res.sendFile(__dirname + '/web/index.html');
            document.querySelector('.main').innerHTML = "Hello worldyo";
            return;
        });
    };

    */

    webServer(app, expressapp) {

        var explorer_self = app.modules.returnModule("Explorer");

        ///////////////////
        // web resources //
        ///////////////////
        expressapp.get('/explorer/', function (req, res) {
            res.setHeader('Content-type', 'text/html');
            res.charset = 'UTF-8';
            res.write(explorer_self.returnIndexHTML(app));
            res.end();
            return;
        });
        expressapp.get('/explorer/style.css', function (req, res) {
            res.sendFile(__dirname + '/web/style.css');
            return;
        });
        expressapp.get('/explorer/vip', function (req, res) {
            explorer_self.printVIP(res);
        });
        expressapp.get('/explorer/block', function (req, res) {

            var hash = req.query.hash;

            if (hash == null) {

                res.setHeader('Content-type', 'text/html');
                res.charset = 'UTF-8';
                res.write("NO BLOCK FOUND1: ");
                res.end();
                return;

            } else {

                if (hash != null) {

                    let blk = explorer_self.app.storage.loadBlockByHash(hash);

                    if (blk == null) {
                        res.setHeader('Content-type', 'text/html');
                        res.charset = 'UTF-8';
                        res.write("NO BLOCK FOUND: ");
                        res.end();
                        return;
                    } else {
                        res.setHeader('Content-type', 'text/html');
                        res.charset = 'UTF-8';
                        res.write(explorer_self.returnBlockHTML(app, blk));
                        res.end();
                        return;
                    }

                }
            }
        });
        expressapp.get('/explorer/mempool', function (req, res) {

            res.setHeader('Content-type', 'text/html');
            res.charset = 'UTF-8';
            res.write(explorer_self.returnMempoolHTML());
            res.end();
            return;

        });
        expressapp.get('/explorer/blocksource', function (req, res) {

            var hash = req.query.hash;

            if (hash == null) {
                res.setHeader('Content-type', 'text/html');
                res.charset = 'UTF-8';
                res.write("NO BLOCK FOUND1: ");
                res.end();
                return;

            } else {

                if (hash != null) {

                    let blk = explorer_self.app.storage.loadBlockByHash(hash);
                    if (blk == null) {
                        res.setHeader('Content-type', 'text/html');
                        res.charset = 'UTF-8';
                        res.write("NO BLOCK FOUND1: ");
                        res.end();
                        return;
                    } else {
                        res.setHeader('Content-type', 'text/html');
                        res.charset = 'UTF-8';
                        res.write(explorer_self.returnBlockSourceHTML(app, blk));
                        res.end();
                        return;
                    }
                }
            }
        });

        expressapp.get('/explorer/transaction', async function (req, res) {

            var tid = req.query.tid;
            //var hash = req.query.bhash;
            if (tid == null) {

                res.setHeader('Content-type', 'text/html');
                res.charset = 'UTF-8';
                res.write("NO TRANSACTION FOUND: ");
                res.end();
                return;

            } else {

                let sql = "SELECT bhash FROM mod_explorer_tx WHERE tid = $id AND lc = 1";
                let params = { $id: tid };

                //app.storage.queryDatabase(sql, params, function (err, row) {
                let row = await explorer_self.db.get(sql, params);

                if (row == null) {

                    res.setHeader('Content-type', 'text/html');
                    res.charset = 'UTF-8';
                    res.write("NO TRANSACTION FOUND: ");
                    res.end();
                    return;

                } else {

                    var bhash = row.bhash;

                    let blk = explorer_self.app.storage.loadBlockByHash(bhash);
                    if (blk == null) {
                        res.setHeader('Content-type', 'text/html');
                        res.charset = 'UTF-8';
                        res.write("NO BLOCK FOUND1: ");
                        res.end();
                        return;
                    } else {
                        res.setHeader('Content-type', 'text/html');
                        res.charset = 'UTF-8';
                        res.write(explorer_self.returnTransactionHTML(blk, tid));
                        res.end();
                        return;
                    }
                }
            }
        });

    }

    returnHead() {
        return '<html> \
  <head> \
    <meta charset="utf-8"> \
    <meta http-equiv="X-UA-Compatible" content="IE=edge"> \
    <meta name="viewport" content="width=device-width, initial-scale=1"> \
    <meta name="description" content=""> \
    <meta name="author" content=""> \
    <title>Saito Network: Blockchain Explorer</title> \
    <link rel="stylesheet" type="text/css" href="/style.css" /> \
    <link rel="stylesheet" type="text/css" href="/assets/jsonTree/jsonTree.css" /> \
    <link rel="stylesheet" href="/font-awesome-5/css/all.css" type="text/css" media="screen"> \
    <script src="/assets/jsonTree/jsonTree.js"></script> \
  </head> ';
    }

    returnHeader() {
        return '<body> \
        \
        <div class="header header-home"> \
        <img class="logo" src="/logo.svg"> \
    </div>';
    }

    returnIndexMain() {
        return '<div class="explorer-main"> \
        <div class="explorer-data"><h4>Server Address:</h4> '+ this.app.wallet.returnPublicKey() + ' \
        <div class="explorer-data"><h4>Balance:</h4> '+ this.app.wallet.returnBalance().toString().split(".")[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "." + this.app.wallet.returnBalance().toString().split(".")[1] + ' \
        <div class="explorer-data"><h4>Mempool:</h4> <a href="/explorer/mempool">'+ this.app.mempool.transactions.length + ' txs</a>' + '\
        <div class="explorer-data"><h4>Search for Block (by hash):</h4> \
        <form method="get" action="/explorer/block"><input type="text" name="hash" class="hash_search_input" /> \
        <input type="submit" class="button" value="search" /></form> </div> \
        <div class="explorer-data"><h3>Recent Blocks:</h3></div> \
        <div id="block-list">'+ this.listBlocks() + '</div> \
      </div> ';
    }

    returnPageClose() {
        return '</body> \
        </html>';
    }

    /////////////////////
    // Main Index Page //
    /////////////////////
    returnIndexHTML(app) {
        var html = this.returnHead() + this.returnHeader() + this.returnIndexMain() + this.returnPageClose();
        return html;
    }

    returnMempoolHTML(){
        var html = this.returnHead() 
        html += this.returnHeader() 
        html += '<div class="explorer-main">'
        html += '<a class="button" href="/explorer/"><i class="fas fa-cubes"></i> back to blocks</a>'
        html += '<h3>Mempool Transactions:</h3><div class="json">' + JSON.stringify(this.app.mempool.transactions) + '</div></div>' 
        html += this.returnInvokeJSONTree();
        html += this.returnPageClose();
        return html;
    }

    returnBlockSourceHTML(app, blk) {
        var html = this.returnHead() 
        html += this.returnHeader() 
        html += '<div class="explorer-main">'
        html += '<a class="button" href="/explorer/block?hash=' + blk.returnHash() + '"><i class="fas fa-cubes"></i> back to block</a>'
        html += '<h3>Block Source:</h3><h4>' +blk.returnHash('hex') + '</h4><div class="json">' + JSON.stringify(blk.block, null, 4) + '</div></div>' 
        html += this.returnInvokeJSONTree();
        html += this.returnPageClose();
        return html;
    }

    returnInvokeJSONTree() {
    var jstxt = '\n <script> \n \
    var jsonObj = document.querySelector(".json"); \n \
    var jsonTxt = jsonObj.innerText.trim(); \n \
    jsonObj.innerHTML = ""; \n \
    var tree = jsonTree.create(JSON.parse(jsonTxt), jsonObj); \n \
    </script> \n'
    return jstxt;
    }

    listBlocks() {

        var explorer_self = this;

        var html = '<table class="blockchain_table">';
        html += '<tr><th></th><th>id</th><th>block hash</th><th>previous block</th></tr>';
        for (var mb = explorer_self.app.blockchain.index.blocks.length - 1; mb >= 0 && mb > explorer_self.app.blockchain.index.blocks.length - 200; mb--) {
            html += '<tr>';
            //var longestchainhash = explorer_self.app.blockchain.hash[explorer_self.app.blockchain.lc];
            //if (longestchainhash == explorer_self.app.blockchain.index.blocks[mb].returnHash()) {
            html += '<td>*</td>';
            //} else {
            //    html += '<td></td>';
            //}
            html += '<td><a href="/explorer/block?hash=' + explorer_self.app.blockchain.index.blocks[mb].returnHash('hex') + '">' + explorer_self.app.blockchain.index.blocks[mb].block.id + '</a></td>';
            html += '<td><a href="/explorer/block?hash=' + explorer_self.app.blockchain.index.blocks[mb].returnHash('hex') + '">' + explorer_self.app.blockchain.index.blocks[mb].returnHash() + '</a></td>';
            html += '<td>' + explorer_self.app.blockchain.index.blocks[mb].block.prevbsh.substring(0, 25) + '...</td>';
            html += '</tr>';
        }
        html += '</table>';
        return html;
    }


    ////////////////////////
    // Single Block Page  //
    ////////////////////////
    returnBlockHTML(app, blk) {
        var html = this.returnHead() + this.returnHeader();
        html += '<div class="explorer-main"> \
      <a href="/explorer"> \
          <button class="explorer-nav"><i class="fas fa-cubes"></i> back to blocks</button> \
        </a> \
      <h3>Block Explorer:</h3> \
        '+ this.listTransactions(blk) + ' \
      </div> '
        html += this.returnPageClose();
        return html;

    }

    listTransactions(blk) {

        var explorer_self = this;

        var html = '<table class="block_table">';
        html += '<tr><td><h4>id</h4></td><td>' + blk.block.id + '</td></tr>';
        html += '<tr><td><h4>hash</h4></td><td>' + blk.returnHash('hex') + '</td></tr>';
        html += '<tr><td><h4>source</h4></td><td><a href="/explorer/blocksource?hash=' + blk.returnHash('hex') + '">click to view source</a></td></tr>';
        html += '</table>';

        if (blk.transactions.length > 0) {

            html += '<h3>Bundled Transactions:</h3>';

            html += '<table class="block_transactions_table">';
            html += '<tr>';
            html += '<th>id</th>';
            html += '<th>sender</th>';
            html += '<th>fee</th>';
            html += '<th>type</th>';
            html += '</tr>';

            for (var mt = 0; mt < blk.transactions.length; mt++) {
                var tmptx = blk.transactions[mt];

                html += '<tr>';
                html += '<td><a href="/explorer/transaction?bhash=' + blk.returnHash() + '&tid=' + tmptx.transaction.id + '">' + tmptx.transaction.id + '</a></td>';
                html += '<td><a href="/explorer/transaction?bhash=' + blk.returnHash() + '&tid=' + tmptx.transaction.id + '">' + tmptx.transaction.from[0].add + '</a></td>';
                html += '<td>' + tmptx.returnFees() + '</td>';
                html += '<td>' + tmptx.transaction.type + '</td>';
                html += '</tr>';
            }
            html += '</table>';
        }
        return html;
    }




    //////////////////////////////
    // Single Transaction Page  //
    //////////////////////////////
    returnTransactionHTML(blk, txid) {

        var tmptx;

        for (var x = 0; x < blk.transactions.length; x++) {
            if (blk.transactions[x].transaction.id == txid) {
                tmptx = blk.transactions[x];
            }
        }
        var html = this.returnHead() + this.returnHeader();
        html += '<div class="explorer-main"> \
        <div class="explorer-nav-buttons"> \
      <a class="button" href="/explorer"><i class="fas fa-cubes"></i> back to blocks</a>  \
      <a class="button" href="/explorer/block?hash=' + blk.returnHash() + '"><i class="fas fa-list"></i> back to transactions</a> \
      </div> \
      <h3>Transaction Explorer:</h3> \
      <div class="json"> \
        '+ JSON.stringify(tmptx, null, 4) + ' \
      </div></div> '
        html += this.returnInvokeJSONTree();
        html += this.returnPageClose();

        return html;
    }

    shouldAffixCallbackToModule() { return 1; }

}

module.exports = ExplorerCore;
