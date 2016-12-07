let socket = new WebSocket('ws://' + location.host);

socket.onopen = (event) => {
  let pendingPeers = new Map();

  socket.onmessage = (event) => {
    let data = JSON.parse(event.data);
    console.log('onmessage', data);

    if (data.event === 'connect') {
      chat.userId = data.userId;
      chat.enable();

      for (let userId of data.users) {
        makeLeftPeer(userId).then((conn) => {
          pendingPeers.set(userId, conn);
          socket.send(JSON.stringify({
            event: 'peerconnect', to: userId, desc: conn.localDescription
          }));
        });
      }
    } else if (data.event === 'peerconnect') {
      if (pendingPeers.has(data.from)) {
        finalizeLeftPeer(pendingPeers.get(data.from), data.from, data.desc);
        pendingPeers.delete(data.from);
      } else {
        makeRightPeer(data.from, data.desc).then((conn) => {
          socket.send(JSON.stringify({
            event: 'peerconnect', to: data.from, desc: conn.localDescription
          }));
        });
      }
    }
  };
};
