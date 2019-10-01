import { ForumTemplate } from './forum.template.js';

export default class Forum {
    render() {
        let forum = ForumTemplate();
        let main = document.querySelector('.main');
        main.innerHTML = forum;
    }
}
