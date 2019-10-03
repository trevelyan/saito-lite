import { EmailAdd  } from '../email-add/email-add.js';
import { EmailListTemplate } from './email-list.template.js';

export const EmailList = {
    render(mod) {
        let main = document.querySelector(".main");
        main.innerHTML = EmailListTemplate()
        //
        //main.classList.add("")
        this.attachEvents(mod);

    },

    attachEvents(mod) {
        document.querySelector('#email.create-button')
            .addEventListener('click', (e) => {
                EmailAdd.render(mod.saito);
                //EmailAdd.attachEvents(mod.saito)
            });
    }
}
