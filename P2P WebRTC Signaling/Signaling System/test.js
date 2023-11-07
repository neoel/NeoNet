const { Server } = require("socket.io");
const { createServer } = require("http");
 
const host = 'localhost';
const port = 8000;
 
const requestListener = function (req, res) {
    // This is where you might want to handle HTTP requests, currently it does nothing.
};
 
const server = createServer(requestListener);
 
server.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
});
 
const io = new Server(server, {
    cors: {
        origin: "http://127.0.0.1:5500",
        methods: ["GET", "POST"]
    }
});
 
var users = [];
 
io.on("connection", (socket) => {
    console.log("Client Connected: " + socket.id);
 
    socket.on('member-joined', () => {
        socket.join("room-1");
        users.push(socket.id);
 
        if (users.length == 1) {
            console.log("Do not start exchange!");
        } else if (users.length >= 2 && users.length <= 5){
            users.forEach(userId => {
                if (userId !== socket.id) {
                    io.to("room-1").emit("offer", {"from": socket.id});
                }
            });
        }
        console.log("Users in room: " + users.length);
    });
 
    socket.on('send-offer', (msg) => {
        console.log('Offer SDP: ' + msg.sdp);
        socket.to("room-1").emit("get-offer", msg);
    });
 
    socket.on('send-answer', (msg) => {
        console.log('Answer SDP: ' + msg.sdp);
        socket.to("room-1").emit("get-answer", msg);
    });
 
    socket.on('send-ice', (msg) => {
        console.log('ICE Candidate: ' + msg.candidate);
        socket.to("room-1").emit("get-ice-candidate", msg);
    });
 
    socket.on('member-left', () => {
        removeUser(socket.id);
    });
 
    socket.on('disconnect', () => {
        removeUser(socket.id);
    });
 
    function removeUser(id) {
        const index = users.indexOf(id);
        if (index !== -1) {
            users.splice(index, 1);
            socket.leave("room-1");
            console.log("User left: " + id + ". Remaining users: " + users.length);
        }
    }
});
 
// No need to call io.listen(8000) since we have already started server on port 8000.