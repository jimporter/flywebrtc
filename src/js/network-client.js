function now() {
  return new Date(Date.now());
}

let socket = new WebSocket('ws://' + location.host);

socket.onmessage = (event) => {
  console.log(now(), 'socket.onmessage', event.data);
  socket.send('hello from client');
};
