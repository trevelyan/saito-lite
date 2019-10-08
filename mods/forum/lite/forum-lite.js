const ModTemplate = require('../../../lib/templates/modtemplate.js');

class ForumLite extends ModTemplate {
  constructor(app) {
    super(app);

    this.app = app;
    this.name = "Forum";

    this.posts = [];
    this.comments = {
      0: [
        {
          data: {
            author: 'bearguy@saito',
            publickey: 'asdflkjasknaasdf',
            text: 'This is a comment that needs rendering',
            votes: 4,
            sig: 'NEWASDFASDCASDF'
          },
          children: [
            {
              data: {
                author: 'bearguy@saito',
                publickey: 'asdflkjasknaasdf',
                text: 'This is a nested comment that needs rendering',
                votes: 4,
                sig: 'NEWASDFASDCASDF'
              },
              children: [
                {
                  data: {
                    author: 'bearguy@saito',
                    publickey: 'asdflkjasknaasdf',
                    text: 'This is another nested comment that needs rendering',
                    votes: 4,
                    sig: 'NEWASDFASDCASDF'
                  },
                  children: []
                }
              ]
            }
          ]
        },
        {
          data: {
            author: 'bearguy@saito',
            publickey: 'asdflkjasknaasdf',
            text: 'This is a comment that needs rendering',
            votes: 4,
            sig: 'NEWASDFASDCASDF'
          },
          children: [
            {
              data: {
                author: 'bearguy@saito',
                publickey: 'asdflkjasknaasdf',
                text: 'This is a nested comment that needs rendering',
                votes: 4,
                sig: 'NEWASDFASDCASDF'
              },
              children: [
                {
                  data: {
                    author: 'bearguy@saito',
                    publickey: 'asdflkjasknaasdf',
                    text: 'This is another nested comment that needs rendering',
                    votes: 4,
                    sig: 'NEWASDFASDCASDF'
                  },
                  children: []
                }
              ]
            }
          ]
        }
      ],
    }
  }

  handlePeerRequest(app, msg, peer, mycallback) {
    switch (msg.request) {
      case 'forum response payload':
        this.posts = msg.data.map(post => {
          post.author = post.tx.from[0].add;
          return post;
        });
        this.renderForumPostList();
        break;
      case 'forum response comments':
        this.comments[msg.data.post_id] = msg.data.comments;
        this.renderForumComments();
        break;
      default:
        break;
    }
  }

  renderForumPostList() {}
  renderForumComments() {}
}

module.exports = ForumLite;