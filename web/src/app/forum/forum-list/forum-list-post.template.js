export const ForumListPostTemplate = ({title, author, comments, votes}) => {
  return `
    <div class="forum-row">
      <div class="forum-image">
          <img src="logo-color.svg">
      </div>
      <div class="forum-content">
          <div class="forum-title">${title}</div>
          <div class="forum-author">${author}</div>
          <div class="forum-comments">
              <i class="icon-small fas fa-comment"></i>
              <span class="forum-comments-number">${comments.length}</span> Comments
          </div>
      </div>
      <div class="forum-voting">
          <i class="icon-small fas fa-arrow-up"></i>
          <div class="forum-score">${votes}</div>
          <i class="icon-small fas fa-arrow-down"></i>
      </div>
    </div>
  `;
}