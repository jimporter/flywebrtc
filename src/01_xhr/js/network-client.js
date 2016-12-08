// Create an `RTCPeerConnection` and add a data channel to it.
let conn = new RTCPeerConnection();
let channel = conn.createDataChannel('chat');

// Hook the data channel up to our chat UI.
chat.addDataChannel(channel);

/**
 * Send our WebRTC signalling description to the FlyWeb server and wait for its
 * response. Once the response completes, the `RTCPeerConnection` should be
 * established.
 *
 * @param conn {RTCPeerConnection} The connection to be established.
 */
function sendDescription(conn) {
  console.log('sending WebRTC description to host');
  let desc = encodeURIComponent(JSON.stringify(conn.localDescription));
  fetch('/api/signal?desc=' + desc).then((response) => {
    console.log(response);
    return response.text();
  }).then((s) => {
    console.log('received WebRTC description from host');
    let answer = new RTCSessionDescription(JSON.parse(s));
    conn.setRemoteDescription(answer);
  });
}

// Listen for ICE candidates (necessary even though we're not using STUN/TURN
// servers), and once we're done (when `event.candidate` is null), send the
// signalling description to the FlyWeb server.
conn.onicecandidate = (event) => {
  console.log('conn.onicecandidate', event);
  if (!event.candidate)
    sendDescription(conn);
};

// Finally, create the actual WebRTC offer that kicks this whole process off!
console.log('creating WebRTC offer');
conn.createOffer().then((desc) => {
  return conn.setLocalDescription(desc);
}).catch((e) => console.error('failed to create offer', e));
