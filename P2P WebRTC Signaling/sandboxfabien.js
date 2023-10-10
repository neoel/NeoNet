const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }
    const peerConnection = new RTCPeerConnection(configuration);
    
    const messageBox = document.querySelector('#chattext');
    const sendButton = document.querySelector('#sendButton');
    const incomingMessages = document.querySelector('#chatbox');
    const offer = document.getElementById("offer");
    const offerLink = document.getElementById("offerLink");
    const answerLink = document.getElementById("answerLink");
    const answer = document.getElementById("answer");
    const connect = document.getElementById("connect");
    const connectButton = document.getElementById("connectButton");

   

    offer.onclick = async () => {
    const dataChannel = peerConnection.createDataChannel("chat");

    peerConnection.addEventListener('datachannel', event => {
        const dataChannel = event.channel;
        console.log(dataChannel)
    });
        peerConnection.onicecandidate = async (event) => {
            if (event.candidate) {
                offerLink.value = JSON.stringify(peerConnection.localDescription);
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

    answer.onclick = async () => {
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

        await peerConnection.setRemoteDescription(JSON.parse(answerLink.value))

        
        peerConnection.onicecandidate = (event) => {
            // console.log('onicecandidate', event)
            if (event.candidate) {
                answerLink.value = JSON.stringify(peerConnection.localDescription)
            }
        }

        const answer = await peerConnection.createAnswer()
        await peerConnection.setLocalDescription(answer)
        answerLink.value = JSON.stringify(answer)

        
   

    }

    connectButton.onclick = async () => {
        peerConnection.addEventListener('connectionstatechange', event => {
            if (peerConnection.connectionState === 'connected') {
                console.log('Bravo Gji u lidhe!')
            }
        });

        await peerConnection.setRemoteDescription(JSON.parse(connect.value));

    }

    