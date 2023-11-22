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

sendButton.addEventListener("click", e => {
    incomingMessages.innerHTML += "You: " + messageBox.value + '&#13;&#10;';
})


socket.on("offer", async (msg) => {
    if (msg.to == socket.id) {
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



        // Enable textarea and button when opened
        dataChannel.addEventListener('open', event => {
            messageBox.disabled = false;
            messageBox.focus();
            sendButton.disabled = false;
        });

        // Disable input when closed
        dataChannel.addEventListener('close', event => {
            messageBox.disabled = true;
            sendButton.disabled = true;
            
            if (connections.size > 0) {
                messageBox.disabled = false;
                sendButton.disabled = false;
            }

        });

       
        sendButton.addEventListener('click', event => {

            const message = messageBox.value;
            dataChannel.send(message);
            console.log(message)
            
})

        dataChannel.addEventListener('message', event => {
            const message = event.data;
            incomingMessages.innerHTML += "Friend: " + message + '&#13;&#10;';
            console.log(message)
        });




    }




});


socket.on("get-ice", async (msg) => {
    if (msg.to == socket.id) {
        var peerConnection = connections.get(msg.from)
        //await peerConnection.addIceCandidate(msg.ice);
        handleCandidateMessage(msg.ice, peerConnection)
    }



});

socket.on("get-answer", async (msg) => {
    if (msg.to == socket.id) {
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
    if (msg.to == socket.id) {
        connections.set(msg.from, new RTCPeerConnection(configuration));
        var peerConnection;
        peerConnection = connections.get(msg.from)
        await peerConnection.setRemoteDescription(msg.sdp)
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
                messageBox.disabled = true;
                sendButton.disabled = true;

                if (connections.size > 0) {
                    messageBox.disabled = false;
                    sendButton.disabled = false;
                }



            });

            sendButton.addEventListener('click', event => {
                const message = messageBox.value;
                dataChannel.send(message);
                console.log(message)
            })

            dataChannel.addEventListener('message', event => {
                const message = event.data;
                incomingMessages.innerHTML += "Friend: " + message + '&#13;&#10;';
                console.log(message)
            });
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
});











