import { fileURLToPath } from 'url';
import { dirname } from 'path';
import express from 'express';
import https from 'https';
import fs from 'fs';
import { Server } from 'socket.io';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// for keys : openssl req -nodes -new -x509 -keyout localhost.key -out localhost.crt -subj "/CN=localhost"

const privateKey = fs.readFileSync(`${__dirname}/localhost.key`, 'utf8');
const certificate = fs.readFileSync(`${__dirname}/localhost.crt`, 'utf8');

const credentials = { key: privateKey, cert: certificate };

const app = express();
const server = https.createServer(credentials, app);
const io = new Server(server);

app.get('/', (req, res) => {
  res.sendFile(`${__dirname}/index.html`);
});

io.on('connection', (socket) => {
  console.log('A user connected');

  // Listen for chat messages
  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });

  // Listen for user disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server is listening on https://localhost:${port}`);
});
