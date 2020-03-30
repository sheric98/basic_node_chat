# basic_node_chat

This is a online chat server using Node.js and specifically Express and Socket.io.

Run with `node index.js` and the server is configured to run on port 4321.

If you are not running on localhost, change views/index.ejs line 19 to the desired url.

## Commands

`@[user] [message]` will privately message a specific user.

`/MOD [user] [Password]` will mod a specifc user if the correct password is inputted.

`/MOD [user]` will mod a specific user. Mod privileges required.

`/KICK [user]` will kick a specific user. Mod privileges required.

`/MUTE [user]` will prevent a user from sending messages. Mod privileges required.

`/UNMUTE [user]` will unmute a user if muted. Mode privileges required.
