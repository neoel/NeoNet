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
    else if (users.length >= 2 && users.length <= 5) {
      for (let index = 0; index < users.length - 1; index++) {
        io.to("room-1").emit("offer", { "from": socket.id, "to": users[index] })
    }

    }
    console.log("Users in room: " + users.length)
  });


  socket.on('send-offer', (msg) => {

    console.log(msg.pid);
    io.to("room-1").emit("get-offer", {
      "from": msg.from,
      "to": msg.to,
      "pid": msg.pid
    })
  });

  socket.on('send-answer', (msg) => {

    console.log(msg.pid);
    io.to("room-1").emit("get-answer", {
      "from": msg.from,
      "to": msg.to,
      "pid": msg.pid
    })
  });

  socket.on('disconnect', () => {
    const index = users.indexOf(socket.id);
    io.to("room-1").emit("user-left", {"id": socket.id})
    users.splice(index, 1);
    console.log(users)
    socket.leave("room-1");
    console.log("Remaining users: " + users.length)
  });
});
