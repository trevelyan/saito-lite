const saito = require('../../../lib/saito/saito.js');
const ModTemplate = require('../../../lib/templates/modtemplate.js');
//const sqlite = require('sqlite3');


class ExplorerCore extends ModTemplate {
    constructor(app) {
        super(app);

        this.app = app;
        this.name = "Explorer";

    }
/*
    // Install Module //
    installModule() {

        try {
            this.db = sqlite.open('./data/explorer.sq3');
            var sql = "CREATE TABLE IF NOT EXISTS mod_transactions (id INTEGER, address TEXT, amt TEXT, bid INTEGER, tid INTEGER, sid INTEGER, bhash TEXT, lc INTEGER, rebroadcast INTEGER, PRIMARY KEY (id ASC))";
            let res = this.db.run(sql, {});
        } catch (err) { }

    };

    // Initialize Module //
    initialize() {

        if (this.db == null) {
            try {
                this.db = sqlite.open('./data/explorer.sq3');
            } catch (err) { }
        }

    }
*/

}

module.exports = ExplorerCore;
