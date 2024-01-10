import './App.css';
import { io } from 'socket.io-client';
import { useRef, useEffect, useMemo, useState } from 'react';
import { Peer } from "peerjs";
var forge = require("node-forge");
const socket = io.connect('localhost:8000');


function App() {
  var rsa = forge.pki.rsa;
  const connections = useMemo(() => new Map(), []);
  const dataConnections = useMemo(() => new Map(), []);
  const [videoConnections, setVideoConnections] = useState([]);
  const usersPublicKeys = useMemo(() => new Map(), []);
  const messageBox = useRef(null);
  const sendButton = useRef(null);
  const incomingMessages = useRef(null);
  const userNameInput = useRef(null);
  const localWebcam = useRef(null);
  const localScreen = useRef(null);
  const videoStreams = useRef(null);
  const micToggle = useRef(null);
  const webcamToggle = useRef(null);
  const screenShare = useRef(null);
  const [uiElementsState, setUIElementsState] = useState(true);
  var localStream = useRef(null);
  var { clientPublicKey, clientPrivateKey } = 0;

  function toggleWebcam(){
    const videoTrack = localStream.current.getVideoTracks()[0]

    if (videoTrack.enabled === true){
      videoTrack.enabled = false;
    }else{
      videoTrack.enabled = true;
    }
  }

  function toggleMicrophone(){
    const audioTrack = localStream.current.getAudioTracks()[0]

    if (audioTrack.enabled === true){
      audioTrack.enabled = false;
    }else{
      audioTrack.enabled = true;
    }
  }

  function startScreenShare(){

    let constraints = {
      video: {
        displaySurface: "browser",
      },
      audio: {
        suppressLocalAudioPlayback: false,
      },
      preferCurrentTab: false,
      selfBrowserSurface: "exclude",
      systemAudio: "exclude",
      surfaceSwitching: "include",
      monitorTypeSurfaces: "include",
    }

    try {
    
      new Promise((resolve, reject) => {
        const stream = navigator.mediaDevices.getDisplayMedia(constraints);
        resolve(stream)
      }).then((value) => {
      localStream.current.addTrack(value.getVideoTracks()[0])
      localScreen.current.srcObject = value
      });
    } catch (err) {
      console.error(`Error: ${err}`);
    }
   
  }



  const keypair = new Promise((resolve, reject) => {
    rsa.generateKeyPair({ bits: 2048, workers: 2 }, function (err, keypair) {
      resolve(keypair)
    })
  }).then((value) => {
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


  function sendMessage() {

    incomingMessages.current.innerHTML += "You: " + messageBox.current.value + "<br>";
    Array.from(dataConnections, ([key, value]) => {
      var publicKey = usersPublicKeys.get(key)
      publicKey = forge.pki.publicKeyFromPem(publicKey)
      var messageDataStructure = { "message": userNameInput.current.value + ": " + messageBox.current.value }
      let encrypted = publicKey.encrypt(JSON.stringify(messageDataStructure))
      value.send(encrypted)
      return
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
        function connect() {
          console.log(socket.id);
          socket.emit("member-joined", { "room": searchParams.get("room") })
        }
    
        function offer(msg) {
          console.log("User joined:" + msg.from)
          if (msg.from !== socket.id) {
            connections.set(msg.from, new Peer({
              host: "localhost",
              port: "5000",
              path: "/p2p",
              debug: 3
            }));
            let pemKey = forge.pki.publicKeyToPem(clientPublicKey)
            
    
            socket.emit("send-offer", { "from": socket.id, "to": msg.from, "pid": "None", "publicKey": pemKey, "room": searchParams.get("room") })
          }
        }
    
    
    
        function getOffer(msg) {
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
            peer.on('open', function (id) {
              socket.emit("send-answer", { "from": socket.id, "to": msg.from, "pid": id, "publicKey": pemKey, "room": searchParams.get("room") })
              
            });
            peer.on("connection", (conn) => {
              dataConnections.set(msg.from, conn)
              conn.on("data", (data) => {
                console.log("Encrypted Data: " + data)
                let decrypted = clientPrivateKey.decrypt(data)
                decrypted = JSON.parse(decrypted)
                incomingMessages.current.innerHTML += decrypted.message + "<br>";
              });
    
              peer.on('call', function(call) {

                call.on('error', function(err) { console.error(err) });
                
                // Answer the call, providing our mediaStream
                try {
                  const constraints = {
                      video: true,
                      audio: true
                  };
                  
                 new Promise((resolve, reject) => {
                    const stream = navigator.mediaDevices.getUserMedia(constraints);
                    resolve(stream)
                  }).then((value) => {
                  localStream.current = value
                  console.log('Got MediaStream:', localStream);
                  localWebcam.current.srcObject = localStream.current;
                  
                  call.answer(localStream.current);
                  call.on('stream', function(stream) {
                    console.log("Stream from other peer: " + stream)
                    setVideoConnections(  [ // with a new array
                ...videoConnections, // that contains all the old items
                { id: msg.from, videoStream: stream } // and one new item at the end
              ])
                    });
                  
                  });
              } catch (error) {
                  console.error('Error accessing media devices.', error);
              }
    
                });
    
              conn.on("open", (data) => {
                setUIElementsState(false)
    
              });
            });
    
          }
        }
        function getAnswer(msg) {
          if (msg.to === socket.id) {
            console.log("Offer Socket:" + msg.from)
            console.log("Offer ID:" + msg.pid)
            console.log("Public Key: " + msg.publicKey)
            usersPublicKeys.set(msg.from, msg.publicKey)
            var peer = connections.get(msg.from)
            const conn = peer.connect(msg.pid);
            
            
            dataConnections.set(msg.from, conn);
    
    
            conn.on("data", (data) => {
              console.log("Encrypted Data: " + data)
              let decrypted = clientPrivateKey.decrypt(data)
              decrypted = JSON.parse(decrypted)
              incomingMessages.current.innerHTML += decrypted.message + "<br>";
            });
    
            conn.on("open", (data) => {
              setUIElementsState(false)
    
            });

            

            try {
              const constraints = {
                  video: true,
                  audio: true
              };
              
             new Promise((resolve, reject) => {
                const stream = navigator.mediaDevices.getUserMedia(constraints);
                resolve(stream)
              }).then((value) => {
              localStream.current = value
              console.log('Got MediaStream:', localStream);
              localWebcam.current.srcObject = localStream.current;
              console.log("Call trigger localStream: " + localStream.current)
              var call = peer.call(msg.pid, localStream.current)
              call.on('stream', function(stream) {
                console.log("Stream from other peer: " + stream)
                setVideoConnections(  [ // with a new array
                ...videoConnections, // that contains all the old items
                { id: msg.from, videoStream: stream } // and one new item at the end
              ])
                });
  
              call.on('error', function(err) { console.error(err) });
              });
          } catch (error) {
              console.error('Error accessing media devices.', error);
          }
    
           
    
          }
        }
    
        function checkUsersonRoom() {
          if (connections.size === 0 && dataConnections.size === 0) {
            setUIElementsState(true)
          }
        }
    
    
    
        function userLeft(msg) {
          console.log("Closed data channel and peerconnection" + msg.id);
          connections.delete(msg.id)
          dataConnections.delete(msg.id)
          usersPublicKeys.delete(msg.id)
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
    }, [connections, dataConnections, clientPrivateKey, clientPublicKey, usersPublicKeys, localStream, videoConnections]);
  

  console.log(connections)
  console.log(dataConnections)
  console.log(videoConnections)
  return (
    <>
      <h1>WebRTC Chat Sandbox</h1>
      <div id='controls'>
        <label htmlFor="name">Name: </label>
      <input type="text" id="name" ref={userNameInput}></input>
      <input type="text" id="chattext" disabled={uiElementsState} ref={messageBox} onKeyDown={sendMessageOnEnter}></input>
      <button id="sendButton" disabled={uiElementsState} ref={sendButton} onClick={sendMessage}>Send</button>
      </div>
      
      

      <div id="chatbox" ref={incomingMessages}>

      </div>

      <div id='videoStreams' ref={videoStreams}> 
      <div id="selfStream">
      <video autoPlay={true} playsInline={true} id="localWebcam" ref={localWebcam}></video>
      <video  autoPlay={true} playsInline={true} id="localScreen" ref={localScreen}></video>
      <button id="webcamToggle" ref={webcamToggle} onClick={toggleWebcam}>Webcam Toggle</button>
      <button id="micToggle" ref={micToggle} onClick={toggleMicrophone}>Microphone Toggle</button>
      <button id="screenSharing" ref={screenShare} onClick={startScreenShare}>ScreenShare</button>
      </div>
    
        {
          videoConnections.map((stream => (
            <div>
              <video key={stream.id} autoPlay={true} playsInline={true} id={stream.id} ref={(ref) => {
              if (ref) ref.srcObject = stream.videoStream;
            }}></video>
            <p>{stream.id}</p>
            </div>
            
          )))
        }
      </div>
    </>
  );
}

export default App;
