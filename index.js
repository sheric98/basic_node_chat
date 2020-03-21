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
var mods = new Object();

const PASSWORD = 'HELLO THERE!'

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

function isCmdUsr(msg, cmd, hasMsg) {
    if (msg.length > cmd.length) {
        if (msg.substring(0, cmd.length) === cmd) {
            var rest = msg.substring(cmd.length, msg.length);
            var target = null;
            var msg = null;
            if (!hasMsg) {
                target = rest;
            }
            else if (rest.indexOf(' ') > 0) {
                var space = rest.indexOf(' ');
                if (rest.length > space + 1) {
                    target = rest.substring(0, space);
                    msg = rest.substring(space + 1, rest.length);
                }
            }
            if (target != null) {
                if (target in names) {
                    return [true, target, msg];
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

    function sendMsg(msg) {
        io.emit('chat_message', '<b>' + socket.username + '</b>: ' + msg);
    }

    function sendDM(target, dm) {
        if (target === socket.username) {
            return false;
        }
        var target_id = names[target];
        users[target_id].emit('chat_message', '<b>' + socket.username + ' => you</b>: ' + dm);
        socket.emit('chat_message', '<b>you => ' + target + '</b>: ' + dm);
        return true;
    }

    function sendNotification(msg) {
        socket.emit('chat_message', '<b><i>' + msg + '</i></b>');
    }

    function makeMod(target) {
        var id = names[target];
        mods[target] = id;
        users[id].emit('chat_message', '<b><i>You are now a mod!</i></b>');
        io.emit('new_mod', id);
    }

    function alreadyMod(target) {
        sendNotification(target + ' is already a mod.');
    }

    function noPriv() {
        sendNotification('You do not have the privileges to do that!');
    }

    function wrongPass() {
        sendNotification('Incorrect password!');
    }

    function sendKick(target) {
        var id = names[target];
        mods[target] = id;
        users[id].emit('kick', socket.username);
        sendNotification(target + ' has been kicked.');
    }

    socket.emit('new_conn', names, mods);

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
            delete mods[socket.username];
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
            var checkDM = isCmdUsr(message, '@', true);
            var checkModPass = isCmdUsr(message, '/MOD ', true);
            var checkModMod = isCmdUsr(message, '/MOD ', false);
            var checkKick = isCmdUsr(message, '/KICK ', false);
            if (checkDM[0]) {
                var target = checkDM[1];
                var dm = checkDM[2];
                if (!sendDM(target, dm)) {
                    sendMsg(message);
                }
            }
            else if (checkModPass[0]) {
                var target = checkModPass[1];
                var pass = checkModPass[2];
                if (target in mods) {
                    alreadyMod(target);
                }
                else if (pass === PASSWORD) {
                    makeMod(target);
                }
                else {
                    wrongPass();
                }
            }
            else if (checkModMod[0]) {
                var target = checkModMod[1];
                if (target in mods) {
                    alreadyMod(target);
                }
                else if (socket.username in mods) {
                    makeMod(target);
                }
                else {
                    noPriv();
                }
            }
            else if (checkKick[0]) {
                var target = checkKick[1];
                if (socket.username in mods) {
                    sendKick(target);
                }
                else {
                    noPriv();
                }
            }
            else {
                sendMsg(message);
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
