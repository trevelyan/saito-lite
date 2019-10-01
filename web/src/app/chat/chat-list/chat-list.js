import { ChatListTemplate } from './chat-list.template.js';
import { ChatRoom } from '../chat-room/chatroom.js';
import { ChatAdd  } from '../chat-add/chatadd.js';

export const ChatList = {
    render() {
        document.querySelector('.main').innerHTML = ChatListTemplate();
        //this.addChatListEvents();
    },

    attachEvents() {
        // TODO:
        // need to figure out how best to pass params

        // add click event to all of our existing chat rows
        Array.from(document.getElementsByClassName('chat-row'))
             .forEach(row => row.addEventListener('click', () => {
                 ChatRoom.render();
                 ChatRoom.attachEvents();
             }));

        // add click event to create-button
        document.querySelector('#chat.create-button')
                .addEventListener('click', ChatAdd.render);
    }
}
