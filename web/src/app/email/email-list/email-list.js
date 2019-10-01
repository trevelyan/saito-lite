import { EmailAdd  } from '../email-add/email-add.js';
import { EmailListTemplate } from './email-list.template.js';

export const EmailList = {
    render() {
        let main = document.querySelector(".main");
        main.innerHTML = EmailListTemplate()
        //
        //main.classList.add("")

    },

    attachEvents(saito) {
        document.querySelector('#email.create-button')
            .addEventListener('click', (e) => {
                EmailAdd.render();
                EmailAdd.attachEvents(saito)
            });
    }
}
