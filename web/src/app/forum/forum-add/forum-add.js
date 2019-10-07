import { ForumAddTemplate } from './forum-add.template.js';

export const ForumAdd = {
  render(mod) {
    document.querySelector('.main').innerHTML = ForumAddTemplate();
    this.attachEvents(mod);
  },

  attachEvents(mod) {},
}