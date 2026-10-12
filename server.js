// ==========================================
// PROXISPEAK BACKEND
// ==========================================

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();

app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});


// ==========================================
// USERS
// ==========================================

const users = {};


// ==========================================
// SPAWN POSITIONS
// ==========================================

const spawnPositions = [
    { x: 100, y: 100 },
    { x: 500, y: 100 },
    { x: 800, y: 100 },
    { x: 200, y: 300 },
    { x: 600, y: 300 },
    { x: 900, y: 300 }
];


// ==========================================
// HOME ROUTE
// ==========================================

app.get("/", (req, res) => {

    res.send(
        "ProxiSpeak Backend is Running 🚀"
    );

});


// ==========================================
// SOCKET CONNECTION
// ==========================================

io.on("connection", (socket) => {

    console.log(
        "User connected:",
        socket.id
    );


    // ======================================
    // JOIN OFFICE
    // ======================================

    socket.on("joinOffice", (data) => {

        // Number of users already inside

        const userCount =
            Object.keys(users).length;


        // Select different spawn position

        const spawn =
            spawnPositions[
                userCount %
                spawnPositions.length
            ];


        // Create user

        users[socket.id] = {

            socketId: socket.id,

            username: data.username,

            x: spawn.x,

            y: spawn.y

        };


        console.log(
            `${data.username} joined the office`
        );


        console.log(
            "Starting position:",
            spawn.x,
            spawn.y
        );


        // Send existing users
        // to newly joined user

        socket.emit(
            "existingUsers",

            Object.values(users).filter(
                (user) =>
                    user.socketId !== socket.id
            )
        );


        // Tell other users
        // that a new employee joined

        socket.broadcast.emit(
            "userJoined",
            users[socket.id]
        );

    });


    // ======================================
    // UPDATE POSITION
    // ======================================

    socket.on(
        "updatePosition",
        (position) => {

            if (!users[socket.id]) {

                return;

            }


            users[socket.id].x =
                position.x;


            users[socket.id].y =
                position.y;


            // Send new position
            // to other employees

            socket.broadcast.emit(
                "userMoved",
                {

                    socketId:
                        socket.id,

                    x:
                        position.x,

                    y:
                        position.y

                }
            );

        }
    );


    // ======================================
    // SPEAKING STATUS
    // ======================================

    socket.on(
        "speaking",
        (isSpeaking) => {

            console.log(
                "Speaking status:",
                socket.id,
                isSpeaking
            );


            socket.broadcast.emit(
                "userSpeaking",
                {

                    socketId:
                        socket.id,

                    speaking:
                        isSpeaking

                }
            );

        }
    );


    // ======================================
    // WEBRTC OFFER
    // ======================================

    socket.on(
        "webrtcOffer",
        (data) => {

            console.log(
                "WebRTC offer received from:",
                socket.id
            );


            io.to(data.target).emit(
                "webrtcOffer",
                {

                    offer:
                        data.offer,

                    sender:
                        socket.id

                }
            );

        }
    );


    // ======================================
    // WEBRTC ANSWER
    // ======================================

    socket.on(
        "webrtcAnswer",
        (data) => {

            console.log(
                "WebRTC answer received from:",
                socket.id
            );


            io.to(data.target).emit(
                "webrtcAnswer",
                {

                    answer:
                        data.answer,

                    sender:
                        socket.id

                }
            );

        }
    );


    // ======================================
    // ICE CANDIDATE
    // ======================================

    socket.on(
        "iceCandidate",
        (data) => {

            console.log(
                "ICE candidate received from:",
                socket.id
            );


            io.to(data.target).emit(
                "iceCandidate",
                {

                    candidate:
                        data.candidate,

                    sender:
                        socket.id

                }
            );

        }
    );


    // ======================================
    // DISCONNECT
    // ======================================

    socket.on(
        "disconnect",
        () => {

            console.log(
                "User disconnected:",
                socket.id
            );


            // Remove user

            delete users[socket.id];


            // Stop speaking indicator

            socket.broadcast.emit(
                "userSpeaking",
                {

                    socketId:
                        socket.id,

                    speaking:
                        false

                }
            );


            // Tell other employees

            socket.broadcast.emit(
                "userLeft",
                socket.id
            );

        }
    );

});


// ==========================================
// START SERVER
// ==========================================

const PORT = 5000;

server.listen(
    PORT,
    () => {

        console.log(
            `ProxiSpeak Backend running on port ${PORT}`
        );

    }
);