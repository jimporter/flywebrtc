function Chat() {
  this._chatlog = document.getElementById('chat-log');
  this._input = document.getElementById('chat-input');

  this._input.addEventListener('change', (event) => {
    let message = event.target.value;
    this._addChatLine(message);
    event.target.value = '';
    event.target.dispatchEvent(new CustomEvent('message', {detail: message}));
  });
}

Chat.prototype = {
  _addChatLine: function(message) {
    this._chatlog.textContent += message + '\n';
  },

  addDataChannel: function(channel) {
    channel.onopen = (event) => {
      this._input.addEventListener('message', (event) => {
        channel.send(event.detail);
      });
    };

    channel.onmessage = (event) => {
      this._addChatLine(event.data);
    };
  }
};

let chat = new Chat();

function makeLeftPeer(userId, socket) {
  return new Promise((resolve, reject) => {
    console.log('creating left RTCPeerConnection with user ' + userId);
    let conn = new RTCPeerConnection();
    let channel = conn.createDataChannel('chat');
    chat.addDataChannel(channel);

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

function finalizeLeftPeer(userId, conn, desc) {
  console.log('finalizing left RTCPeerConnection with user ' + userId);
  let remote = new RTCSessionDescription(desc);
  conn.setRemoteDescription(remote);
}

function makeRightPeer(userId, socket, desc) {
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
      chat.addDataChannel(event.channel);
    };

    conn.createAnswer().then((local) => {
      conn.setLocalDescription(local);
    }).catch((e) => console.error(e));
  });
}
