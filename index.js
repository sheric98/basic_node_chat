const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.static('static'));

app.get('/', function(req, res) {
    res.render('index.ejs');
});

io.sockets.on('connection', function(socket) {
    socket.on('username', function(username) {
        socket.username = username;
        io.emit('is_online', '<i>' + socket.username + ' has a big butt...</i>');
    });

    socket.on('disconnect', function(disconnect) {
        io.emit('is_online', '<i>' + socket.username + ' has a small butt...</i>');
    });

    socket.on('chat_message', function(message) {
        io.emit('chat_message', '<b>' + socket.username + '</b>: ' + message);
    });
});

const server = http.listen(4321, function() {
    console.log('listening on *:4321');
});
