// Import necessary dependencies and styles
import './App.css';
import { io } from 'socket.io-client';
import { useRef, useEffect, useMemo, useState } from 'react';
import { Peer } from 'peerjs';
import forge from 'node-forge';

// Connect to the socket server
const socket = io.connect('localhost:8000');

// Main functional component for the application
function App() {
  // Initialize variables and state
  const connections = useMemo(() => new Map(), []); // Map to store Peer connections
  const dataConnections = useMemo(() => new Map(), []); // Map to store data connections
  const usersPublicKeys = useMemo(() => new Map(), []); // Map to store users' public keys
  const messageBox = useRef(null); // Ref for the message input box
  const sendButton = useRef(null); // Ref for the send button
  const incomingMessages = useRef(null); // Ref for the incoming messages container
  const userNameInput = useRef(null); // Ref for the user name input
  const [uiElementsState, setUIElementsState] = useState(true); // State to manage UI elements visibility
  const [logs, setLogs] = useState([]); // State for logs
  var clientPublicKey, clientPrivateKey;

  const keypair = new Promise((resolve, reject) => {
    forge.pki.rsa.generateKeyPair({ bits: 2048, workers: 2 }, function (err, keypair) {
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

  // Function to send a message
  function sendMessage() {
    // Display the user's message in the chatbox
    incomingMessages.current.innerHTML += "You:" +   messageBox.current.value + "<br>";

    // Encrypt and send the message to each connected user
    Array.from(dataConnections, ([key, value]) => {
      const publicKey = usersPublicKeys.get(key);
      const parsedPublicKey = forge.pki.publicKeyFromPem(publicKey);
      const encrypted = parsedPublicKey.encrypt(userNameInput.current.value + ":" + messageBox.current.value);
      value.send(encrypted);
    });

    messageBox.current.value = ''; // Clear the message input box
  }

  // Function to send a message on pressing Enter
  const sendMessageOnEnter = (event) => {
    if (event.key === 'Enter') {
      sendMessage();
    }
  };

  // useEffect hook to handle socket events and manage connections
  useEffect(() => {
    // Get room information from URL parameters
    const urlSearchString = window.location.search;
    const searchParams = new URLSearchParams(urlSearchString);

    // Function to connect to the socket server
    function connect() {
      console.log(socket.id);
      socket.emit('member-joined', { "room": searchParams.get('room') });
      addLog('Connected to the socket server.');
    }

    // Function to handle the offer message
    function offer(msg) {
      console.log("User joined:" + msg.from);
      if (msg.from !== socket.id) {
        connections.set(msg.from, new Peer({
          host: 'localhost',
          port: '5000',
          path: '/p2p',
          debug: 3,
        }));
        const pemKey = forge.pki.publicKeyToPem(clientPublicKey); // Use keypair here
        socket.emit('send-offer', { "from": socket.id, "to": msg.from, "pid": 'None', "publicKey": pemKey, "room": searchParams.get('room') });
      }
    }

    // Function to handle receiving an offer message
    function getOffer(msg) {
      if (msg.to === socket.id) {
        console.log("Offer Socket:" + msg.from);
        console.log("Offer ID:" + msg.pid);
        console.log("Public Key:" + msg.publicKey);
        usersPublicKeys.set(msg.from, msg.publicKey);
        connections.set(msg.from, new Peer({
          host: 'localhost',
          port: '5000',
          path: '/p2p',
          debug: 3,
        }));
        const peer = connections.get(msg.from);
        const pemKey = forge.pki.publicKeyToPem(clientPublicKey); // Use keypair here
        peer.on('open', (id) => {
          socket.emit('send-answer', { "from": socket.id, "to": msg.from, "pid": id, "publicKey": pemKey, "room": searchParams.get('room') });
        });
        peer.on('connection', (conn) => {
          dataConnections.set(msg.from, conn);
          conn.on('data', (data) => {
            console.log("Encrypted Data:" + data);
            const decrypted = clientPrivateKey.decrypt(data); // Use keypair here
            incomingMessages.current.innerHTML += decrypted + "<br>";
          });

          conn.on('open', () => {
            setUIElementsState(false);
          });
        });
      }
    }

    // Function to handle receiving an answer message
    function getAnswer(msg) {
      if (msg.to === socket.id) {
        console.log("Offer Socket:" + msg.from);
        console.log("Offer ID:" + msg.pid);
        console.log("Public Key:" + msg.publicKey);
        usersPublicKeys.set(msg.from, msg.publicKey);
        const peer = connections.get(msg.from);
        const conn = peer.connect(msg.pid);
        dataConnections.set(msg.from, conn);

        conn.on('data', (data) => {
          console.log("Encrypted Data:" + data);
          const decrypted = clientPrivateKey.decrypt(data); // Use keypair here
          incomingMessages.current.innerHTML += decrypted + "<br>";
        });

        conn.on('open', () => {
          setUIElementsState(false);
        });
      }
    }

    // Function to check if users are in the room and update UI state accordingly
    function checkUsersInRoom() {
      if (connections.size === 0 && dataConnections.size === 0) {
        setUIElementsState(true);
        addLog('All users left the room.');
      }
    }

    // Function to handle when a user leaves
    function userLeft(msg) {
      console.log("Closed data channel and peerconnection" + msg.id);
      connections.delete(msg.id);
      dataConnections.delete(msg.id);
      usersPublicKeys.delete();
      checkUsersInRoom();
      addLog("User " + msg.id +  "left the room.");
    }

    // Set up event listeners for socket events
    socket.on('connect', connect);
    socket.on('offer', offer);
    socket.on('get-offer', getOffer);
    socket.on('user-left', userLeft);
    socket.on('get-answer', getAnswer);

    // Clean up event listeners when the component is unmounted
    return () => {
      socket.off('connect', connect);
      socket.off('offer', offer);
      socket.off('get-offer', getOffer);
      socket.off('user-left', userLeft);
      socket.off('get-answer', getAnswer);
    };
  }, [connections, dataConnections, keypair]);

  // Log connections and data connections for debugging
  console.log('Connections:', connections);
  console.log('Data Connections:', dataConnections);

  // Function to add a log message
  const addLog = (message) => {
    setLogs((prevLogs) => [...prevLogs, message]);
  };

  // JSX for the component
  return (
    <>
      <h1>WebRTC Chat Sandbox</h1>
      <label htmlFor="name">Name: </label>
      <input type="text" id="name" ref={userNameInput} />
      <input type="text" id="chattext" disabled={uiElementsState} ref={messageBox} onKeyDown={sendMessageOnEnter} />
      <button id="sendButton" disabled={uiElementsState} ref={sendButton} onClick={sendMessage}>Send</button>

      <div id="chatbox" ref={incomingMessages}>
        {/* Chatbox content goes here */}
      </div>

      {/* New box for logs */}
      <div id="logbox" style={{ height: '200px', border: '2px solid black', marginTop: '20px', overflowY: 'auto' }}>
        {logs.map((log, index) => (
          <div key={index}>{log}</div>
        ))}
      </div>
    </>
  );
}

// Export the App component
export default App;