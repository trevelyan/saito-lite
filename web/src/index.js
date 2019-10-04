import App from './app/app';
import { Saito } from '../../lib/index';

let app = new App();

let config = {
  "mod_paths": ['chat/lite/index.js', 'wallet/wallet.js'],
  "peers":[{"host":"localhost","port":12101,"protocol":"http","publickey":"d98ERyo7NaFwxpfkYj7g7YKwqVXaCaTvJ33KtA7LBruH","synctype":"lite"}]
};

let saito = new Saito(config);

saito.init();

app.init(saito);
