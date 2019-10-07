import { ForumTemplate } from './forum.template.js';
import { ForumList } from './forum-list/forum-list.js';

export default class Forum {
    constructor(app) {
        this.app = app;
        this.forum = app.saito.modules.returnModule('Forum');
        this.forum.posts = [
            { title:'New Post', author: 'bearguy@saito', comments: [{},{},{}], votes: 10 },
        ]
    }

    render() {
        ForumList.render(this);
    }

    attachEvents() {
    }
}
