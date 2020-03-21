const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.static('static'));

app.get('/', function(req, res) {
    res.render('index.ejs');
});

var users = new Object();

io.sockets.on('connection', function(socket) {
    function validSocket() {
        return (socket.hasOwnProperty('username') && (typeof socket.username !== "undefined")
            && socket.username != null);
    }
    socket.emit('display', users);
    socket.on('username', function(username) {
        if ((typeof username !== "undefined") && (username != null)) {
            socket.username = username;
            users[socket.id] = socket.username;
            io.emit('is_online', '<i>' + socket.username + ' has a big butt...</i>');
            io.emit('new_user', socket.username, socket.id);
        }
    });

    socket.on('disconnect', function(disconnect) {
        if (validSocket()) {
            delete users[socket.id];
            io.emit('is_online', '<i>' + socket.username + ' has a small butt...</i>');
            io.emit('remove_user', socket.id);
        }
    });

    socket.on('chat_message', function(message) {
        if (!validSocket()) {
            socket.emit('no_name', '<b><i>Please refresh and enter a name to chat.</i></b>');
        }
        else{
            io.emit('chat_message', '<b>' + socket.username + '</b>: ' + message);
        }
    });

    socket.on('start_typing', function() {
        if (validSocket()) {
            io.emit('add_typing', socket.id);
        }
    });

    socket.on('stop_typing', function() {
        if (validSocket()) {
            io.emit('remove_typing', socket.id);
        }
    });
});

const server = http.listen(4321, function() {
    console.log('listening on *:4321');
});
