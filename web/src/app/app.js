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
        this.saito = saito;

        this.chat = new Chat(this);
        this.arcade = new Arcade(this);
        this.forum = new Forum(this);
        this.wallet = new Wallet(this);
        this.email = new Email(this);
        this.settings = new Settings(this);

        this.initServiceWorker();
        this.initHeader();
        this.initFooter();

        // Faucet testing
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

    initHeader() {
        HomeHeader.render(this);
    }

    initFooter() {
        NavBar.render(this);
        NavBar.renderScreen(this, "chat");
        NavBar.updateNavBarButton("chat");
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
