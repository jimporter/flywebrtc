let socket = new WebSocket('ws://' + location.host);

socket.onopen = (event) => {
  // Create a mapping of user IDs to `RTCPeerConnection` objects for all the
  // peer connections we've created but haven't finalized.
  let pendingPeers = new Map();

  // Wait for messages from the FlyWeb server to handle the signalling process
  // for WebRTC.
  socket.onmessage = (event) => {
    let message = JSON.parse(event.data);
    console.log('onmessage', message);

    if (message.type === 'login') {
      // This is the first message we should get from the FlyWeb server. It
      // tells us our user ID and the IDs of all the other users currently
      // logged-in.

      chat.userId = message.userId;
      chat.enable();

      // Initiate a peer connection with every current user.
      for (let userId of message.users) {
        makeLeftPeer(userId).then((conn) => {
          pendingPeers.set(userId, conn);
          // Once our peer connection is created, send the session description
          // to the server to route to the correct client.
          socket.send(JSON.stringify({
            type: 'peer-connect', to: userId, desc: conn.localDescription
          }));
        });
      }
    } else if (message.type === 'peer-response') {
      // These messages are responses from each user that we've tried to
      // initiate peer connections with. We just need to finalize the connection
      // and we're done!

      if (!pendingPeers.has(message.from)) {
        console.error('no pending connection for user ' + message.from);
        return;
      }

      finalizeLeftPeer(pendingPeers.get(message.from), message.from,
                       message.desc);
      pendingPeers.delete(message.from);
    } else if (message.type === 'peer-connect') {
      // These messages are from other, newer users who want to set up a peer
      // connection with us. We need to initiate the "right" (receiving) side of
      // the connection and relay out session description to the initiator.

      makeRightPeer(message.from, message.desc).then((conn) => {
        socket.send(JSON.stringify({
          type: 'peer-response', to: message.from, desc: conn.localDescription
        }));
      });
    } else {
      console.error('unknown message type ' + message.type);
    }
  };
};
