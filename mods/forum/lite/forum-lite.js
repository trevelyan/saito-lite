const ModTemplate = require('../../../lib/templates/modtemplate.js');

class ForumLite extends ModTemplate {
  constructor(app) {
    super(app);

    this.app = app;
    this.name = "Forum";

    this.posts = [];
  }

  handlePeerRequest(app, msg, peer, mycallback) {
    switch (msg.request) {
      case 'forum response payload':
        this.posts = msg.data;
        this.renderForumPostList();
        break;
      default:
        break;
    }
  }

  renderForumPostList() {}
}

module.exports = ForumLite;