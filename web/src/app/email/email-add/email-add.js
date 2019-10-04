import { EmailAddTemplate } from './email-add.template.js';
// import { saito_lib } from '../../../lib/index';

export const EmailAdd = {
    render(mod) {
        document.querySelector(".main").innerHTML = EmailAddTemplate();
        this.attachEvents(mod);
    },

    attachEvents(mod) {
        document.querySelector('.email-submit')
            .addEventListener('click', (e) => this.sendEmailTransaction(mod.saito));

    },

    sendEmailTransaction(saito) {
        let email_title = document.querySelector('.email-title').value;
        let email_address = document.querySelector('.email-address').value;
        let email_text = document.querySelector('.email-text').value;

        let fee = 2.0;
        let amt = 0.0;

        let newtx = saito.wallet.createUnsignedTransaction(saito.wallet.returnPublicKey(), amt, fee);

        newtx.transaction.msg.module = "Email";
        newtx.transaction.msg.data  = email_text;
        newtx.transaction.msg.title  = email_title;
        newtx = saito.wallet.signTransaction(newtx);

        saito.network.propagateTransaction(newtx);
        // function() {
        //     alert('Message sent!');
        // });
    }
}
