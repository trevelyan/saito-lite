import App from './app/app';
import { Saito } from '../../lib/index';
import Storage from './saito/storage-web';

async function init() {
  let config = {
    //db: web_storage_functions,
    storage: Storage,
    mod_paths: ['chat/lite/index.js', 'wallet/wallet.js'],
    peers:[{"host":"localhost","port":12101,"protocol":"http","publickey":"d98ERyo7NaFwxpfkYj7g7YKwqVXaCaTvJ33KtA7LBruH","synctype":"lite"}]
  };

  let app = new App();
  let saito = new Saito(config);

  await saito.init();
  app.init(saito);
}

init();