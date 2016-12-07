let socket = new WebSocket('ws://' + location.host);

socket.onopen = (event) => {
  let pendingPeers = new Map();

  socket.onmessage = (event) => {
    let data = JSON.parse(event.data);
    console.log('onmessage', data);

    if (data.event === 'connect') {
      for (let userId of data.users) {
        makeLeftPeer(userId, socket).then((conn) => {
          pendingPeers.set(userId, conn);
          socket.send(JSON.stringify({
            event: 'peerconnect', to: userId, desc: conn.localDescription
          }));
        });
      }
    } else if (data.event === 'peerconnect') {
      if (pendingPeers.has(data.from)) {
        finalizeLeftPeer(data.from, pendingPeers.get(data.from), data.desc);
        pendingPeers.delete(data.from);
      } else {
        makeRightPeer(data.from, socket, data.desc).then((conn) => {
          socket.send(JSON.stringify({
            event: 'peerconnect', to: data.from, desc: conn.localDescription
          }));
        });
      }
    }
  };
};
