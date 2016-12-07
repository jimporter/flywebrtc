function Chat() {
  this._chatlog = document.getElementById('chat-log');
  this._input = document.getElementById('chat-input');

  this._input.addEventListener('change', (event) => {
    let message = event.target.value;
    this._addChatLine('you', message);
    event.target.value = '';
    event.target.dispatchEvent(new CustomEvent('message', {detail: message}));
  });
}

Chat.prototype = {
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

  addDataChannel: function(channel) {
    channel.onopen = (event) => {
      this._input.removeAttribute('disabled');
      this._input.addEventListener('message', (event) => {
        channel.send(event.detail);
      });
    };

    channel.onmessage = (event) => {
      this._addChatLine('them', event.data);
    };
  }
};

let chat = new Chat();
