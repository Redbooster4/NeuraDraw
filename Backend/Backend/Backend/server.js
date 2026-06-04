require("dotenv").config();
const app = require("./src/app.js");
const http = require("http");
const {Server} = require("socket.io");
const connectDB = require("./src/db/db.js");
const drawingSocket = require("./src/sockets/drawingSocket.js");
const cors = require("cors");

connectDB();

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",//"http://localhost:3000",
        methods: ["GET", "POST"]
    }
});
drawingSocket(io);

const PORT = process.env.PORT;
server.listen(PORT, () => {
    console.log(`Server running on Port ${PORT}`);
});

