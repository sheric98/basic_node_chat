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

const PASSWORD = 'HELLO THERE!'

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
            && socket.username != null && (socket.username in names));
    }

    function addUser(name) {
        socket.username = name;
        users[socket.id] = socket;
        names[name] = [socket.id, false, false];
    }

    function removeUser() {
        delete users[socket.id];
        delete names[socket.username];
    }

    function getSocket(name) {
        var id = names[name][0];
        return users[id];
    }

    function sendMsg(msg) {
        io.emit('chat_message', '<b>' + socket.username + '</b>: ' + msg);
    }

    function sendDM(target, dm) {
        if (target === socket.username) {
            return false;
        }
        getSocket(target).emit('chat_message', '<b>' + socket.username + ' => you</b>: ' + dm);
        socket.emit('chat_message', '<b>you => ' + target + '</b>: ' + dm);
        return true;
    }

    function sendNotification(msg) {
        socket.emit('chat_message', '<b><i>' + msg + '</i></b>');
    }

    function sendAllNotification(msg) {
        io.emit('chat_message', '<b><i>' + msg + '</i></b>');
    }

    function sendAlert(msg) {
        socket.emit('alert', '<b><i>' + msg + '</i></b>');
    }

    function makeMod(target) {
        var id = names[target][0];
        names[target][1] = true;
        sendAllNotification(target + ' is now a mod!');
        io.emit('new_mod', id);
    }

    function alreadyMod(target) {
        sendNotification(target + ' is already a mod.');
    }

    function isMod() {
        if (socket.username in names) {
            return names[socket.username][1];
        }
        return false;
    }

    function noPriv() {
        sendNotification('You do not have the privileges to do that!');
    }

    function wrongPass() {
        sendNotification('Incorrect password!');
    }

    function sendKick(target) {
        getSocket(target).emit('kick', socket.username);
        sendAllNotification(target + ' has been kicked by ' + socket.username);
    }

    function isMuted() {
        return names[socket.username][2];
    }

    function alreadyMuted(target) {
        sendNotification(target + ' is already muted.');
    }

    function alreadyUnmuted(target) {
        sendNotification(target + ' is already unmuted.');
    }

    function sendMute(target) {
        var id = names[target][0];
        names[target][2] = true;
        io.emit('mute', id);
        sendAllNotification(target + ' has been muted by ' + socket.username);
    }

    function sendUnmute(target) {
        var id = names[target][0];
        names[target][2] = false;
        io.emit('unmute', id);
        sendAllNotification(target + ' has been unmuted by ' + socket.username);
    }

    socket.emit('new_conn', names);

    socket.on('username', function(username) {
        if ((typeof username !== "undefined") && (username != null)) {
            addUser(username);
            console.log('created username ' + username);
            io.emit('is_online', '<i>' + socket.username + ' has a big butt...</i>');
            io.emit('new_user', socket.username, socket.id);
        }
    });

    socket.on('disconnect', function(disconnect) {
        if (validSocket()) {
            removeUser();
            console.log('deleted ' + socket.username);
            io.emit('is_online', '<i>' + socket.username + ' has a small butt...</i>');
            io.emit('remove_user', socket.id);
        }
    });

    socket.on('chat_message', function(message) {
        if (!validSocket()) {
            socket.emit('no_name', '<b><i>Please refresh and enter a name to chat.</i></b>', names);
        }
        else if (isMuted()) {
            sendAlert('You are muted. No one can hear you.');
        }
        else{
            var checkDM = isCmdUsr(message, '@', true);
            var checkModPass = isCmdUsr(message, '/MOD ', true);
            var checkModMod = isCmdUsr(message, '/MOD ', false);
            var checkKick = isCmdUsr(message, '/KICK ', false);
            var checkMute = isCmdUsr(message, '/MUTE ', false);
            var checkUnmute = isCmdUsr(message, '/UNMUTE ', false);
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
                if (names[target][1]) {
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
                if (names[target][1]) {
                    alreadyMod(target);
                }
                else if (isMod()) {
                    makeMod(target);
                }
                else {
                    noPriv();
                }
            }
            else if (checkKick[0]) {
                var target = checkKick[1];
                if (isMod()) {
                    sendKick(target);
                }
                else {
                    noPriv();
                }
            }
            else if (checkMute[0]) {
                var target = checkMute[1];
                if (names[target][2]) {
                    alreadyMuted(target);
                }
                else if (isMod()) {
                    sendMute(target);
                }
                else {
                    noPriv();
                }
            }
            else if (checkUnmute[0]) {
                var target = checkUnmute[1];
                if (!names[target][2]) {
                    alreadyUnmuted(target);
                }
                else if (isMod()) {
                    sendUnmute(target);
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
