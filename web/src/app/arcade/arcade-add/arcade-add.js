import { ArcadeAddTemplate } from './arcade-add.template.js';

export const ArcadeAdd = {
    render(mod) {
      document.querySelector(".main").innerHTML = ArcadeAddTemplate();
      this.attachEvents(mod);
    },

    attachEvents(mod) {
      Array.from(document.getElementsByClassName('game'))
          .forEach(game => game.addEventListener('click', (e) => {
            let game_id = e.currentTarget.id;
            // let arcade_start_game = document.querySelector('.arcade-start-game');
            let game = mod.app.saito.modules.returnModule(game_id);
            document.getElementById('game-title').innerHTML = game.name;
            document.getElementById('game-description').innerHTML = game.description;
            document.getElementById('game-options').innerHTML = game.returnGameOptionsHTML();

            // show our game options
            document.querySelector('.arcade-start-game').style.display = 'grid';
          })
      );
    }
}