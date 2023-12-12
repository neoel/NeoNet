import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import crypto from 'crypto';

// Create Express app, HTTP server, and Socket.IO instance
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Store user public keys
const userPublicKeys = {};

// Handle socket connections
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Generate public and private keys for the user
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });

  console.log(`User ${socket.id} - Public Key:`, publicKey);
  console.log(`User ${socket.id} - Private Key:`, privateKey);

  // Store user's public key
  userPublicKeys[socket.id] = publicKey;

  // Send the user their public key
  socket.emit('publicKey', publicKey);
  console.log(`User ${socket.id} - Sent public key to client`);

  // Broadcast user connection to others
  socket.broadcast.emit('chatMessage', {
    user: 'Server',
    text: `${socket.id} has joined the chat`,
  });

  // Listen for chat messages
  socket.on('chatMessage', (encryptedMessage) => {
    console.log(`User ${socket.id} - Received encrypted message:`, encryptedMessage);

    // Decrypt message using the user's private key
    const decryptedMessage = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      Buffer.from(encryptedMessage, 'base64')
    );

    console.log(`User ${socket.id} - Decrypted message:`, decryptedMessage.toString());

    // Broadcast the decrypted message to all users
    io.emit('chatMessage', {
      user: socket.id,
      text: decryptedMessage.toString(),
    });
  });

  // Handle user disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    delete userPublicKeys[socket.id];

    // Broadcast user disconnection to others
    socket.broadcast.emit('chatMessage', {
      user: 'Server',
      text: `${socket.id} has left the chat`,
    });
  });
});

// Set up server to listen on specified port and IP address
const PORT = process.env.PORT || 3000;
const IP_ADDRESS = '192.168.18.7';

server.listen(PORT, IP_ADDRESS, () => {
  console.log(`Server running at http://${IP_ADDRESS}:${PORT}`);
});
