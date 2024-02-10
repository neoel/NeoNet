import './App.css';
import { io } from 'socket.io-client';
import { useRef, useEffect, useMemo, useState } from 'react';
import { Peer } from "peerjs";
var forge = require("node-forge");
const socket = io.connect("https://neonet.dev", {
  path: "/signaling/"
});


function App() {
  var rsa = forge.pki.rsa;
  const connections = useMemo(() => new Map(), []);
  const dataConnections = useMemo(() => new Map(), []);
  const [videoConnections, setVideoConnections] = useState([]);
  const [callStreams, setCallStreams] = useState([]);
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
  const [logs, setLogs] = useState([]); // State for logs
  var localStream = useRef(null);
  var { clientPublicKey, clientPrivateKey } = 0;

  const addLog = (message) => {
    setLogs((prevLogs) => [...prevLogs, message]);
  };

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
        localScreen.current.srcObject = value;
        let track = value.getVideoTracks()[0]
        track.onended = function (){
          stopScreenShare()
        }
       videoConnections.map(call => {
        let sender = call.connection.peerConnection.getSenders().find(function(tracks) {
          return tracks.track.kind === track.kind
        })
        sender.replaceTrack(track)
       })
      
      });
    } catch (err) {
      console.error(`Error: ${err}`);
    }
   
  }

 function stopScreenShare(){
  let track = localStream.current.getVideoTracks()[0]
  localScreen.current.srcObject = null;
  videoConnections.map(call => {
    let sender = call.connection.peerConnection.getSenders().find(function(tracks) {
      return tracks.track.kind === track.kind
    })
    sender.replaceTrack(track)
   })
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
    var name = userNameInput.current.value;

    if(name == ""){
      name = "N/A"
    }

    incomingMessages.current.innerHTML += "You: " + messageBox.current.value + "<br>";
    Array.from(dataConnections, ([key, value]) => {
      var publicKey = usersPublicKeys.get(key)
      console.log(publicKey)
      publicKey = forge.pki.publicKeyFromPem(publicKey)
      var messageDataStructure = { "message": name + ": " + messageBox.current.value }
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
              host: "neonet.dev",
              port: "443",
              path: "/peerjs/p2p",
              secure: true,
              debug: 3,
              config: {'iceServers': [
                { urls: 'stun:neonet.dev:3479' },
                { urls: 'turn:neonet.dev:3479', credential: 'neonetproject', username: 'neonet'}
              ]}
            }));
            let peer = connections.get(msg.from)
            let pemKey = forge.pki.publicKeyToPem(clientPublicKey)
            
            peer.on('open', function (id) {
              socket.emit("send-offer", { "from": socket.id, "to": msg.from, "pid": id, "publicKey": pemKey, "room": searchParams.get("room") })
              
            });
            
          }
        }
    
    
    
        function getOffer(msg) {
          if (msg.to === socket.id) {
            console.log("Offer Socket:" + msg.from)
            console.log("Offer ID:" + msg.pid)
            console.log("Public Key: " + msg.publicKey)
            usersPublicKeys.set(msg.from, msg.publicKey)
            
            connections.set(msg.from, new Peer({
              host: "neonet.dev",
              port: "443",
              path: "/peerjs/p2p",
              secure: true,
              debug: 3,
              config: {'iceServers': [
                { urls: 'stun:neonet.dev:3479' },
                { urls: 'turn:neonet.dev:3479', credential: 'neonetproject', username: 'neonet'}
              ]}
            }));
            var peer = connections.get(msg.from)
            let pemKey = forge.pki.publicKeyToPem(clientPublicKey)
            peer.on('open', function (id) {
              socket.emit("send-answer", { "from": socket.id, "to": msg.from, "pid": id, "publicKey": pemKey, "room": searchParams.get("room") })
              
            });

            peer.on('close', function(){

            })

            peer.on('call', function(call) {
                
              setVideoConnections(  [ // with a new array
              ...videoConnections, // that contains all the old items
              { id: msg.from, connection: call } // and one new item at the end
            ])

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
                  setCallStreams(  [ // with a new array
              ...callStreams, // that contains all the old items
              { id: msg.from, videoStream: stream } // and one new item at the end
            ])
                  });
                
                });
            } catch (error) {
                console.error('Error accessing media devices.', error);
            }
  
              });

            
            peer.on("connection", (conn) => {
              dataConnections.set(msg.from, conn)
              conn.on("data", (data) => {
                console.log("Encrypted Data: " + data)
                let decrypted = clientPrivateKey.decrypt(data)
                decrypted = JSON.parse(decrypted)
                incomingMessages.current.innerHTML += decrypted.message + "<br>";
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
            
            dataConnections.set(msg.from, conn)
    
            conn.on("data", (data) => {
              console.log("Encrypted Data: " + data)
              let decrypted = clientPrivateKey.decrypt(data)
              decrypted = JSON.parse(decrypted)
              incomingMessages.current.innerHTML += decrypted.message + "<br>";
            });
    
            conn.on("open", (data) => {
              setUIElementsState(false)
              
            });

            conn.on("close", function(){
              
            })
            
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
              call.on('close', function(){
                
              })
              setVideoConnections(  [ // with a new array
                ...videoConnections, // that contains all the old items
                { id: msg.from, connection: call } // and one new item at the end
              ])
              call.on('stream', function(stream) {
                console.log("Stream from other peer: " + stream)
                setCallStreams(  [ // with a new array
                ...callStreams, // that contains all the old items
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
            setUIElementsState(true);
            addLog('All users left the room.');
          }
        }
    
    
    
        function userLeft(msg) {
          console.log("Closed data channel and peerconnection" + msg.id);
          connections.delete(msg.id)
          dataConnections.delete(msg.id)
          usersPublicKeys.delete(msg.id)
          setCallStreams(
            callStreams.filter(stream => stream.id !== msg.id)
          );
          setVideoConnections(
            videoConnections.filter(vid => vid.id !== msg.id)
          );
          addLog("User " + msg.id +  " left the room.");
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
    }, [connections, dataConnections, clientPrivateKey, clientPublicKey, usersPublicKeys, localStream, videoConnections, callStreams]);
  

  console.log(connections)
  console.log(dataConnections)
  console.log(videoConnections)
  console.log(usersPublicKeys)
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


      <div id="logbox" style={{ height: '200px', border: '2px solid black', marginTop: '20px', overflowY: 'auto' }}>
        {logs.map((log, index) => (
          <div key={index}>{log}</div>
        ))}
      </div>

      <div id='videoStreams' ref={videoStreams}> 

      <div id="selfStream">
      <div>
      <h2>Your webcam</h2>
      <video autoPlay={true} playsInline={true} id="localWebcam" ref={localWebcam}></video>
      </div>

      <div>
      <h2>Your screen</h2>
      <video  autoPlay={true} playsInline={true} id="localScreen" ref={localScreen}></video>
      </div>
      
      
      <button id="webcamToggle" ref={webcamToggle} onClick={toggleWebcam}>Webcam Toggle</button>
      <button id="micToggle" ref={micToggle} onClick={toggleMicrophone}>Microphone Toggle</button>
      <button id="screenSharing" ref={screenShare} onClick={startScreenShare}>ScreenShare</button>
      </div>
    
        {
          callStreams.map((stream => (
            <div className='video-container'>
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
