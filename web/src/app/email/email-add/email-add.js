import { EmailAddTemplate } from './email-add.template.js';
// import { saito_lib } from '../../../lib/index';

export const EmailAdd = {
    render() {
        document.querySelector(".main").innerHTML = EmailAddTemplate();
        // this.attachEvents();
    },

    attachEvents(saito) {
        document.querySelector('.email-submit')
            .addEventListener('click', (e) => this.sendEmailTransaction(saito));

    },

    sendEmailTransaction(saito) {
        let email_title = document.querySelector('.email-title').value;
        let email_address = document.querySelector('.email-address').value;
        let email_text = document.querySelector('.email-text').value;

        let fee = 200000000;
        let amt = 0;

        let newtx = saito.wallet.createUnsignedTransaction(saito.wallet.returnPublicKey(), amt, fee);

        newtx.transaction.msg.module = this.name;
        newtx.transaction.msg.data  = email_text;
        newtx.transaction.msg.title  = email_title;

        saito.network.propagateTransactionWithCallback(newtx, function() {
            alert('Message sent!');
        });
    }
}
