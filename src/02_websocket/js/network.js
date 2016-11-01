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
  }).catch((e) => {
    return new Response(e, {
      status: 404
    });
  });
}

navigator.publishServer('FlyWebRTC').then((server) => {
  const clientURLMap = {
    '/js/network.js': '/js/network-client.js',
    '/': '/index.html',
  };

  server.onfetch = (event) => {
    let url = event.request.url;
    if (url in clientURLMap)
      url = clientURLMap[url];

    event.respondWith(superfetch(BASE_URL + url));
  };

  server.onwebsocket = (event) => {
    console.log('onwebsocket');

    let socket = event.accept();
    let conn = new RTCPeerConnection();
    let channel = conn.createDataChannel('chat');
    initDataChannel(channel);

    socket.onmessage = (event) => {
      let answer = new RTCSessionDescription(JSON.parse(event.data));
      conn.setRemoteDescription(answer);
    };

    socket.onopen = () => {
      conn.onicecandidate = (event) => {
        console.log('onicecandidate', event);
        if (!event.candidate) {
          socket.send(JSON.stringify(conn.localDescription));
        }
      };
    };

    conn.createOffer().then((desc) => {
      return conn.setLocalDescription(desc);
    }).catch((e) => console.error(e));
  };
});
