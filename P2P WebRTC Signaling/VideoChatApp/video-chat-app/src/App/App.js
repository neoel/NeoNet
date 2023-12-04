import './App.css';
//import { io } from 'socket.io-client';
//import {handleCandidateMessage, dataChannelListeners} from "./functions.js"
//import { useRef } from 'react';
function App() {
/*
var socket = io.connect('localhost:8000');
const connections = new Map();
const dataChannels = new Map();
const configuration = {
    "iceServers": [{ "urls": "stun:stun.l.google.com:19302" }, {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject'
    }]
};

const messageBox = useRef(null);
const sendButton = useRef(null);
const incomingMessages = useRef(null);
socket.on("connect", () => {
    console.log(socket.id);
    socket.emit("member-joined")
});




socket.on("offer", async (msg) => {
    if (msg.to === socket.id) {
        connections.set(msg.from, new RTCPeerConnection(configuration));
        var peerConnection;
        peerConnection = connections.get(msg.from)
        dataChannels.set(msg.from, peerConnection.createDataChannel("chat"))
        const dataChannel = dataChannels.get(msg.from);
        var ice;
        peerConnection.addEventListener('datachannel', event => {
            const dataChannel = event.channel;
            console.log(dataChannel)
        });


        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        console.log(offer);
        socket.emit("send-offer", { "from": socket.id, "to": msg.from, "sdp": offer })

        peerConnection.onicecandidate = async (event) => {
            if (event.candidate) {
                ice = event.candidate;
                console.log(ice)
                if (peerConnection.currentRemoteDescription) {
                    socket.emit("send-ice", { "from": socket.id, "to": msg.from, "ice": ice })
                }
            }
        };


dataChannelListeners(dataChannel, incomingMessages, messageBox, sendButton, connections)
}
});

socket.on("get-ice", async (msg) => {
    if (msg.to === socket.id) {
        var peerConnection = connections.get(msg.from)
        //await peerConnection.addIceCandidate(msg.ice);
        handleCandidateMessage(msg.ice, peerConnection)
    }
});

socket.on("get-answer", async (msg) => {
    if (msg.to === socket.id) {
        var peerConnection = connections.get(msg.from)
        await peerConnection.setRemoteDescription(msg.sdp);
        peerConnection.addEventListener('connectionstatechange', event => {
            if (peerConnection.connectionState === 'connected') {
                console.log('Bravo Gji u lidhe!')
            }
        });
    }
});

socket.on("get-offer", async (msg) => {
    if (msg.to === socket.id) {
        connections.set(msg.from, new RTCPeerConnection(configuration));
        var peerConnection;
        peerConnection = connections.get(msg.from)
        await peerConnection.setRemoteDescription(msg.sdp)
        peerConnection.addEventListener('datachannel', event => {
            const dataChannel = event.channel;
            console.log(dataChannel)

            sendButton.addEventListener('click', event => {
                const message = messageBox.value;
                dataChannel.send(message);
                console.log(message)
            })

            dataChannelListeners(dataChannel, incomingMessages, messageBox, sendButton, connections)

        });
        var ice;
        const answer = await peerConnection.createAnswer()
        await peerConnection.setLocalDescription(answer)
        socket.emit("send-answer", { "from": socket.id, "to": msg.from, "sdp": answer })
        peerConnection.onicecandidate = async (event) => {
            if (event.candidate) {
                ice = event.candidate;
                console.log(ice)
                if (peerConnection.currentRemoteDescription) {
                    socket.emit("send-ice", { "from": socket.id, "to": msg.from, "ice": ice })
                }
            }
        };
        console.log(answer);
    }
});


socket.on("user-left", async (msg) => {
    var peerConnection = connections.get(msg.id);
    var dataChannel = dataChannels.get(msg.id);
    console.log("Closed data channel and peerconnection" + msg.id);
    dataChannel.close();
    peerConnection.close();
});*/
  return (
    <>
    <h1>WebRTC Chat Sandbox</h1>

    <input type="text" id="chattext" disabled></input>
    <button id="sendButton" disabled>Send</button>
    
    <textarea id="chatbox">
    
    </textarea>
    </>
  );
}

export default App;
