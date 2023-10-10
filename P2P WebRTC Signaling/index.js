
const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }
let localStream;
let localScreenStream;
let remoteStream;
let remoteScreenStream;
let peerConnection = new RTCPeerConnection(configuration);
let peerConnection2 = new RTCPeerConnection(configuration);
const localWebcam = document.getElementById("localWebcam");
const localScreen = document.getElementById("localScreen");
const webcamButton = document.getElementById("webcamButton");
const screenButton = document.getElementById("screenButton");
const remoteWebcam = document.getElementById("remoteWebcam");
const remoteScreen = document.getElementById("remoteScreen");
const offer = document.getElementById("offer");
const offerLink = document.getElementById("offerLink");
const offerLink2 = document.getElementById("offerLink2");
const answerLink = document.getElementById("answerLink");
const answerLink2 = document.getElementById("answerLink2");
const answer = document.getElementById("answer");
const connect = document.getElementById("connect");
const connect2 = document.getElementById("connect2");
const connectButton = document.getElementById("connectButton");



screenButton.onclick = async () => {
    try {
        const constraints = {
            video: {
                cursor: 'always' | 'motion' | 'never',
                displaySurface: 'application' | 'browser' | 'monitor' | 'window'
            }
        };
        localScreenStream = await navigator.mediaDevices.getDisplayMedia(constraints);
        console.log('Got MediaStream:', localScreenStream);
        localScreen.srcObject = localScreenStream;
    } catch (error) {
        console.error('Error accessing media devices.', error);
    }
}


webcamButton.onclick = async function playVideoFromWebcam() {
    try {
        const constraints = {
            video: true,
            audio: true
        };
        localStream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log('Got MediaStream:', localStream);
        localWebcam.srcObject = localStream;
    } catch (error) {
        console.error('Error accessing media devices.', error);
    }
}

offer.onclick = async () => {

    remoteStream = new MediaStream();
    remoteScreenStream = new MediaStream();

    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
        
    });

    localScreenStream.getTracks().forEach(track => {
        peerConnection2.addTrack(track, localScreenStream);
        });

    peerConnection.addEventListener('track', async (event) => {
    const [remoteStream] = event.streams;
    console.log(remoteStream.getTracks());
    remoteWebcam.srcObject = remoteStream;
});

peerConnection2.addEventListener('track', async (event) => {
    const [remoteStream2] = event.streams;
    console.log(remoteStream2.getTracks());
    remoteScreen.srcObject = remoteStream2;
});



    peerConnection.onicecandidate = async (event) => {
    if (event.candidate) {
        offerLink.value = JSON.stringify(peerConnection.localDescription);
    }
};

peerConnection2.onicecandidate = async (event) => {
    if (event.candidate) {
        offerLink2.value = JSON.stringify(peerConnection2.localDescription);
    }
};
    
const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    console.log(offer);

    const offer2 = await peerConnection2.createOffer();
    await peerConnection2.setLocalDescription(offer2);
    console.log(offer2);
   
}

answer.onclick = async () => {
    remoteStream = new MediaStream();
    remoteScreenStream = new MediaStream();

    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
        
    });

    localScreenStream.getTracks().forEach(track => {
        peerConnection2.addTrack(track, localScreenStream);
        });

    peerConnection.addEventListener('track', async (event) => {
    const [remoteStream] = event.streams;
    console.log(remoteStream.getTracks());
    remoteWebcam.srcObject = remoteStream;
});

peerConnection2.addEventListener('track', async (event) => {
    const [remoteStream2] = event.streams;
    console.log(remoteStream2.getTracks());
    remoteScreen.srcObject = remoteStream2;
});

    
    await peerConnection.setRemoteDescription(JSON.parse(answerLink.value))
    await peerConnection2.setRemoteDescription(JSON.parse(answerLink2.value))
    
    peerConnection.onicecandidate = (event) => {
        // console.log('onicecandidate', event)
        if (event.candidate) {
          answerLink.value = JSON.stringify(peerConnection.localDescription)
        }
      }

      peerConnection2.onicecandidate = (event) => {
        // console.log('onicecandidate', event)
        if (event.candidate) {
          answerLink2.value = JSON.stringify(peerConnection2.localDescription)
        }
      }

      const answer = await peerConnection.createAnswer()
      await peerConnection.setLocalDescription(answer)
      answerLink.value = JSON.stringify(answer)

      const answer2 = await peerConnection2.createAnswer()
      await peerConnection2.setLocalDescription(answer2)
      answerLink2.value = JSON.stringify(answer2)

}

connectButton.onclick = async () => {
    peerConnection.addEventListener('connectionstatechange', event => {
        if (peerConnection.connectionState === 'connected') {
            console.log('Bravo Gji u lidhe!')
        }
    });

    peerConnection2.addEventListener('connectionstatechange', event => {
        if (peerConnection2.connectionState === 'connected') {
            console.log('Bravo Gji u lidhe me ekran!')
        }
    });
    
    
    await peerConnection.setRemoteDescription(JSON.parse(connect.value));
    await peerConnection2.setRemoteDescription(JSON.parse(connect2.value));

}