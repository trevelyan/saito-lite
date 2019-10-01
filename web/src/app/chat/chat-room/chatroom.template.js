export const ChatRoomTemplate = () => {
    // populate the id from the click event. Will also need to load message in from id
    return `
        <div id="" class="chat-room">
            <div class="chat-room-content">
                <div id="chat-id" class="chat-room-message chat-room-message-others">
                    <p>This is a message from someone other than yourself!</p>
                    <div class="chat-message-header">
                        <p class="chat-message-author">david@saito</p>
                        <p class="chat-message-timestamp">12:43pm</p>
                    </div>
                </div>
                <div id="chat-id" class="chat-room-message chat-room-message-myself">
                    <p>This is a message from myself, it should be different</p>
                    <div class="chat-message-header">
                       <p class="chat-message-author"></p>
                       <p class="chat-message-timestamp">1:34pm</p>
                    </div>
                </div>
                <div id="chat-id" class="chat-room-message chat-room-message-others">
                    <p>This is a message from someone other than yourself!</p>
                    <div class="chat-message-header">
                        <p class="chat-message-author">david@saito</p>
                        <p class="chat-message-timestamp">12:43pm</p>
                    </div>
                </div>
                <div id="chat-id" class="chat-room-message chat-room-message-others">
                    <p>This is a message from someone other than yourself!</p>
                    <div class="chat-message-header">
                        <p class="chat-message-author">david@saito</p>
                        <p class="chat-message-timestamp">12:43pm</p>
                    </div>
                </div>
                <div id="chat-id" class="chat-room-message chat-room-message-others">
                    <p>Lorem Ipsum things are saying this gibberhish asldkjf asdkxcckjasdjnasdj lkajsdf lkajsdflkjasd lfkjasd lfkja sdlkfja sldkfj akjsxnc laksnd fojnaw ejrna sdjncl jansd kfjnasd flkja sdlkna sldkfj alsdkfj alksdjf laksdjf lkajs lkajsd flkajsd lfkj lkja sdf</p>
                    <div class="chat-message-header">
                        <p class="chat-message-author">david@saito</p>
                        <p class="chat-message-timestamp">12:43pm</p>
                    </div>
                </div>
                <div id="chat-id" class="chat-room-message chat-room-message-myself">
                    <p>Wow that's a great point</p>
                    <div class="chat-message-header">
                        <p class="chat-message-author"></p>
                        <p class="chat-message-timestamp">2:43pm</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}
