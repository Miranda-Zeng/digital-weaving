'use strict';

const socketIO = require('socket.io');
const express = require('express');
const path = require('path');
const app = module.exports.app = express();
const port = process.env.PORT || 3000;

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, '/index.html'));
});

app.use(express.static(path.join(__dirname, 'public')));

const server = app.listen(port, () => {
  console.log("Listening on port: " + port);
});

const io = socketIO(server);

let currentRow = 0;
let weavingHistory = [];

io.on('connection', (socket) => {
  console.log('Client connected');
  console.log(socket.id);
  // send the history to new client
  socket.emit("weavingHistory", weavingHistory);
  // receive weaving pattern
  socket.on("weave",function(pattern){
    if (!/^[01]{15}$/.test(pattern)) {
      return;
    }
    const data = {pattern:pattern, row:currentRow}
    weavingHistory.push(data);
    io.emit("weaveResponse",data);
    currentRow++;
  })
  socket.on('disconnect', () => console.log('Client disconnected'));
});

