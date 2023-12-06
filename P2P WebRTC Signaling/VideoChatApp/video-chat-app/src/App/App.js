import './App.css';
import { io } from 'socket.io-client';
import { useRef, useEffect, useState} from 'react';
import { Peer } from "peerjs";
const socket = io.connect('localhost:8000');
function App() {



const [connections, setConnections] = useState(new Map());
//const dataChannels = new Map();

const messageBox = useRef(null);
const sendButton = useRef(null);
const incomingMessages = useRef(null);

useEffect(() => {

function connect(){
    console.log(socket.id);
    socket.emit("member-joined")
}

function offer(msg){
    if (msg.to === socket.id) {
        setConnections(connections.set(msg.from, new Peer({
            debug: 3
    })));
    socket.emit("send-offer", { "from": socket.id, "to": msg.from, "pid": "None"})
}
}

function getOffer(msg){
    if (msg.to === socket.id) {
        console.log("Offer Socket:" + msg.from)
        console.log("Offer ID:" + msg.pid)
        setConnections(connections.set(msg.from, new Peer({
          debug: 3
  })));
        var peer = connections.get(msg.from)
        
        peer.on('open', function(id) {
          socket.emit("send-answer", { "from": socket.id, "to": msg.from, "pid": id})
          });
          peer.on("connection", (conn) => {
            conn.on("data", (data) => {
              console.log("Received data", data);
            });

            conn.on("open", (data) => {
              conn.send("Mirmrama!")
            });
          });
          
    }
}
function getAnswer(msg){
  if (msg.to === socket.id) {
    console.log("Offer Socket:" + msg.from)
    console.log("Offer ID:" + msg.pid)
    var peer = connections.get(msg.from)
    const conn = peer.connect(msg.pid);
conn.on("open", () => {
  conn.send("Hello World!");
});
conn.on("data", (data) => {
  console.log("Received data", data);
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
socket.on("get-answer", getAnswer);
return () => {
socket.off("connect", connect);
socket.off("offer", offer);
socket.off("get-offer", getOffer);
socket.off("user-left", userLeft);
socket.off("get-answer", getAnswer);
}

}, [connections]);
console.log(connections)
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
