import Arcade from './arcade/arcade';
import Chat from './chat/chat';
import Forum from './forum/forum';
import Wallet from './wallet/wallet';
import Email from './email/email';
import Settings from './settings/settings';

import { HomeHeader } from './components/header/home-header.js';
import { NavBar } from './components/navbar/navbar.js';

export default class App {
    constructor() {}

    init(saito) {
        this.chat = new Chat();
        this.arcade = new Arcade();
        this.forum = new Forum();
        this.wallet = new Wallet();
        this.email = new Email(saito);
        this.settings = new Settings();

        this.saito = saito;

        this.initServiceWorker();
        this.initHeader();
        this.initFooter();
        //render screen last as it acts on header and footer content.
        this.renderScreen('chat');
        this.getTokens();
    }

    initServiceWorker() {
        if (!navigator.serviceWorker) {
            return;
        }
        navigator.serviceWorker
            .register('./sw.js')
            .then(() => {
                console.log('sw registered successfully!');
            })
            .catch((error) => {
                console.log('Some error while registering sw:', error);
            });
    }

    renderScreen(id) {
        // render new screen based on what nav element is being clicked on
        switch (id) {
            case 'chat':
                this.chat.render();
                break;
            case 'arcade':
                this.arcade.render();
                break;
            case 'forum':
                this.forum.render();
                break;
            case 'wallet':
                this.wallet.render();
                break;
            default:
                break;
        }

        let nav_button = document.querySelector(`#${id}.nav-button`);
        nav_button.style.color = "var(--saito-red)";
    }

    initHeader() {
        HomeHeader.render();
        HomeHeader.attachEvents(this.email);
    }

    initFooter() {
        NavBar.render();
        Array.from(document.getElementsByClassName('nav-button'))
            .forEach(button => button.addEventListener('click', (event) => {
                // turn all other buttons black
                let buttons = document.getElementsByClassName('nav-button');
                Array.from(buttons).forEach(button => button.style.color = "var(--text-color-normal)");

                let id = event.target.id;
                this.renderScreen(id);
            }
        ));
    }

    getTokens() {
        let msg = {};
        msg.data = {address: this.saito.wallet.returnPublicKey()};
        msg.request = 'get tokens';

        setTimeout(() => {
            this.saito.network.sendRequest(msg.request, msg.data);
        }, 3000);
    }

}
