const saito = require('../../../lib/saito/saito.js');
const ModTemplate = require('../../../lib/templates/modtemplate.js');
const sqlite = require('sqlite');


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
            console.log(res);
            console.log('and should be installed.');
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
            var this_explorer = app.modules.returnModule("Explorer");
            console.log('explorer - on confirmation 0');
            this_explorer.addTransactionsToDatabase(blk);
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

    webServer(app, expressapp) {
        //expressapp.use('/explorer', path());
        expressapp.get('/explorer', (req, res) => {
            res.sendFile(__dirname + '/web/index.html');
            return;
        });
    };

    shouldAffixCallbackToModule() { return 1; }

}

module.exports = ExplorerCore;
