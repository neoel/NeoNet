# Socket.io Chat App

This is a simple chat application using Socket.io, Express, and HTTPS. The server is built using `server.js`, and the front-end is implemented in `index.html`. Users can connect to the server and exchange messages in real-time.

## Prerequisites

Before running the application, make sure you have the required dependencies installed:

- [Node.js](https://nodejs.org/)
- [npm](https://www.npmjs.com/)

## Getting Started

1. Clone the repository:

Navigate to the project directory:
cd your-repository

Install dependencies:
npm install

Generate SSL certificates for HTTPS (for development):
openssl req -nodes -new -x509 -keyout localhost.key -out localhost.crt -subj "/CN=localhost"

Run the server:
npm start

The server will be available at https://localhost:3000.

