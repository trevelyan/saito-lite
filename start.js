const saito = require('./lib/saito/saito');

var app                   = {};
    app.BROWSER           = 0;
    app.SPVMODE           = 0;
    app.CHROME            = 0;
    app.GENESIS_PUBLICKEY = "npDwmBDQafC148AyhqeEBMshHyzJww3X777W9TM3RYNv";

//
// set basedir
//
global.__webdir = __dirname + "/lib/saito/web/";

initSaito();


async function initSaito() {


  ////////////////////
  // Load Variables //
  ////////////////////
  try {
    app.crypto     = new saito.crypto();
    app.connection = new saito.connection();
    app.storage    = new saito.storage(app);
    app.shashmap   = new saito.shashmap(app);
    app.mempool    = new saito.mempool(app);
//    app.voter      = new saito.voter(app);
    app.wallet     = new saito.wallet(app);
//    app.miner      = new saito.miner(app);
//    app.browser    = new saito.browser(app);
//    app.archives   = new saito.archives(app);
//    app.dns        = new saito.dns(app);
//    app.keys       = new saito.keychain(app);
    app.network    = new saito.network(app);
    app.burnfee    = new saito.burnfee(app);
    app.blockchain = new saito.blockchain(app);
    app.server     = new saito.server(app);
//    app.modules    = require('./lib/saito/modules')(app, mods);

    ////////////////
    // Initialize //
    ////////////////
    await app.storage.initialize();
/*
    app.wallet.initialize();
*/
    app.mempool.initialize();
/*
    await app.blockchain.initialize();
    app.keys.initialize();
    app.network.initialize();

    //
    // archives before modules
    //
    app.archives.initialize();
    //
    // dns before browser so modules can
    // initialize with dns support
    //
    app.dns.initialize();
    //
    // modules pre-initialized before
    // browser, so that the browser
    // can check which application we
    // are viewing.
    //
    app.modules.pre_initialize();
    app.browser.initialize();
    app.modules.initialize();
    //
    // server initialized after modules
    // so that the modules can use the
    // server to feed their own subpages
    // as necessary
    //
    app.server.initialize();
*/

    if (app.BROWSER == 0) {

      console.log(`

          ,▄▄▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▄▄µ                                                                        
     ▄▄▓▓▓▓▓█▀▀▀▀└^'         '└└▀▀▀▀█▓▓▓▓▓▓▄▄                                                                  
   ▓▓▓█▀▀÷     ,▄▄▄▓▓▓▓▓▓▓▓▓▓▓▄▄▄▄     ' ▀▀█▓▓▓                                                                
   ▓▓▓    ▄▄▓▓▓█▀▀▀▀└'¬'''¬'└"▀▀▀▀█▓▓▓▄▄    ▓▓▓                                                                
   ▐▓▓∩  ▐▓▓     ,▄▄▓▓▓▓▓▓▓▓▓▄▄▄,   '^▓▓▌  j▓▓▌                                                                
    ▓▓▌  j▓▓  ]▓█▀▀¬         ¬└▀▀█▓∩  ▓▓▌  ▓▓▓                                                                 
    ▀▓▓⌐  ▓▓▄  ▓▌                ▐▓⌐ ]▓▓  ]▓▓▌        
     ▓▓▓  ▐▓▓  ▓▓                ▓▌  ▓▓⌐  ▓▓▓                                                                  
     └▓▓▌  ▀▓▌  ▓▓              ▓▓  ▓▓▌  ▓▓▓─        
      ╙▓▓▌  ▀▓▓  ▓▓            ▓▓  ▓▓▌  ▄▓▓▀        
       ╙▓▓▌  ▀▓▓  ▀▓▄        ╓▓█  ▓▓▀  ▓▓▓▀                                                                    
        ^▓▓▓  ╙▓▓▄ ^▀▓▄    ╓▓▓▀ ╓▓▓▀  ▓▓▓▀         
          █▓▓▄  ▀▓▓▄ └▀▓▄▄▓█▀ ,▓▓█' ,▓▓▓"         
           ▀▓▓▓   ▀▓▓▄  "▀  ,▓▓█▀  ▄▓▓▀          
             ▀▓▓▓   ▀▓▓▄  ▄▓▓▀|  ▄▓▓▓|           
              └▀▓▓▓   ╙▀▓▓█▀   ▄▓▓▓▀                                                                           
                └▀▓▓▓▄      ,▄▓▓▓▀               
                   ▀▓▓▓▄  ▄▓▓▓▀                                                                                
                     ^▀▓▓▓▓█▀                                                                                  
                        └'                                                                                     

   Welcome to Saito

     address: ${app.wallet.returnPublicKey()}
     balance: ${app.wallet.returnBalance()}

   This is the address and balance of your computer on the Saito network. Once Saito
   is running it will generate tokens automatically over time. The more transactions 
   you process the greater the chance that you will be rewarded for the work.

   For inquiries please visit our website: https://saito.tech

      `);
    } else {

      console.log(`

          ,▄▄▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▄▄µ
     ▄▄▓▓▓▓▓█▀▀▀▀└^'         '└└▀▀▀▀█▓▓▓▓▓▓▄▄
   ▓▓▓█▀▀÷     ,▄▄▄▓▓▓▓▓▓▓▓▓▓▓▄▄▄▄     ' ▀▀█▓▓▓
   ▓▓▓    ▄▄▓▓▓█▀▀▀▀└'¬'''¬'└"▀▀▀▀█▓▓▓▄▄    ▓▓▓
   ▐▓▓∩  ▐▓▓     ,▄▄▓▓▓▓▓▓▓▓▓▄▄▄,   '^▓▓▌  j▓▓▌
    ▓▓▌  j▓▓  ]▓█▀▀¬         ¬└▀▀█▓∩  ▓▓▌  ▓▓▓
    ▀▓▓⌐  ▓▓▄  ▓▌                ▐▓⌐ ]▓▓  ]▓▓▌
     ▓▓▓  ▐▓▓  ▓▓                ▓▌  ▓▓⌐  ▓▓▓
     └▓▓▌  ▀▓▌  ▓▓              ▓▓  ▓▓▌  ▓▓▓─
      ╙▓▓▌  ▀▓▓  ▓▓            ▓▓  ▓▓▌  ▄▓▓▀
       ╙▓▓▌  ▀▓▓  ▀▓▄        ╓▓█  ▓▓▀  ▓▓▓▀
        ^▓▓▓  ╙▓▓▄ ^▀▓▄    ╓▓▓▀ ╓▓▓▀  ▓▓▓▀
          █▓▓▄  ▀▓▓▄ └▀▓▄▄▓█▀ ,▓▓█' ,▓▓▓"
           ▀▓▓▓   ▀▓▓▄  "▀  ,▓▓█▀  ▄▓▓▀
             ▀▓▓▓   ▀▓▓▄  ▄▓▓▀|  ▄▓▓▓|
              └▀▓▓▓   ╙▀▓▓█▀   ▄▓▓▓▀
                └▀▓▓▓▄      ,▄▓▓▓▀
                   ▀▓▓▓▄  ▄▓▓▓▀
                     ^▀▓▓▓▓█▀
                        └'

    Welcome to Saito

    address: ${app.wallet.returnPublicKey()}
    balance: ${app.wallet.returnBalance()}

    Above is the address and balance of this computer on the Saito network. Once Saito
    is running it will generate tokens automatically over time. You can increase your
    likelihood of this by processing more transactions and creating services that attract
    clients. The more transactions you process the greater the chance that you will be
    rewarded for the work.

    For inquiries please visit our website:  https://saito.tech
      `)
    }

  } catch (err) {
    console.log(err);

  }
} // init saito

function shutdownSaito() {
  console.log("Shutting down Saito");
  app.server.close();
  app.network.close();
}

/////////////////////
// Cntl-C to Close //
/////////////////////
process.on('SIGTERM', function () {
  shutdownSaito();
  console.log("Network Shutdown");
  process.exit(0)
});
process.on('SIGINT', function () {
  shutdownSaito();
  console.log("Network Shutdown");
  process.exit(0)
});




