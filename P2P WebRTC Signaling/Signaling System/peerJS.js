const { PeerServer } = require("peer");

const peerServer = PeerServer({ port: 5000, path: "/p2p" });