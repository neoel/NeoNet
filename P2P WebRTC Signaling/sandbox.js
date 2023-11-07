var socket = io.connect('localhost:8000');


const configuration = {"iceServers": [{"urls": "stun:stun.l.google.com:19302"},  {
    urls: 'turn:openrelay.metered.ca:80',
    username: 'openrelayproject',
    credential: 'openrelayproject'
}]};

function handleCandidateMessage(candidate, pc) {
    let candidates = new RTCIceCandidate(candidate);
    let receivers = pc.getReceivers();
  
    receivers.forEach((receiver) => {
      let parameters = receiver.transport.getParameters();
  
      if (parameters.usernameFragment === candidates.usernameFragment) {
        return;
      }
    });
  
    pc.addIceCandidate(candidate).catch(reportError);
  }
  

    
    
    const messageBox = document.querySelector('#chattext');
    const sendButton = document.querySelector('#sendButton');
    const incomingMessages = document.querySelector('#chatbox');
    const offer = document.getElementById("offer");
    const answer = document.getElementById("answer");
    const connectButton = document.getElementById("connectButton");

    socket.on("connect", () => {
        console.log(socket.id);
        socket.emit("member-joined")
      });

    
    socket.on("offer", async (msg) => {
    if (msg.to == socket.id){
        var peerConnection;
        peerConnection = new RTCPeerConnection(configuration);
        const dataChannel = peerConnection.createDataChannel("chat");
    var ice;
    peerConnection.addEventListener('datachannel', event => {
        const dataChannel = event.channel;
        console.log(dataChannel)
    });
        

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        
        console.log(offer);
        socket.emit("send-offer", {"from": socket.id, "to": msg.from ,"sdp": offer})

        peerConnection.onicecandidate = async (event) => {
            if (event.candidate) {
                ice = event.candidate;
                console.log(ice)
                if(peerConnection.currentRemoteDescription){
                    socket.emit("send-ice", {"from": socket.id,"ice": ice})
                }
                
            }
        };

        

        // Enable textarea and button when opened
    dataChannel.addEventListener('open', event => {
        messageBox.disabled = false;
        messageBox.focus();
        sendButton.disabled = false;
    });

    // Disable input when closed
    dataChannel.addEventListener('close', event => {
        messageBox.disabled = false;
        sendButton.disabled = false;
    });
    

    sendButton.addEventListener('click', event => {
        
        const message = messageBox.value;
        dataChannel.send(message);
        console.log(message)
        incomingMessages.innerHTML += "You: " + message + '</br>';
        
        
        
        
    })

    dataChannel.addEventListener('message', event => {
        const message = event.data;
        incomingMessages.innerHTML += "Friend: " + message + '</br>';
        console.log(message)
    });
    
    socket.on("get-ice", async (msg) => {
        if (msg.from != socket.id){
            //await peerConnection.addIceCandidate(msg.ice);
           handleCandidateMessage(msg.ice, peerConnection)
        }
        
    });

    socket.on("get-answer", async (msg) => {
        if (msg.to == socket.id){
            peerConnection.addEventListener('connectionstatechange', event => {
                if (peerConnection.connectionState === 'connected') {
                    console.log('Bravo Gji u lidhe!')
                }
            });
    
            await peerConnection.setRemoteDescription(msg.sdp);
            
        }
        

    });

    onbeforeunload = (event) => {
        peerConnection.close()
    };

    }

    
    

    });

    socket.on("get-offer", async (msg) => {
       if (msg.to == socket.id) {
        var peerConnection;
        peerConnection = new RTCPeerConnection(configuration);
        peerConnection.addEventListener('datachannel', event => {
            const dataChannel = event.channel;
            console.log(dataChannel)

            dataChannel.addEventListener('open', event => {
                messageBox.disabled = false;
                messageBox.focus();
                sendButton.disabled = false;
            });
        
            // Disable input when closed
            dataChannel.addEventListener('close', event => {
                messageBox.disabled = false;
                sendButton.disabled = false;
            });
        
            sendButton.addEventListener('click', event => {
                const message = messageBox.value;
                dataChannel.send(message);
                incomingMessages.innerHTML += "You: " + message + '</br>';
                console.log(message)
            })
        
            dataChannel.addEventListener('message', event => {
                const message = event.data;
                incomingMessages.innerHTML += "Friend: " +message + '</br>';
                console.log(message)
            });
        });

        
        var ice;
       await peerConnection.setRemoteDescription(msg.sdp)
        
        
        const answer = await peerConnection.createAnswer()
        await peerConnection.setLocalDescription(answer)

        peerConnection.onicecandidate = async (event) => {
            if (event.candidate) {
                ice = event.candidate;
                console.log(ice)
                if(peerConnection.currentRemoteDescription){
                    socket.emit("send-ice", {"from": socket.id,"ice": ice})
                }
            }
        };
        
        socket.emit("send-answer", {"from": socket.id, "to": msg.from ,"sdp": answer})
       

        
        console.log(answer);
        
      socket.on("get-ice", async (msg) => {
        if (msg.from != socket.id){
            //await peerConnection.addIceCandidate(msg.ice);
            handleCandidateMessage(msg.ice, peerConnection)
        }
        
    });

    
    onbeforeunload = (event) => {
        peerConnection.close()
    };
    
    }
     
    
   

    });

    

    

   

    

    

    

    