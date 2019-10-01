import { EmailList} from './email-list/email-list.js';

export default class Email {
    constructor(saito) {
        this.saito = saito
        return this;
    }
    render() {
       EmailList.render();
       EmailList.attachEvents(this.saito);
    }
}
