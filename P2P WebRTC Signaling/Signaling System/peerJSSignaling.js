const { Server } = require("socket.io")
const { createServer } = require("http");

const host = 'localhost';
const port = 8000;



const requestListener = function (req, res) { };

const server = createServer(requestListener);
server.listen(port, host, () => {
  console.log(`Server is running on http://${host}:${port}`);
});

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000"
  }
});

io.on("connection", (socket) => {
  socket.on('member-joined', (msg) => {
    if (msg.room == undefined || msg.room == "null"){
      io.to(socket.id).emit("no-room")
    }else{
      socket.join(msg.room);
      console.log("Client Connected: " + socket.id + ", " + msg.room)
    var roomClientCount = io.sockets.adapter.rooms.get(msg.room).size
    console.log(roomClientCount)
    if (roomClientCount == 1) {
      console.log("Do not start exchange!")
    }
    else if (roomClientCount >= 2 && roomClientCount <= 5) {
      setTimeout(function() {
        io.to(msg.room).emit("offer", { "from": socket.id})
      }, 1000);
        
    }
    }
    
    
  });


  socket.on('send-offer', (msg) => {

    console.log(msg.pid);
    io.to(msg.room).emit("get-offer", {
      "from": msg.from,
      "to": msg.to,
      "pid": msg.pid,
      "publicKey": msg.publicKey
      
    })
  });

  socket.on('send-answer', (msg) => {

    console.log(msg.pid);
    io.to(msg.room).emit("get-answer", {
      "from": msg.from,
      "to": msg.to,
      "pid": msg.pid,
      "publicKey": msg.publicKey
    })
  });

  socket.on("disconnecting", () => {
  const roomIterator = socket.rooms.values();
for (const entry of roomIterator) {
 if(entry != socket.id){
  io.to(entry).emit("user-left", {"id": socket.id})
 }
}
  });

  socket.on('disconnect', () => {
   
  });
});
