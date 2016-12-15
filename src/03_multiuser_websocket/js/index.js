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
    this._addChatLine('user ' + this.userId, message);
    event.target.value = '';
    event.target.dispatchEvent(new CustomEvent('message', {detail: message}));
  });
}

Chat.prototype = {
  /**
   * This user's ID; used for generating their "username".
   */
  userId: null,

  /**
   * Add a line to the chat log.
   *
   * @param user {String} The user's name (just "user X" for simplicity)
   * @param text {String} The message from the user
   */
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

  /**
   * Enable the chat UI so that the user can start typing messages.
   */
  enable: function() {
    this._input.removeAttribute('disabled');
  },


  /**
   * Add a WebRTC data channel to listen to.
   *
   * @param channel {RTCDataChannel} The data channel.
   */
  addDataChannel: function(userId, channel) {
    // Wait for the channel to open, then enable the chat input and listen for
    // "message" events, which will get sent over the data channel to the other
    // side.
    channel.onopen = (event) => {
      console.log('channel.onopen', event);
      this._input.addEventListener('message', (event) => {
        channel.send(event.detail);
      });
    };

    // Listen for incoming messages and add them to the chat log.
    channel.onmessage = (event) => {
      console.log('channel.onmessage', event);
      this._addChatLine('user ' + userId, event.data);
    };
  }
};

let chat = new Chat();

/**
 * Make the "left" (initiating) side of the WebRTC peer connection.
 *
 * @param userId {Number} The user ID of the user to connect with.
 * @return {Promise} A promise resolving to the created connection object. This
 *         can then be sent to the FlyWeb host who will route it to the other
 *         user.
 */
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

/**
 * Finalize the "left" (initiating) side of the WebRTC peer connection. This
 * should happen after receiving the session description from the receiving
 * side.
 *
 * @param conn {RTCPeerConnection} The peer connection created by `makeLeftPeer`
 * @param userId {Number} The user ID of the user to connect with.
 * @param desc {Object} The remote description of the "right" (receiving) side's
 *        peer connection.
 */
function finalizeLeftPeer(conn, userId, desc) {
  console.log('finalizing left RTCPeerConnection with user ' + userId);
  let remote = new RTCSessionDescription(desc);
  conn.setRemoteDescription(remote);
}

/**
 * Make the "right" (receiving) side of the WebRTC peer connection.
 *
 * @param userId {Number} The user ID of the user to connect with.
 * @param desc {Object} The remote description of the "left" (initiating) side's
 *        peer connection.
  * @return {Promise} A promise resolving to the created connection object. This
 *         can then be sent to the FlyWeb host who will route it to the other
 *         user.
 */
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
