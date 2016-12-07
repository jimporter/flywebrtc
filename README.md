# FlyWebRTC

This repository contains some examples of combining FlyWeb and WebRTC to handle
WebRTC's signalling between users on the same local network without the
requirement of STUN/TURN servers. Each example is designed to build on the
previous one, so if you're unfamiliar with FlyWeb and/or WebRTC, you should
probably start at the [src/01_xhr](first one).

## Before you get started

First, you need to have Firefox Nightly (desktop or Android). Then, navigate to
`about:config` and toggle `dom.flyweb.enabled` to true. Finally, customize your
Hamburger menu to include the Flyweb button so you can easily access it.

For more details, see the [https://flyweb.github.io/#getting-started](official
FlyWeb documentation).

## License

This project is licensed under the Mozilla Public License, version 2.0.
