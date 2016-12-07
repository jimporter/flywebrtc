# FlyWeb Example 1: Signalling via XHR

This example is an extremely-simple chat client for two users with messages
going through a WebRTC data channel and the signalling handled by XHR
(technically a `fetch()` call).

## Usage

When you open `index.html` in your browser, it will request your permission to
create a FlyWeb server. Once you accept, you can go to the FlyWeb section in
your Hamburger menu and select "FlyWebRTC: XHR" to connect as a client to your
server.

## General design

In order to connect two devices via WebRTC, both sides must create an
`RTCPeerConnection`, with one side creating some communication channels (audio,
video, and/or data). Once this is done, the devices need to set up their
connection; this is called "signalling". The first side creates a WebRTC offer
and sends the description of it to its partner. The partner adds this
description to its `RTCPeerConnection` and responds with an answer description.
Once the first side adds this description to *its* `RTCPeerConnection`, the
connection is established and now you can send/receive data!

Here's how this example handles the WebRTC signalling: in
[js/network.js](`js/network.js`), the host first creates an `RTCPeerConnection`,
publishes its FlyWeb server, and waits for a client to connect to it. Once the
client connects, they create their own `RTCPeerConnection` in
[js/network-client.js](`js/network-client.js`) with a data channel and query
`/api/signal?desc=<description>`, where *description* is the connection's local
description for signalling purposes. The server receives this, creates an
answer, and sends it to the client in the HTTP response body.

In [index.js](`index.js`), we hook up the data channel to the UI so that, when
the user sends a message, it gets passed through the data channel, and when we
receive a message from that channel, it gets added to the chat log.
