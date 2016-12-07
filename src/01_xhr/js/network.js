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
  })
}

/**
 * Handle requests to the `/api/signal` URL of the FlyWeb server. This expects
 * the client's WebRTC description in the `desc` parameter of the query string
 * and will respond with the host's WebRTC description as the response body.
 *
 * @param location {String} The URL of the request, including the query string.
 * @param event {FetchEvent} The fetch event returned by FlyWeb's `onfetch`.
 * @return {Promise} A promise resolving to the host's `Response` object.
 */
function signal(location, event) {
  // XXX: FlyWeb servers don't seem to support bodies in POST requests, so the
  // client sends its local WebRTC description via the query string.
  let query = new URLSearchParams(location.search);
  let offer = new RTCSessionDescription(JSON.parse(query.get('desc')));

  return new Promise((resolve, reject) => {
    // Set the remote (client's) description and then create an answer for them.
    conn.setRemoteDescription(offer).then(() => {
      return conn.createAnswer();
    }).then((answer) => {
      return conn.setLocalDescription(answer);
    });

    // Listen for ICE candidates (necessary even though we're not using
    // STUN/TURN servers), and once we're done (when `event.candidate` is null),
    // resolve the promise.
    conn.onicecandidate = (event) => {
      console.log('onicecandidate', event);
      if (!event.candidate)
        resolve();
    };
  }).then(() => {
    // Finally, resolve the promise with a response containing the JSON of the
    // host's WebRTC signalling description.
    return new Response(JSON.stringify(conn.localDescription), {
      headers: {'Content-Type': 'application/json'}
    });
  });
}

// A map from URLs the client might request to the actual files (or a function)
// that they should resolve to. Functions should take a `String` representing
// the URL of the request and a `FetchEvent` corresponding to the original
// request.
const clientURLMap = {
  '/js/network.js': '/js/network-client.js',
  '/': '/index.html',
  '/api/signal': signal,
};

// Publish a FlyWeb server and wait for the Promise to resolve with the server
// object.
navigator.publishServer('FlyWebRTC: XHR').then((server) => {
  // Set up an event handler for whenever the client requests a URL from us.
  server.onfetch = (event) => {
    // This is a slightly-hokey trick to parse the URL we got while changing it
    // as little as possible; unfortunately, the `URL` class makes this
    // difficult to achieve, so we create an <a> element to do it.
    let url = event.request.url;
    let location = document.createElement('a');
    location.href = event.request.url;

    // Check the URL map we created to find what we should respond with.
    if (location.pathname in clientURLMap)
      url = clientURLMap[location.pathname];

    console.log('onfetch', url, location.pathname);
    let response = (typeof url === 'function') ? url(location, event) :
                   superfetch(BASE_URL + url);
    event.respondWith(response);
  };
});
