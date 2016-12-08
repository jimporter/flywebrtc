/**
 * A simple UI for a two-user messaging client.
 */
function Chat() {
  this._chatlog = document.getElementById('chat-log');
  this._input = document.getElementById('chat-input');

  // When the content of the chat input changes, send a message and add it to
  // our chat log.
  this._input.addEventListener('change', (event) => {
    let message = event.target.value;
    this._addChatLine('you', message);
    event.target.value = '';
    event.target.dispatchEvent(new CustomEvent('message', {detail: message}));
  });
}

Chat.prototype = {
  /**
   * Add a line to the chat log.
   *
   * @param user {String} The user's name ("you" or "them")
   * @param text {String} The message from the user
   */
  _addChatLine: function(user, text) {
    let line = document.createElement('div');
    line.className = 'chat-line';

    let author = document.createElement('span');
    author.className = 'chat-author';
    author.textContent = user;
    line.appendChild(author);

    let message = document.createElement('span');
    message.className = 'chat-message';
    message.textContent = ' ' + text;
    line.appendChild(message);

    this._chatlog.appendChild(line);
  },

  /**
   * Add a WebRTC data channel to listen to.
   *
   * @param channel {RTCDataChannel} The data channel.
   */
  addDataChannel: function(channel) {
    // Wait for the channel to open, then enable the chat input and listen for
    // "message" events, which will get sent over the data channel to the other
    // side.
    channel.onopen = (event) => {
      console.log('channel.onopen', event);
      this._input.removeAttribute('disabled');
      this._input.addEventListener('message', (event) => {
        console.log('sending message over channel');
        channel.send(event.detail);
      });
    };

    // Listen for incoming messages and add them to the chat log.
    channel.onmessage = (event) => {
      console.log('channel.onmessage', event);
      this._addChatLine('them', event.data);
    };
  }
};

let chat = new Chat();
