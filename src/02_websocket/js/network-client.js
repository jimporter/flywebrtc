let socket = new WebSocket('ws://' + location.host);

socket.onmessage = (event) => {
  let conn = new RTCPeerConnection();
  conn.onicecandidate = (event) => {
    console.log('onicecandidate', event);
    if (!event.candidate) {
      socket.send(JSON.stringify(conn.localDescription));
    }
  };

  conn.ondatachannel = (event) => {
    chat.addDataChannel(event.channel);
  };

  let offer = new RTCSessionDescription(JSON.parse(event.data));
  conn.setRemoteDescription(offer);
  conn.createAnswer().then((answer) => {
    conn.setLocalDescription(answer);
  });
};
