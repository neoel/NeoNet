import './App.css';
import { io } from 'socket.io-client';
import { useRef, useEffect, useMemo, useState} from 'react';
import { Peer } from "peerjs";
var forge = require('node-forge');
const socket = io.connect('localhost:8000');


function App() {
  
  
  var rsa = forge.pki.rsa;
  const connections = useMemo(() => new Map(), []);
  const dataConnections = useMemo(() => new Map(), []);
  const usersPublicKeys = useMemo(() => new Map(), []);
  const messageBox = useRef(null);
  const sendButton = useRef(null);
  const incomingMessages = useRef(null);
  const userNameInput = useRef(null);
  const [uiElementsState, setUIElementsState] = useState(true);
  var {clientPublicKey, clientPrivateKey} = 0;
  
 
  const keypair = new Promise((resolve, reject) => {rsa.generateKeyPair({bits: 2048, workers: 2}, function(err, keypair) {
  resolve(keypair)
  })}).then((value) => {
    return value;
  });

   const keys = () => {
    keypair.then((a) => {
     clientPublicKey = a.publicKey;
     clientPrivateKey = a.privateKey;
     console.log(clientPublicKey)
     console.log(clientPrivateKey)
    });
  };

  
keys()


function sendMessage(){
 
  incomingMessages.current.innerHTML += "You: "  + messageBox.current.value + "<br>";
  Array.from(dataConnections, ([key, value]) => {
    var publicKey = usersPublicKeys.get(key)
    publicKey = forge.pki.publicKeyFromPem(publicKey)
   let encrypted = publicKey.encrypt(userNameInput.current.value + ": " + messageBox.current.value)
    value.send(encrypted)
  }
    
  )
  messageBox.current.value = "";
}

const sendMessageOnEnter = event => {
  if (event.key === 'Enter') {
    sendMessage();
  }

}
useEffect(() => {
  const urlSearchString = window.location.search;

  const searchParams = new URLSearchParams(urlSearchString);
function connect(){
    console.log(socket.id);
    socket.emit("member-joined", { "room": searchParams.get("room")})
}

function offer(msg){
  console.log("User joined:" + msg.from)
    if (msg.from !== socket.id) {
        connections.set(msg.from, new Peer({
          host: "localhost",
          port: "5000",
          path: "/p2p",
            debug: 3
    }));
    let pemKey = forge.pki.publicKeyToPem(clientPublicKey)
    
    
    socket.emit("send-offer", { "from": socket.id, "to": msg.from, "pid": "None", "publicKey": pemKey, "room": searchParams.get("room")})
}
}



function getOffer(msg){
    if (msg.to === socket.id) {
        console.log("Offer Socket:" + msg.from)
        console.log("Offer ID:" + msg.pid)
        console.log("Public Key: " + msg.publicKey)
        usersPublicKeys.set(msg.from, msg.publicKey)
        connections.set(msg.from, new Peer({
          host: "localhost",
          port: "5000",
          path: "/p2p",
          debug: 3
  }));
        var peer = connections.get(msg.from)
        let pemKey = forge.pki.publicKeyToPem(clientPublicKey)
        peer.on('open', function(id) {
          socket.emit("send-answer", { "from": socket.id, "to": msg.from, "pid": id, "publicKey": pemKey, "room": searchParams.get("room")})
          });
          peer.on("connection", (conn) => {
            dataConnections.set(msg.from, conn)
            conn.on("data", (data) => {
              console.log("Encrypted Data: " +  data)
              let decrypted = clientPrivateKey.decrypt(data)
              incomingMessages.current.innerHTML += decrypted + "<br>";
            });

            conn.on("open", (data) => {
              setUIElementsState(false)
              
            });
          });
          
    }
}
function getAnswer(msg){
  if (msg.to === socket.id) {
    console.log("Offer Socket:" + msg.from)
    console.log("Offer ID:" + msg.pid)
    console.log("Public Key: " + msg.publicKey)
    usersPublicKeys.set(msg.from, msg.publicKey)
    var peer = connections.get(msg.from)
    const conn = peer.connect(msg.pid);
    dataConnections.set(msg.from, conn);
    
    
      conn.on("data", (data) => {
        console.log("Encrypted Data: " +  data)
        let decrypted = clientPrivateKey.decrypt(data)
        incomingMessages.current.innerHTML += decrypted + "<br>";
      });

      conn.on("open", (data) => {
        setUIElementsState(false)
        
      });
    
  }
}

function checkUsersonRoom(){
  if (connections.size === 0 && dataConnections.size === 0){
    setUIElementsState(true)
  }
}



function userLeft(msg){
    console.log("Closed data channel and peerconnection" + msg.id);
    connections.delete(msg.id)
    dataConnections.delete(msg.id)
    usersPublicKeys.delete()
    checkUsersonRoom()
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

}, [connections, dataConnections]);
console.log(connections)
console.log(dataConnections)
  return (
    <>
    <h1>WebRTC Chat Sandbox</h1>
    <label htmlFor="name">Name: </label>
    <input type="text" id="name" ref={userNameInput}></input>
    <input type="text" id="chattext" disabled={uiElementsState} ref={messageBox} onKeyDown={sendMessageOnEnter}></input>
    <button id="sendButton" disabled={uiElementsState} ref={sendButton} onClick={sendMessage}>Send</button>
    
    <div id="chatbox" ref={incomingMessages}>
    
    </div>
    </>
  );
}

export default App;
