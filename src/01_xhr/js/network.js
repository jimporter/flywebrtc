const BASE_URL = location.pathname.substring(
  0, location.pathname.lastIndexOf('/')
);

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

function signal(location, event) {
  // XXX: FlyWeb servers don't seem to support bodies in POST requests, so the
  // client sends its local WebRTC description via the query string.
  let query = new URLSearchParams(location.search);

  let offer = new RTCSessionDescription(JSON.parse(query.get('desc')));
  return new Promise((resolve, reject) => {
    conn.setRemoteDescription(offer).then(() => {
      return conn.createAnswer();
    }).then((answer) => {
      return conn.setLocalDescription(answer);
    });

    conn.onicecandidate = (event) => {
      console.log('onicecandidate', event);
      if (!event.candidate)
        resolve();
    };
  }).then(() => {
    return new Response(JSON.stringify(conn.localDescription), {
      headers: {'Content-Type': 'application/json'}
    });
  });
}

const clientURLMap = {
  '/js/network.js': '/js/network-client.js',
  '/': '/index.html',
  '/api/signal': signal,
};

let conn = new RTCPeerConnection();
conn.ondatachannel = (event) => {
  initDataChannel(event.channel);
};

navigator.publishServer('FlyWebRTC: XHR').then((server) => {
  server.onfetch = (event) => {
    let url = event.request.url;
    let location = document.createElement('a');
    location.href = event.request.url;

    if (location.pathname in clientURLMap)
      url = clientURLMap[location.pathname];

    console.log('onfetch', url, location.pathname);
    let response = (typeof url === 'function') ? url(location, event) :
                   superfetch(BASE_URL + url);
    event.respondWith(response);
  };
});
