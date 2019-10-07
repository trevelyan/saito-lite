import { ArcadeTemplate } from './arcade.template.js';
import { ArcadeAdd } from './arcade-add/arcade-add.js';

export default class Arcade {
    constructor(app) {
        this.app = app;
        // this.saito = app.saito;
        return this;
    }

    render() {
        // let arcade = ;
        let main = document.querySelector('.main');
        main.innerHTML = ArcadeTemplate();
        this.attachEvents(this);
    }

    attachEvents(app) {
        document.querySelector('#arcade.create-button')
            .addEventListener('click', (e) => {
                ArcadeAdd.render(app);
            });
    }
}
