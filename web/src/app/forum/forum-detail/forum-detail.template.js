export const ForumDetailTemplate = (post) => {
  return `
    <div class="forum-detail">
      <section class="forum-header">
        <div class="forum-row">
          <div class="forum-image">
            <img src="logo-color.svg">
          </div>
          <div class="forum-content">
              <div class="forum-title">${post.title}</div>
              <div class="forum-author">${post.author.substring(0, 16)}</div>
          </div>
          <div class="forum-voting">
            <i class="icon-small fas fa-arrow-up"></i>
              <div class="forum-score">${post.votes}</div>
            <i class="icon-small fas fa-arrow-down"></i>
          </div>
        </div>
      </section>
      <section id="forum-detail-text">
        <p id="forum-discussion">
          ${post.text}
        </p>
      </section>
      <section id="forum-post-comment">
        <textarea id="forum-comment-text-input" placeholder="Post a Comment..."></textarea>
        <button id="forum-submit-comment">POST</button>
      </section>
      <section id="forum-comments">
        <h2>Comments</h2>
        <hr style="margin-bottom: 0.5em">
        <div id="forum-comments-table"></div>
      </section>
    </div>
  `;
}