import App from './app/app';
import { Saito } from '../../lib/index';

let app = new App();

let config = {
  "mods_path": [],
  "peers":[{"host":"localhost","port":12101,"protocol":"http","publickey":"d98ERyo7NaFwxpfkYj7g7YKwqVXaCaTvJ33KtA7LBruH","synctype":"lite"}]
};

let saito = new Saito(config);

saito.init();
app.init(saito);

