import Chat from '../../chat/chat.js';
import Arcade from '../../arcade/arcade.js';
import Forum from '../../forum/forum.js';
import Wallet from '../../wallet/wallet.js';

import { NavBarTemplate } from './navbar.template.js';

export const NavBar = {
    render() {
        let footer = document.querySelector('.footer');
        footer.innerHTML = NavBarTemplate()
        footer.classList.add('nav-bar')
    },

    attachEvents() {
        Array.from(document.getElementsByClassName('nav-button'))
            .forEach(button => button.addEventListener('click', (event) => {
                let buttons = document.getElementsByClassName('nav-button');
                Array.from(buttons).forEach(button => button.style.color = "var(--text-color-normal)");

                let id = event.target.id;
                switch (id) {
                    case 'chat':
                        let chat = new Chat() ;
                        chat.render();
                        break;
                    case 'arcade':
                        let arcade = new Arcade();
                        arcade.render();
                        break;
                    case 'forum':
                        let forum = new Forum();
                        forum.render();
                        break;
                    case 'wallet':
                        let wallet = new Wallet();
                        wallet.render();
                        break;
                    default:
                        break;
                }

                let nav_button = document.querySelector(`#${id}.nav-button`);
                nav_button.style.color = "var(--saito-red)";
            }
        ));
    }
}
