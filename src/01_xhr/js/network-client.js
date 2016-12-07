let conn = new RTCPeerConnection();
let channel = conn.createDataChannel('chat');
chat.addDataChannel(channel);

function sendDescription(conn) {
  let desc = encodeURIComponent(JSON.stringify(conn.localDescription));
  fetch('/api/signal?desc=' + desc).then((response) => {
    console.log(response);
    return response.text();
  }).then((s) => {
    let answer = new RTCSessionDescription(JSON.parse(s));
    conn.setRemoteDescription(answer);
  });
}

conn.onicecandidate = (event) => {
  console.log('onicecandidate', event);
  if (!event.candidate)
    sendDescription(conn);
};

conn.createOffer().then((desc) => {
  return conn.setLocalDescription(desc);
});
