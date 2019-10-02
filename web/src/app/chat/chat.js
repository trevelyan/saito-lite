import { ChatList } from './chat-list/chat-list.js';

export default class Chat {
    constructor(saito) {
        this.saito = saito
    }

    render() {
        ChatList.render();
        ChatList.attachEvents(this.saito);
    }
}
