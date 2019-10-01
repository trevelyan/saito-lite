// import Email from '../../email/email.js';
// import Settings from '../../settings/settings.js';

import { HomeHeaderTemplate } from './home-header.template.js';


export const HomeHeader = {
    render() {
        let header = document.querySelector('.header');
        header.innerHTML = HomeHeaderTemplate();
        header.classList.add('header-home');
    },

    attachEvents(email, settings) {
        document.querySelector('#notifications.header-icon')
                .addEventListener('click', () => {
                    // let email = new Email(saito);
                    email.render();
                });
        document.querySelector('#settings.header-icon')
                .addEventListener('click', () => {
                    // let settings = new Settings
                    settings.render();
                });
    }
}
