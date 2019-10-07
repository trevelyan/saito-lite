const sqlite = require('sqlite');
const ModTemplate = require('../../../lib/templates/modtemplate.js');
const fs = require('fs');

class ForumCore extends ModTemplate {
  constructor(app) {
    super(app);

    this.app = app;
    this.name = "Forum";

    this.db = {};
  }

  // Install Module //
  async installModule() {
    try {
      this.db = await sqlite.open('./data/forum.sq3');
      let forum_sql = fs.readFileSync('./data/sql/forum.sql').toString();
      await this.db.run(forum_sql, {});
    } catch (err) { console.error(err); }
  };

  async initialize() {
    this.db = await sqlite.open('./data/forum.sq3');
  }

  onConfirmation(blk, tx, conf, app) {
    if (tx.transaction.msg.module != "Forum") { return; }
    if (conf == 0) {
      forum = app.modules.returnModule("Forum");
      switch (tx.transaction.msg.type) {
        case 'post':
          forum.savePost(tx);
          break;
        case 'comment':
          let { post_id, parent_id } = tx.transaction.msg;
          if (parent_id != null || post_id != null) { forum.saveComment(tx, post_id, parent_id); }
          break;
        default:
          break;
      }
    }
  }

  async handlePeerRequest(app, msg, peer, callback) {
    // loads list of posts
    switch(msg.request) {
      case 'forum request all':
        this.handleForumPostsResponse(app, msg, peer, callback);
        break;
      case 'forum vote':
        this.handleForumVote(app, msg, peer, callback);
        break;
      default:
        break;
    }
  }

  async handleForumPostsResponse(app, msg, peer, callback) {
    var sr = msg.data.subreddit.toLowerCase();
    var so = msg.data.offset;

    var sql    = "SELECT * FROM posts ORDER BY unixtime_rank DESC LIMIT $ppp OFFSET $offset";
    var params = { $ppp : this.reddit.posts_per_page , $offset : so };
    if (sr != "" && sr != null) {
      sql = "SELECT * FROM posts WHERE subreddit = $sr ORDER BY unixtime_rank DESC LIMIT $ppp OFFSET $offset";
      params = { $sr : sr ,$ppp : this.reddit.posts_per_page ,  $offset : so };
    }
    try {
      var rows = await this.db.all(sql, params);
    } catch(err) {
      console.log(err);
    }
    if (rows != null) {
      if (rows.length != 0) {
        let message                 = {};
            message.request         = "reddit payload";
            message.data            = [];

        message.data = rows.map(row => {
          let {id, tx, subreddit, post_id, unixtime, comments, votes} = row;
          tx = JSON.parse(tx)
          let {text, link, title} = tx.msg;

          return {
            id: id,
            tx: tx,
            title,
            link,
            text,
            subreddit: subreddit ? subreddit : "main",
            post_id: post_id,
            unixtime: unixtime,
            comments: comments,
            votes: votes,
          };
        });

        peer.sendRequest(message.request, message.data);
      }
    } else {
      peer.sendRequest("reddit load null", {});
    }
    return;
  }

  async handleForumVote(app, msg, peer, callback) {
    var vote  = msg.data.vote;
    var type  = msg.data.type;
    var docid = msg.data.id;
    var voter = peer.peer.publickey;

    try {
      var row = await this.db.all(
        `SELECT count(*) AS count FROM votes WHERE docid = $dic AND publickey = $pkey`,
        { $dic : docid , $pkey : voter }
      );
    } catch(err) {
      console.log(err);
    }

    if (row != null) {
      if (row.count == 1) { return; }
      try {
        this.db.run(
          `INSERT OR IGNORE INTO votes (docid, publickey) VALUES ($docid, $pkey)`,
          { $docid : docid , $pkey : voter }
        );
      } catch(err) {
        console.log(err);
      }

      var sql3 = "";
      var params3 = { $pid : docid };

      if (type == "post") {

        // if we haven't voted yet, we are permitted to vote
        var current_time = new Date().getTime();
        var vote_bonus   = 1000000;

        sql3 = "UPDATE posts SET votes = votes + 1, unixtime_rank = cast((unixtime_rank + ($vote_bonus * (2000000/($current_time-unixtime)))) as INTEGER) WHERE post_id = $pid";
        params3 = { $pid : docid , $vote_bonus : vote_bonus , $current_time : current_time };

        if (vote == -1) {
          sql3 = "UPDATE posts SET votes = votes - 1, unixtime_rank = cast((unixtime_rank - ($vote_bonus * (2000000/($current_time-unixtime)))) as INTEGER) WHERE post_id = $pid";
          params3 = { $pid : docid , $vote_bonus : vote_bonus , $current_time : current_time };
        }
      } else {
        sql3 = "UPDATE comments SET votes = votes + 1 WHERE comment_id = $pid";
        if (vote == -1) {
          sql3 = "UPDATE comments SET votes = votes - 1 WHERE comment_id = $pid";
        }
      }
      try {
        this.db.all(sql3, params3);
      } catch(err) {
        console.log(err);
      }
    }
  }

  async savePost(tx) {
    console.log("save post");
    var myhref = tx.transaction.msg.link;
    if (myhref.indexOf("http://") != 0 && myhref.indexOf("https://") != 0) { myhref = "http://" + myhref; }

    var link   = new URL(myhref);

    var sql = `
      INSERT OR IGNORE INTO
      posts (tx, votes, comments, post_id, reported, approved, subreddit, unixtime, unixtime_rank, url, domain)
      VALUES ($tx, 1, 0, $post_id, 0, 0, $subreddit, $unixtime, $unixtime_rank, $url, $domain)
    `;

    try {
      let row = await this.db.run(sql, {
        $tx: JSON.stringify(tx.transaction),
        $post_id: tx.transaction.sig,
        $subreddit: tx.transaction.msg.subreddit.toLowerCase(),
        $unixtime: tx.transaction.ts,
        $unixtime_rank: tx.transaction.ts,
        $url : link.href,
        $domain : link.hostname
      });

      if (row) { this.lastID = row.lastID; }
    } catch(err) {
      console.log(err);
    }

    // //////////////////////////////
    // // generate new cached page //
    // //////////////////////////////
    //
    // TODO: Image module should be used to create and save snapshots, along with other things
  }

  saveComment(tx, post_id, parent_id) {
    var sql = `
      INSERT OR IGNORE INTO comments (tx, votes, post_id, reported, approved, comment_id, parent_id, unixtime)
      VALUES ($tx, 1, $post_id, 0, 0, $comment_id, $parent_id, $unixtime)
    `;

    try {
      this.db.run(sql, {
        $tx: JSON.stringify(tx.transaction),
        $post_id: post_id,
        $comment_id: tx.transaction.sig,
        $parent_id: parent_id,
        $unixtime: tx.transaction.ts
      });
    } catch(err) {
      console.log(err);
    }

    try {
      this.db.run(
        `UPDATE posts SET comments = comments + 1 WHERE post_id = $pid`,
        { $pid : post_id }
      );
    } catch(err) {
      console.log(err);
    }
  }
}

module.exports = ForumCore;