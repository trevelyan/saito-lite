import { ChatListTemplate } from './chat-list.template.js';
import { ChatListRowTemplate } from './chat-list-row.template.js';

import { ChatRoom } from '../chat-room/chatroom.js';
import { ChatAdd  } from '../chat-add/chatadd.js';

export const ChatList = {
    render(mod) {
        document.querySelector('.main').innerHTML = ChatListTemplate();

        Object.values(mod.chat.rooms).forEach((room) => {
            document.querySelector('.chat').innerHTML
                += ChatListRowTemplate(room, room.messages[room.messages.length - 1]);
        });

        this.bindDOMFunctionstoModule(mod);

        this.attachEvents(mod);
    },

    attachEvents(mod) {
        // add click event to all of our existing chat rows
        Array.from(document.getElementsByClassName('chat-row'))
             .forEach(row => row.addEventListener('click', (e) => {
                let room_id = e.currentTarget.id;
                ChatRoom.render(mod, mod.chat.rooms[room_id]);
             })
        );

        // add click event to create-button
        document.querySelector('#chat.create-button')
                .addEventListener('click', ChatAdd.render);
    },

    // persepctive of Module
    bindDOMFunctionstoModule(mod) {
        mod.chat.renderChatList = this.renderChatList(mod);
    },

    renderChatList(mod) {
        return function () {
            Object.values(mod.chat.rooms).forEach((room) => {
                document.querySelector('.chat').innerHTML
                    += ChatListRowTemplate(room, room.messages[room.messages.length - 1]);
            });

            Array.from(document.getElementsByClassName('chat-row'))
                .forEach(row => row.addEventListener('click', (e) => {
                    let room_id = e.currentTarget.id;
                    ChatRoom.render(mod, mod.chat.rooms[room_id]);
                })
            );

            // add click event to create-button
            document.querySelector('#chat.create-button')
                    .addEventListener('click', ChatAdd.render);
        }
    },
}
