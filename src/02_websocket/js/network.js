const BASE_URL = location.pathname.substring(
  0, location.pathname.lastIndexOf('/')
);

// Create an `RTCPeerConnection` and wait until the client creates theirs so we
// can hook them up.
let conn = new RTCPeerConnection();
conn.ondatachannel = (event) => {
  chat.addDataChannel(event.channel);
};

/**
 * An enhanced version of the `fetch` function.
 *
 * @param url {String} The URL to fetch.
 * @return {Promise} A promise resolving to the `Response` object.
 */
function superfetch(url) {
  // XXX: Ideally, we should be able to just pass the result of the `fetch()`
  // call directly to `respondWith()`. However, this will not work if the page
  // hosting the FlyWeb server is on a host using HTTP compression (e.g. GitHub
  // Pages). Once HTTP compression is supported, we can drop this and just use
  // `fetch()`.

  let contentType;
  return fetch(url).then((response) => {
    contentType = response.headers.get('Content-Type');
    return response.blob();
  }).then((blob) => {
    return new Response(blob, {
      headers: {'Content-Type': contentType}
    });
  }).catch((e) => {
    return new Response(e, {
      status: 404
    });
  });
}

// A map from URLs the client might request to the actual files that they should
// resolve to.
const clientURLMap = {
  '/js/network.js': '/js/network-client.js',
  '/': '/index.html',
};

// Publish a FlyWeb server and wait for the Promise to resolve with the server
// object.
navigator.publishServer('FlyWebRTC: WebSocket').then((server) => {
  console.log('created FlyWeb server');

  // Set up an event handler for whenever the client requests a URL from us.
  server.onfetch = (event) => {
    let url = event.request.url;
    if (url in clientURLMap)
      url = clientURLMap[url];

    console.log('server.onfetch', event.request.url, url);
    event.respondWith(superfetch(BASE_URL + url));
  };

  // Set up an event handler for when a client requests a WebSocket with us.
  server.onwebsocket = (event) => {
    console.log('server.onwebsocket', event);
    let socket = event.accept();

    // Wait for a message from the client with their WebRTC description for
    // signalling.
    socket.onmessage = (event) => {
      // Listen for ICE candidates (necessary even though we're not using
      // STUN/TURN servers), and once we're done (when `event.candidate` is
      // null), send the signalling description to the FlyWeb client.
      conn.onicecandidate = (event) => {
        console.log('conn.onicecandidate', event);
        if (!event.candidate) {
          console.log('sending WebRTC description to client');
          socket.send(JSON.stringify(conn.localDescription));
        }
      };

      // Set the remote (client's) description and then create an answer for
      // them.
      let offer = new RTCSessionDescription(JSON.parse(event.data));
      conn.setRemoteDescription(offer).then(() => {
        console.log('creating WebRTC answer');
        return conn.createAnswer();
      }).then((answer) => {
        console.log('created answer');
        conn.setLocalDescription(answer);
      }).catch((e) => console.error('failed to create answer', e));
    };
  };
});
