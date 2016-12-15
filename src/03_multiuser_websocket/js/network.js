const BASE_URL = location.pathname.substring(
  0, location.pathname.lastIndexOf('/')
);

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
navigator.publishServer('FlyWebRTC: Multi-user').then((server) => {
  console.log('created FlyWeb server');

  // Set up an event handler for whenever the client requests a URL from us.
  server.onfetch = (event) => {
    let url = event.request.url;
    if (url in clientURLMap)
      url = clientURLMap[url];

    console.log('server.onfetch', event.request.url, url);
    event.respondWith(superfetch(BASE_URL + url));
  };

  let clients = new Map();
  let nextClientId = 1;

  clients.set(0, null);
  chat.userId = 0;
  chat.enable();

  // Set up an event handler for when a client requests a WebSocket with us.
  server.onwebsocket = (event) => {
    console.log('server.onwebsocket', event);
    let id = nextClientId++;

    let socket = event.accept();
    socket.onopen = (event) => {
      console.log('socket opened for user ' + id);
      // Send a login message to the client so that they know their user ID and
      // all the currently logged-in users' IDs.
      socket.send(JSON.stringify({
        type: 'login', from: 0, userId: id, users: [...clients.keys()]
      }));
      clients.set(id, socket);
    };

    // Wait for messages from the clients with their WebRTC descriptions for
    // signalling. Incoming messages should look like this:
    //
    //   {type: 'peer-connect', from: userId, desc: desc}
    socket.onmessage = (event) => {
      let message = JSON.parse(event.data);
      console.log('onmessage', message);

      // Modify the message so that it's an *outgoing* message instead.
      let dest = message.to;
      delete message.to;
      message.from = id;

      if (dest === 0) {
        // It's a message for us!
        if (message.type === 'peer-connect') {
          // New clients are always the initiators of WebRTC peer connections,
          // so we know that we only have to handle the receiving side here.
          makeRightPeer(message.from, message.desc).then((conn) => {
            // Once our peer connection is created, send the session description
            // to the client.
            socket.send(JSON.stringify({
              type: 'peer-response', from: 0, desc: conn.localDescription
            }));
          });
        } else {
          console.error('unknown message type ' + message.type);
        }
      } else {
        // Just route this to the right client.
        clients.get(dest).send(JSON.stringify(message));
      }
    };

    // Wait for clients to close their WebSockets so we know when they've logged
    // off.
    socket.onclose = () => {
      console.log('socket closed for user ' + id);
      clients.delete(id);
    };
  };
});
