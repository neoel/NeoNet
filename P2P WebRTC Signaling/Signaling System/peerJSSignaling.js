const { Server } = require("socket.io")
const { createServer } = require("http");

const mysql = require('mysql2');



const host = 'localhost';
const port = 8000;

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'arioni1234',
  database : 'NeoNet'
});

function createRoom(roomNr){
  roomInsert = "INSERT INTO rooms(room_nr) VALUES(?);"
  connection.execute(roomInsert, [roomNr], function (error, results, fields) {
    if (error) throw error;
  });
}

function removeRoom(roomNr){
  roomDelete = "DELETE FROM rooms WHERE room_nr = ?;"
  connection.execute(roomDelete, [roomNr], function (error, results, fields) {
    if (error) throw error;
  });
}


function checkRoom(roomNr){
  if (roomNr == undefined || roomNr == "null"){
    return "wrong"
  }

  connection.connect();
  roomSelect = "select exists(select room_nr from rooms where room_nr = ?) as value;"
  connection.execute(roomSelect, [roomNr], function (error, results, fields) {

    console.log(results)
    if (error) throw error;
    if(results[0].value == "1"){
      console.log("Room Proof: " + results[0].value)
      return "exists"
    }else if(results[0].value == "0"){
      console.log("Room Proof: " + results[0].value)
      createRoom(roomNr)
      return "created"
    }
  });
}


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
    let check = checkRoom(msg.room)
    if (check == "wrong"){
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
  var roomClientCount = io.sockets.adapter.rooms.get(entry).size
  console.log(roomClientCount)
  if (roomClientCount - 1 == 0){
    removeRoom(entry)
  }
  io.to(entry).emit("user-left", {"id": socket.id})
 }
}
  });

  socket.on('disconnect', () => {
   
  });
});
