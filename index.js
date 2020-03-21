const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.static('static'));

app.get('/', function(req, res) {
    res.render('index.ejs');
});

var users = new Object();
var names = new Object();

function isDM(msg) {
    if (msg[0] == '@') {
        if (msg.indexOf(' ') > 1) {
            var space = msg.indexOf(' ');
            var target = msg.substring(1, space);
            if (msg.length > space + 1) {
                if (target in names) {
                    var dm = msg.substring(space + 1, msg.length);
                    return [true, target, dm];
                }
            }
        }
    }
    return [false, null, null];
}

io.sockets.on('connection', function(socket) {
    function validSocket() {
        return (socket.hasOwnProperty('username') && (typeof socket.username !== "undefined")
            && socket.username != null);
    }

    socket.emit('new_conn', names);

    socket.on('username', function(username) {
        if ((typeof username !== "undefined") && (username != null)) {
            socket.username = username;
            users[socket.id] = socket;
            names[socket.username] = socket.id;
            console.log('created username ' + username);
            io.emit('is_online', '<i>' + socket.username + ' has a big butt...</i>');
            io.emit('new_user', socket.username, socket.id);
        }
    });

    socket.on('disconnect', function(disconnect) {
        if (validSocket()) {
            delete users[socket.id];
            delete names[socket.username];
            console.log('deleted ' + socket.username);
            io.emit('is_online', '<i>' + socket.username + ' has a small butt...</i>');
            io.emit('remove_user', socket.id);
        }
    });

    socket.on('chat_message', function(message) {
        if (!validSocket()) {
            socket.emit('no_name', '<b><i>Please refresh and enter a name to chat.</i></b>', names);
        }
        else{
            var checkDM = isDM(message);
            if (checkDM[0]) {
                var target = checkDM[1];
                var DM = checkDM[2];
                var target_id = names[target];
                users[target_id].emit('chat_message', '<b>' + socket.username + ' => you</b>: ' + DM);
                socket.emit('chat_message', '<b>you => ' + socket.username + '</b>: ' + DM);
            }
            else {
                io.emit('chat_message', '<b>' + socket.username + '</b>: ' + message);
            }
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
