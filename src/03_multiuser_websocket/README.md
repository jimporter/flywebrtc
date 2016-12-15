# FlyWebRTC Example 3: Supporting Multiple Users

This example is somewhat more realistic: now, instead of only supporting two
users, any number of users can connect to the FlyWeb server. Like in the
previous example, we use WebSockets to handle the signalling, but since there
can be many clients at once, we need to relay the session descriptions to each
client.

## Usage

As with the other examples, when you open `index.html` in your browser, it will
request your permission to create a FlyWeb server. Once you accept, you can go
to the FlyWeb section in your Hamburger menu and select "FlyWebRTC: Multi-user"
to connect as a client to your server.

## General design

In this example, we start out in [`js/network.js`](js/network.js) by creating
our FlyWeb server and waiting for clients to connect and establish a WebSocket
connection. Once that happens, we can send a message from the FlyWeb server to
the new client with some important login information (the client's user ID and
the IDs of all the other users currently online).

In [`js/network-client.js`](js/network-client.js), the client receives this
information and begins creating `RTCPeerConnection`s with a data channel for
every other user in the chat room (including the user running the FlyWeb
server). The client then sends one message per peer connection to the server,
who routes it to the appropriate client on the receiving side.

Clients (the FlyWeb server included) listen for this message, and upon receiving
it, create their own `RTCPeerConnection` and send a response message through the
server back to the initiator. Once the initiator receives this message, the
`RTCPeerConnection` is fully-established.

As in the previous examples, in [`index.js`](index.js), we hook up the data
channel to the UI so that, when the user sends a message, it gets passed through
the data channel, and when we receive a message from that channel, it gets added
to the chat log.

## Message format

Since this example is a little more complex, we need to define a protocol for
sending messages back and forth. When sending a message, we use JSON with two
main attributes: `type` and `to`. `type` defines the kind of message being
sent, and `to` is the user ID of the recipient. When the FlyWeb server receives
the message, it will route the message to the recipient and replace the `to`
attribute with a `from` attribute, indicating the user ID of the sender.

### Message types

Currently there are three types of messages defined:

#### login

This message is sent by the FlyWeb server to newly-connected clients. It has two
data attributes:

* `userId`: The ID of the newly-connected user
* `users`: An array of user IDs for existing users

#### peer-connect

This message is sent by new users to all existing ones to begin the RTC peer
connection. It has one data attribute:

* `desc`: The session description of the initiating side of the peer connection

#### peer-response

This message is sent in response to a [peer-connect](#peer-connect) message to
finalize the RTC peer connection. It has one data attribute:

* `desc`: The session description of the receiving side of the peer connection
