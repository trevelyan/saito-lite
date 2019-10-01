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

    attachEvents() {
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
    }
}
