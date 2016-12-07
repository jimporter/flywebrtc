function Chat() {
  this._chatlog = document.getElementById('chat-log');
  this._input = document.getElementById('chat-input');

  this._input.addEventListener('change', (event) => {
    let message = event.target.value;
    this._addChatLine('user ' + this.userId, message);
    event.target.value = '';
    event.target.dispatchEvent(new CustomEvent('message', {detail: message}));
  });
}

Chat.prototype = {
  userId: null,

  _addChatLine: function(username, text) {
    let line = document.createElement('div');
    line.className = 'chat-line';

    let author = document.createElement('span');
    author.className = 'chat-author';
    author.textContent = username;
    line.appendChild(author);

    let message = document.createElement('span');
    message.className = 'chat-message';
    message.textContent = ' ' + text;
    line.appendChild(message);

    this._chatlog.appendChild(line);
  },

  enable: function() {
    this._input.removeAttribute('disabled');
  },

  addDataChannel: function(userId, channel) {
    channel.onopen = (event) => {
      this._input.addEventListener('message', (event) => {
        channel.send(event.detail);
      });
    };

    channel.onmessage = (event) => {
      this._addChatLine('user ' + userId, event.data);
    };
  }
};

let chat = new Chat();

function makeLeftPeer(userId) {
  return new Promise((resolve, reject) => {
    console.log('creating left RTCPeerConnection with user ' + userId);
    let conn = new RTCPeerConnection();
    let channel = conn.createDataChannel('chat');
    chat.addDataChannel(userId, channel);

    conn.onicecandidate = (event) => {
      console.log('onicecandidate (initiator)', event);
      if (!event.candidate)
        resolve(conn);
    };

    conn.createOffer().then((local) => {
      return conn.setLocalDescription(local);
    }).catch((e) => console.error(e));

  });
}

function finalizeLeftPeer(conn, userId, desc) {
  console.log('finalizing left RTCPeerConnection with user ' + userId);
  let remote = new RTCSessionDescription(desc);
  conn.setRemoteDescription(remote);
}

function makeRightPeer(userId, desc) {
  return new Promise((resolve, reject) => {
    console.log('creating right RTCPeerConnection with user ' + userId);
    let conn = new RTCPeerConnection();
    let remote = new RTCSessionDescription(desc);
    conn.setRemoteDescription(remote);

    conn.onicecandidate = (event) => {
      console.log('onicecandidate (receiver)', event);
      if (!event.candidate)
        resolve(conn);
    };

    conn.ondatachannel = (event) => {
      chat.addDataChannel(userId, event.channel);
    };

    conn.createAnswer().then((local) => {
      conn.setLocalDescription(local);
    }).catch((e) => console.error(e));
  });
}
