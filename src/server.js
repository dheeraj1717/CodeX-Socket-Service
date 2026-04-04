const express = require("express");
const { createServer} = require("http");
const { default: Redis } = require("ioredis");
const { Server } = require("socket.io");

const app = express();
const httpServer = createServer(app);

const redisCache = new Redis();
const io = new Server(httpServer, {
cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
}
});

io.on("connection", (socket) => {
    console.log("a user connected " + socket.id);
    socket.on("setUserId", (userId) => {
        redisCache.set(userId, socket.id);
    });
    socket.on("getConnectionId", (userId) => {
        redisCache.get(userId).then((connectionId) => {
            socket.emit("connectionId", connectionId);
        });
    });
    socket.on("disconnect", () => {
        console.log("user disconnected " + socket.id);
    });
});

app.post('/sendPayload', async (req, res)=>{
    const {userId, payload} = req.body;
    if(!userId || !payload){
        return res.status(400).send("Invalid request");
    }
    const connectionId = await redisCache.get(userId);
    if(!connectionId){
        return res.status(404).send("User not found");
    }
    io.to(connectionId).emit("submissionPayloadResponse", payload);
    res.send("Payload sent successfully");
})

httpServer.listen(4005, () => {
    console.log("listening on :4005");
});