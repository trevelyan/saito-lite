import { ForumDetailTemplate } from './forum-detail.template.js';
import { ForumDetailCommentTemplate } from './forum-detail-comment.template.js';

export const ForumDetail = {
  render(mod, post, comments) {
    document.querySelector('.main').innerHTML = ForumDetailTemplate(post);
    // mod.forum.posts
    // dovument.querySelector('.forum')
    this.renderComments(comments);

    // request comments for each post
    mod.app.saito.network.sendRequest('forum request comments', { post_id: post.id });
  },

  attachEvents(mod) {},

  renderComments(comments) {
    comments.forEach(comment => this.renderChildComments(comment, 0));
      // let margin = 0;
      // let comment_content = comment.data;
      // document.getElementById('forum-comments-table').innerHTML += ForumDetailCommentTemplate(comment_content, margin);

      // if (comments.children.length == 0) { margin = 0; return}

      // comments.children.forEach(comment => {
      //   this.renderChildComments(comment, margin + 15);
      // });
  },

  renderChildComments(comment, margin) {
    let comment_content = comment.data;
    document.getElementById('forum-comments-table').innerHTML += ForumDetailCommentTemplate(comment_content, margin);

    if (comment.children.length == 0) { margin = 0; return}

    comment.children.forEach(comment => {
      this.renderChildComments(comment, margin + 20);
    });
  }
}