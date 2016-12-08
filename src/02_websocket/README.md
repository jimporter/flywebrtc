# FlyWebRTC Example 2: Signalling via WebSockets

This example builds on the previous one: it's still a simple chat client for two
users with messages going through WebRTC, but this time around, the signalling
is handled via a WebSocket. For now, these are roughly equivalent, but in the
next example, we'll see how WebSockets can provide more utility for more-complex
scenarios.

## Usage

Like the previous example, when you open `index.html` in your browser, it will
request your permission to create a FlyWeb server. Once you accept, you can go
to the FlyWeb section in your Hamburger menu and select "FlyWebRTC: WebSocket"
to connect as a client to your server.

## General design

This example works much like the previous one: in
[`js/network.js`](js/network.js), the host first creates an `RTCPeerConnection`,
publishes its FlyWeb server, and waits for a client to connect to it. Once the
client connects, they create their own `RTCPeerConnection` in
[`js/network-client.js`](js/network-client.js) with a data channel as well as a
WebSocket to the host. Once the socket opens, the client sends the connection's
local description for signalling purposes. The server receives this, creates an
answer, and sends it to the client over the WebSocket.

Identical to the previous example, in [`index.js`](index.js), we hook up the
data channel to the UI so that, when the user sends a message, it gets passed
through the data channel, and when we receive a message from that channel, it
gets added to the chat log.
