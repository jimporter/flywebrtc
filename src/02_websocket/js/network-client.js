let socket = new WebSocket('ws://' + location.host);

// Create an `RTCPeerConnection` and add a data channel to it.
let conn = new RTCPeerConnection();
let channel = conn.createDataChannel('chat');

// Hook the data channel up to our chat UI.
chat.addDataChannel(channel);

// Listen for ICE candidates (necessary even though we're not using STUN/TURN
// servers), and once we're done (when `event.candidate` is null), send the
// signalling description to the FlyWeb server.
conn.onicecandidate = (event) => {
  console.log('conn.onicecandidate', event);
  if (!event.candidate) {
    console.log('sending WebRTC description to host');
    socket.send(JSON.stringify(conn.localDescription));
  }
};

// Once the socket is opened, create the actual WebRTC offer that kicks this
// whole process off!
socket.onopen = (event) => {
  console.log('creating WebRTC offer');
  conn.createOffer().then((desc) => {
    console.log('created offer');
    return conn.setLocalDescription(desc);
  }).catch((e) => console.error('failed to create offer', e));
};

// Wait for a message from the FlyWeb server to finish the signalling process
// for WebRTC.
socket.onmessage = (event) => {
  console.log('received WebRTC description from host');
  let answer = new RTCSessionDescription(JSON.parse(event.data));
  conn.setRemoteDescription(answer);
};
