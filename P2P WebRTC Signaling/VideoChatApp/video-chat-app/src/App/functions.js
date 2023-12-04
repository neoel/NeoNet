export function handleCandidateMessage(candidate, pc) {
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


export function dataChannelListeners(dataChannel, incomingMessages, messageBox, sendButton, connections){
    dataChannel.addEventListener('message', event => {
        const message = event.data;
        incomingMessages.innerHTML += "Friend: " + message + '&#13;&#10;';
        console.log(message)
    });

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
}

export function sendButtonListeners(dataChannel, messageBox, incomingMessages){
    incomingMessages.innerHTML += "You: " + messageBox.value + '&#13;&#10;';
    dataChannel.forEach(element => {
    const message = messageBox.value;
    element.send(message);
    console.log(message) 
    });
     
}