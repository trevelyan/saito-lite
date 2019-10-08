import { ForumAdd } from '../forum-add/forum-add.js';
import { ForumListTemplate } from './forum-list.template.js';
import { ForumListPostTemplate } from './forum-list-post.template.js';

import { ForumDetail } from '../forum-detail/forum-detail.js';

export const ForumList = {
  render(mod) {
    document.querySelector('.main').innerHTML = ForumListTemplate();
    mod.forum.posts.forEach((post, index) => {
      document.querySelector('.forum-table').innerHTML += ForumListPostTemplate(post, index);
    });

    this.attachEvents(mod);
  },

  attachEvents(mod) {
    document.querySelector('#forum.create-button')
            .addEventListener('click', (e) => {
                ForumAdd.render(mod);
            });

    Array.from(document.getElementsByClassName('forum-row'))
         .forEach(post => post.addEventListener('click', (e) => {
              let post_index = parseInt(e.currentTarget.id);
              ForumDetail.render(mod, mod.forum.posts[post_index], mod.forum.comments[0]);
          })
        );
  }
}