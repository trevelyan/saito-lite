import Settings from '../../settings/settings.js' ;

import { ChatList } from '../chat-list/chat-list.js';
import { HomeHeader } from '../../components/header/home-header.js';
import { NavBar } from '../../components/navbar/navbar.js';

import { ChatRoomTemplate } from './chatroom.template.js';
import { ChatRoomHeaderTemplate } from './chatroomheader.template.js';
import { ChatRoomFooterTemplate } from './chatroomfooter.template.js';

export const ChatRoom = {
    render() {
        let main = document.querySelector('.main');
        main.innerHTML = ChatRoomTemplate();

        let header = document.querySelector('.header');
        header.classList.remove("header-home");
        header.classList.add("chat-room-header");
        header.innerHTML = ChatRoomHeaderTemplate();

        let footer = document.querySelector('.footer');
        footer.classList.remove("nav-bar");
        footer.classList.add("chat-room-footer");
        footer.innerHTML = ChatRoomFooterTemplate();
    },

    attachEvents(saito) {
        document.querySelector('#back-button')
            .addEventListener('click', () => {
                // header
                let header = document.querySelector('.header');
                header.classList.remove("chat-room-header");

                HomeHeader.render();
                HomeHeader.attachEvents();

                // main
                ChatList.render();
                ChatList.attachEvents();

                // footer
                let footer = document.querySelector('.footer');
                footer.classList.remove("chat-room-footer");

                NavBar.render();
                NavBar.attachEvents();
            });

        document.querySelector('#notifications.header-icon')
                .addEventListener('click', () => {
                    let email = new Email;
                    email.render();

                    let header = document.querySelector('.header');
                    header.classList.remove("chat-room-header");

                    HomeHeader.render();
                    HomeHeader.attachEvents();

                    let footer = document.querySelector('.footer');
                    footer.classList.remove("chat-room-footer");

                    NavBar.render();
                    NavBar.attachEvents();
                });

        document.querySelector('#settings.header-icon')
                .addEventListener('click', () => {
                    let settings = new Settings
                    settings.render();

                    let header = document.querySelector('.header');
                    header.classList.remove("chat-room-header");

                    HomeHeader.render();
                    HomeHeader.attachEvents();

                    let footer = document.querySelector('.footer');
                    footer.classList.remove("chat-room-footer");

                    NavBar.render();
                    NavBar.attachEvents();
                });

        document.querySelector('.chat-room-submit-button')
                .addEventListener('click', () => {
                    let msg = document.querySelector('#input.chat-room-input').value;
                    let newtx = this.createMessage(saito, 'ALL', msg);
                    this.sendMessage(saito, newtx);
                });
    },

    createMessage(saito, chat_room_id, msg) {
        // let fee = 0.0 //await this._returnModServerStatus() ? 0.0 : 2.0;
        // if (this.server.peer.publickey == null) { return null; }
        let publickey = saito.network.peers[0].peer.publickey;
        let newtx = saito.wallet.createUnsignedTransaction(publickey, 0.0, 0.0);
        if (newtx == null) { return; }

        newtx.transaction.msg = {
            module: "Chat",
            request: "chat send message",
            publickey: saito.wallet.returnPublicKey(),
            room_id: chat_room_id,
            message:  msg,
            //this.saito.keys.encryptMessage(this.saito.wallet.returnPublicKey(), msg),
            timestamp: new Date().getTime(),
        };

        // newtx.transaction.msg = this.app.keys.encryptMessage(this.app.wallet.returnPublicKey(), newtx.transaction.msg);
        newtx.transaction.msg.sig = saito.wallet.signMessage(JSON.stringify(newtx.transaction.msg));
        newtx = saito.wallet.signTransaction(newtx);
        return newtx;
    },

    sendMessage(saito, tx, callback=null) {
        saito.network.sendTransactionToPeers(tx, "chat send message", callback);
    }
}
