import { ArcadeTemplate } from './arcade.template.js';

export default class Arcade {
    render() {
        let arcade = ArcadeTemplate();
        let main = document.querySelector('.main');
        main.innerHTML = arcade;
    }
}
