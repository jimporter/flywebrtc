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

  let clients = new Map();
  clients.set(0, null);
  let nextClientId = 1;

  server.onwebsocket = (event) => {
    console.log('onwebsocket');

    let socket = event.accept();
    let id = nextClientId++;
    socket.onopen = (event) => {
      socket.send(JSON.stringify({
        event: 'connect', id: id, users: [...clients.keys()]
      }));
      clients.set(id, socket);
    };

    socket.onmessage = (event) => {
      let data = JSON.parse(event.data);
      console.log('onmessage', data);

      let dest = data.to;
      delete data.to;
      data.from = id;

      if (dest === 0) {
        // It's a message for us!
        if (data.event === 'peerconnect') {
          makeRightPeer(data.from, socket, data.desc).then((conn) => {
            socket.send(JSON.stringify({
              event: 'peerconnect', from: 0, desc: conn.localDescription
            }));
          });
        }
      } else {
        // Just route this to the right client.
        clients.get(dest).send(JSON.stringify(data));
      }
    };

    socket.onclose = () => {
      clients.delete(id);
    };
  };
});
