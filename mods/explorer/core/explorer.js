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

        console.log('install block explorer database if needed.');

        try {
            const fs = require('fs')

            const path = './data/explorer.sq3'

            try {
                if (fs.existsSync(path)) {
                    console.log('database exists');
                }
            } catch (err) {
                console.error(err)
            }


            this.db = await sqlite.open('./data/explorer.sq3');
            var sql = "CREATE TABLE IF NOT EXISTS mod_explorer_tx (id INTEGER, address TEXT, amt TEXT, bid INTEGER, tid INTEGER, sid INTEGER, bhash TEXT, lc INTEGER, rebroadcast INTEGER, PRIMARY KEY (id ASC))";
            let res = await this.db.run(sql, {});
            console.log(res);
            console.log('and should be installed.');
        } catch (err) { console.error(err); }

    };

    // Initialize Module //
    async initialize() {

        console.log('attatch block explorer database.');

        if (this.db == null) {
            try {
                this.db = await sqlite.open('./data/explorer.sq3');
            } catch (err) { console.error(err); }
        }

    }

    onConfirmation(blk, tx, conf, app) {
        console.log('explorer - on confirmation');
        if (conf == 0) {
        }
    
      }

      onNewBlock(blk, lc) {
          console.log('explorer - on new block');
      }

    /*  

    async onNewBlock(blk, lc) {
        console.log('explorer - new block');
        try {
            console.log(blk.transactions.length);
            for (let i = 0; i < blk.transactions.length; i++) {
                if (blk.transactions[i].transaction.type >= 3) {
                    for (let ii = 0; ii < blk.transactions[i].transaction.to.length; ii++) {
                        if (blk.transactions[i].transaction.to[ii].type == 4) {
                            let sql = "INSERT INTO mod_explorer_tx (address, amt, bid, tid, sid, bhash, lc, rebroadcast) VALUES ($address, $amt, $bid, $tid, $sid, $bhash, $lc, $rebroadcast)";
                            let params = {
                                $address: blk.transactions[i].transaction.to[ii].add,
                                $amt: blk.transactions[i].transaction.to[ii].amt,
                                $bid: blk.block.id,
                                $tid: blk.transactions[i].transaction.id,
                                $sid: ii,
                                $bhash: blk.returnHash(),
                                $lc: lc,
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

    */


}

module.exports = ExplorerCore;
