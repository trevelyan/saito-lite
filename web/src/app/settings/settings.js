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
            // saito.storage.saveOptions();
            alert('Your options have been reset');
            window.location.reload();
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
