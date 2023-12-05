import './App.css';
import { io } from 'socket.io-client';
import {handleCandidateMessage, dataChannelListeners} from "./functions.js"
import { useRef, useEffect } from 'react';
import { Peer } from "peerjs";
const socket = io.connect('localhost:8000');
function App() {


const connections = new Map();
const dataChannels = new Map();

const messageBox = useRef();
const sendButton = useRef();
const incomingMessages = useRef();

useEffect(() => {

function connect(){
    console.log(socket.id);
    socket.emit("member-joined")
}

function offer(msg){
    if (msg.to == socket.id) {
        connections.set(msg.from, new Peer({
            host: "0.peerjs.com",
  port: 443,
  path: "/",
  pingInterval: 5000,
            config: {
                "iceServers": [{ "urls": "stun:stun.l.google.com:19302" }, {
                    "urls": 'turn:openrelay.metered.ca:80',
                    "username": 'openrelayproject',
                    "credential": 'openrelayproject'
                }]
              },
            debug: 2
    }));
        var peer = connections.get(msg.from)
        peer.on('open', function(id) {
            socket.emit("send-offer", { "from": socket.id, "to": msg.from, "pid": id})
          });
        
          peer.on('connection', function(peerjsConnection) {
            peerjsConnection.on('open', function() {
                // Receive messages
                peerjsConnection.on('data', function(data) {
                    console.log('Received', data);
                });
                
                // Send messages
                peerjsConnection.send('Hello from markers-page!');
            });
        });
          
}
}

function getOffer(msg){
    if (msg.to == socket.id) {
        console.log("Offer Socket:" + msg.from)
        console.log("Offer ID:" + msg.pid)
        connections.set(msg.from, new Peer({
            host: "0.peerjs.com",
  port: 443,
  path: "/",
  pingInterval: 5000,
            config: {
                "iceServers": [{ "urls": "stun:stun.l.google.com:19302" }, {
                        "urls": 'turn:openrelay.metered.ca:80',
                        "username": 'openrelayproject',
                        "credential": 'openrelayproject'
                    }]
                  },
                debug: 2
        }));
        var peer = connections.get(msg.from)
        var conn = peer.connect(msg.pid)
        peer.on('connection', function(conn) { console.log("Connected") });
        conn.on('open', function() {
            // Receive messages
            conn.on('data', function(data) {
              console.log('Received', data);
            });
        
            // Send messages
            conn.send('Hello!');
          });
    
    }
}


function userLeft(msg){
    console.log("Closed data channel and peerconnection" + msg.id);
}

socket.on("connect", connect);
socket.on("offer", offer);
socket.on("get-offer", getOffer);
socket.on("user-left", userLeft);

return () => {
socket.off("connect", connect);
socket.off("offer", offer);
socket.off("get-offer", getOffer);
socket.off("user-left", userLeft);
}

}, []);
  return (
    <>
    <h1>WebRTC Chat Sandbox</h1>

    <input type="text" id="chattext" disabled ref={messageBox}></input>
    <button id="sendButton" disabled ref={sendButton}>Send</button>
    
    <textarea id="chatbox" ref={incomingMessages}>
    
    </textarea>
    </>
  );
}

export default App;
