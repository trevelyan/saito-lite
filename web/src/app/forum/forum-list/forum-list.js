import { ForumAdd } from '../forum-add/forum-add.js';
import { ForumListTemplate } from './forum-list.template.js';
import { ForumListPostTemplate } from './forum-list-post.template.js';

export const ForumList = {
  render(mod) {
    document.querySelector('.main').innerHTML = ForumListTemplate();
    mod.forum.posts.forEach(post => {
      document.querySelector('.forum-table').innerHTML += ForumListPostTemplate(post);
    });

    this.attachEvents(mod);
  },

  attachEvents(mod) {
    document.querySelector('#forum.create-button')
            .addEventListener('click', (e) => {
                ForumAdd.render(mod);
            });
  }
}