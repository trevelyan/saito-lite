export const ChatListRowTemplate = (room_id, last_message, timestamp) => {
  let datetime = new Date(timestamp);
  return `
    <div id="${room_id}" class="chat-row">
      <img src="logo-color.svg">
      <div class="chat-content">
          <div class="chat-group-name">${room_id}</div>
          <div class="chat-last-message">${last_message}</div>
      </div>
      <div class="chat-last-message-timestamp">${datetime.getHours()}:${datetime.getMinutes()}</div>
    </div>
  `;
}