const {Server} = require("socket.io")
const { createServer } = require("http");

const host = 'localhost';
const port = 8000;

const requestListener = function (req, res) {};

const server = createServer(requestListener);
server.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
});

const io = new Server(server, {
    cors: {
        origin: "http://127.0.0.1:5500"
      }
});
var rooms = []
var users = []
io.on("connection", (socket) => {
    
    
    socket.on('member-joined', (msg) => {
      socket.join("room-1");
    console.log("Client Connected: " + socket.id)
    
      users.push(socket.id)
      if (users.length == 1) {
        console.log("Do not start exchange!")
      }
      else if (users.length >= 2 && users.length <= 5){
        io.to("room-1").emit("offer", {"to": users[0]})
      }
      console.log("Users in room: " + users.length)
      });
    

    socket.on('send-offer', (msg) => {

        console.log('SDP: ' + msg.sdp);
        console.log('ICE: ' + msg.ice);
        io.to("room-1").emit("get-offer", {
        "from" : msg.from,
        "to": "all",
        "sdp": msg.sdp,
        "ice": msg.ice
        })
      });

    socket.on('send-answer', (msg) => {
        
        console.log('SDP: ' + msg.sdp);
        console.log('ICE: ' + msg.ice);
        io.to("room-1").emit("get-answer", {
        "from" : msg.from,
        "to": msg.to,
        "sdp": msg.sdp,
        "ice": msg.ice
        })
      });

    socket.on('member-left', () => {
        const index = users.indexOf(socket.id);
        
        users.splice(index, 1);
        socket.leave("room-1");
        console.log("Remaining users: " + users.length)
      });
});

io.listen(8000);