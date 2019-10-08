import { ForumTemplate } from './forum.template.js';
import { ForumList } from './forum-list/forum-list.js';

export default class Forum {
    constructor(app) {
        this.app = app;
        this.forum = app.saito.modules.returnModule('Forum');
        // this.forum.posts = [
        //     { title:'New Post', author: 'bearguy@saito', comments: [{},{},{}], votes: 10 },
        // ];
        this.bindDOMFunctionsToModule();
    }

    initialize() {
        let msg = {};
        msg.data = {};
        msg.request = 'forum request all';

        setTimeout(() => {
            this.app.saito.network.sendRequest(msg.request, msg.data);
        }, 1000);
    }

    render() {
        ForumList.render(this);
    }

    bindDOMFunctionsToModule() {
        this.forum.renderForumPostList = this.renderForumPostList.bind(this.forum);
    }

    renderForumPostList() {
        // ForumList.render(this);
    }
}
