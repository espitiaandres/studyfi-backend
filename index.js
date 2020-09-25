const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const cors = require('cors');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./users');
const PORT = process.env.PORT || 5000;
const router = require('./router');
const app = express();
const server = http.createServer(app);
const io = socketio(server);
const moment = require('moment');
const momenttz = require('moment-timezone');

let tzOuterScope = "";

app.use(router);
app.use(cors({credentials: true, origin: true}));
app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    // Access to XMLHttpRequest at 'https://react-chat-app-back-end.herokuapp.com/socket.io/?EIO=3&transport=polling&t=NIKToPF&sid=y816dlf1JzozlBL5AAAD' from origin 'http://localhost:3000' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
    next();
});

app.get('/', (req, res) => {
    request(
        { url: 'https://react-chat-app-back-end.herokuapp.com/' },
        (error, response, body) => {
            console.log(error, response, body);
        }
    )
});

io.on('connection', (socket) => {
    socket.on('join', ({ name, room, tz }, callback) => {
        const { error, user } = addUser({ id: socket.id, name, room });


        tz = tz.includes("minus") ? tz.replace("minus", "-") : tz.replace("plus", "+");
        tz = "Etc/" + tz;
        tz = tz.includes("-") ? tz.replace("-", "+") : tz.replace("+", "-");

        tzOuterScope = tz;

        if (error) {
            socket.emit('duplicate', { duplicate: true });
            return callback(error);
        } else {
            socket.emit('duplicate', { duplicate: false });
        }

        socket.emit('duplicate', { duplicate: false });
        socket.emit('message', { user: "admin", text: `${user.name}, welcome to the ${user.room} chat room! :D`, currentTime: momenttz().tz(tz).format("MMM DD h:mm a").toString() + " UTC" });
        socket.broadcast.to(user.room).emit('message', { user: 'admin', text: `${user.name} has joined! :)`, currentTime: momenttz().tz(tz).format("MMM DD h:mm a").toString() + " UTC" });
        socket.join(user.room);
        io.to(user.room).emit('roomData', { room: user.room , users: getUsersInRoom(user.room)})
        callback();
    });

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id);
        io.to(user.room).emit('message', { user: user.name, text: message, currentTime: momenttz().tz(tzOuterScope).format("MMM DD h:mm a").toString() + " UTC" });
        io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room)});
        callback();
    });

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);
        if (user) {
            io.to(user.room).emit('message', { user: 'admin', text: `${user.name} has left. :(`, currentTime: momenttz().tz(tzOuterScope).format("MMM DD h:mm a").toString() + " UTC" }, { users: getUsersInRoom(user.room) })
        }
    })
})

server.listen(PORT, () => console.log(`Server has started on port ${PORT}`));
