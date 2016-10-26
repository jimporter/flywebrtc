function now() {
  return new Date(Date.now());
}

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
  console.log(now(), 'published server');

  const clientURLMap = {
    '/js/network.js': '/js/network-client.js',
    '/': '/index.html',
  };

  server.onfetch = (event) => {
    console.log(now(), 'server.onfetch', event.request.url);
    let url = event.request.url;
    if (url in clientURLMap)
      url = clientURLMap[url];

    event.respondWith(superfetch(BASE_URL + url));
  };

  server.onwebsocket = (event) => {
    console.log(now(), 'server.onwebsocket');

    let socket = event.accept();
    socket.onmessage = (event) => {
      console.log(now(), 'socket.onmessage', event.data);
    };

    socket.onopen = () => {
      socket.send('hi');
    };
  };
});
