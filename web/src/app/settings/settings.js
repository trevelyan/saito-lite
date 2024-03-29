import {SettingsTemplate} from './settings.template';

export default class Settings {
    constructor(app) {
        this.app = app;
    }

    render() {
        document.querySelector('.main').innerHTML = SettingsTemplate();
        this.initSettings();
        this.attachEvents(this.app.saito);
    }

    attachEvents(saito) {
        let reset_button = document.querySelector('.settings-reset-button');
        reset_button.addEventListener('click', async () => {
            await saito.storage.resetOptions();
            alert('Your options have been reset');
            window.location.reload();
        });

        let save_button = document.querySelector('.settings-backup-button');
        save_button.addEventListener('click', () => {
            var pom = document.createElement('a');
            pom.setAttribute('type', "hidden");
            pom.setAttribute('href', 'data:application/json;utf-8,' + encodeURIComponent(JSON.stringify(saito.options)));
            pom.setAttribute('download', "saito.wallet.json");
            document.body.appendChild(pom);
            pom.click();
            pom.remove();
        });

        let load_button = document.querySelector('.settings-import-button');
        load_button.addEventListener('click', () => {
            let inputFile = document.getElementById('file-input')
            inputFile.addEventListener('change', function(e) {
                let file = e.target.files[0];
                if (!file) { return; }
                let reader = new FileReader();
                reader.onload = function(e) {
                  let contents = e.target.result;
                  let tmpoptions = JSON.parse(contents);
                  if (tmpoptions.wallet.publickey != null) {
                    saito.options = JSON.parse(contents);
                    saito.storage.saveOptions();
                    alert("Wallet Import Successful");
                  } else {
                    alert("This does not seem to be a valid wallet file");
                  }
                };
                reader.readAsText(file);
              }, false);
            inputFile.click();
        });
    }

    initSettings() {
        let change_theme_mode = (event) => {
            if (document.querySelector('html').dataset.theme == 'dark') {
                document.querySelector('html').dataset.theme = 'light';
                document.querySelector('#theme-dark').style.display = "none";
                document.querySelector('#theme-light').style.display = "block";
            } else {
                document.querySelector('html').dataset.theme = 'dark';
                document.querySelector('#theme-dark').style.display = "block";
                document.querySelector('#theme-light').style.display = "none";
            }
        }
        let theme_mode = document.querySelector('#theme-mode');
        theme_mode.addEventListener('click', change_theme_mode);
    }
}
