import { ChatList } from './chat-list/chat-list.js';

export default class Chat {
    constructor() {}
    render() {
        ChatList.render();
        ChatList.attachEvents();
    }
}
