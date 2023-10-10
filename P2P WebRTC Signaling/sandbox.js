var socket = io.connect(':8000');


const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, {
    urls: 'turn:openrelay.metered.ca:80',
    username: 'openrelayproject',
    credential: 'openrelayproject'
}] }
    const peerConnection = new RTCPeerConnection(configuration);
    
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
        console.log(msg)
    if (msg.to == socket.id){
        const dataChannel = peerConnection.createDataChannel("chat");
    var ice;
    peerConnection.addEventListener('datachannel', event => {
        const dataChannel = event.channel;
        console.log(dataChannel)
    });
        peerConnection.onicecandidate = async (event) => {
            if (event.candidate) {
                ice = event.candidate;
                socket.emit("send-offer", {"from": socket.id, "sdp": peerConnection.localDescription, "ice": ice})
            }
        };

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        console.log(offer);

        

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
        incomingMessages.innerHTML += "You: " + message + '</br>';
        console.log(message)
    })

    dataChannel.addEventListener('message', event => {
        const message = event.data;
        incomingMessages.innerHTML += "Friend: " + message + '</br>';
        console.log(message)
    });
    }
    

    });

    socket.on("get-offer", async (msg) => {
       if (msg.from != socket.id){
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

        await peerConnection.setRemoteDescription(msg.sdp)
        var ice;
        await peerConnection.addIceCandidate(msg.ice);

        peerConnection.onicecandidate = (event) => {
            // console.log('onicecandidate', event)
            if (event.candidate) {
                ice = event.candidate;
            }
        }

        const answer = await peerConnection.createAnswer()
        await peerConnection.setLocalDescription(answer)
        console.log(answer);
        socket.emit("send-answer", {"from": socket.id,"to": msg.from ,"sdp": answer, "ice": ice})
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
            await peerConnection.addIceCandidate(msg.ice);
        }
        

    });

    onbeforeunload = (event) => {
        socket.emit("member-left");
    };
    

    