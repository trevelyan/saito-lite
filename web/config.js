import { web_storage_functions } from './src/saito/storage-web';

module.exports = {
  db: web_storage_functions,
  mod_paths: ['chat/lite/index.js', 'wallet/wallet.js'],
  peers:[{"host":"localhost","port":12101,"protocol":"http","publickey":"d98ERyo7NaFwxpfkYj7g7YKwqVXaCaTvJ33KtA7LBruH","synctype":"lite"}]
};