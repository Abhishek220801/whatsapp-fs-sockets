import express from "express"
import dotenv from "dotenv"
import http from "http"
import { Server } from "socket.io";
import cors from "cors";
import msgsRouter from "./routes/msgs.route.js"
import connectDB from "./db/connectDB.js";
import { addMsgToConversation } from "./controllers/msgs.controller.js";
import Valkey from "ioredis";
import { subscribe, publish } from "./redis/msgsPubSub.js";
dotenv.config();

const serviceUri = process.env.SERVICE_URI
const valkey = new Valkey(serviceUri);

const PORT = process.env.PORT || 8080;

const app = express();

app.use(cors({
  origin: [ "https://whatsapp-fs-sockets.vercel.app", "https://whatsapp-fs-sockets-mwwj.vercel.app"],
  methods: ["GET", "POST"],
  credentials: true,
}));


const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        allowedHeaders: ["*"],
        origin: [
          "https://whatsapp-fs-sockets.vercel.app",
          "https://whatsapp-fs-sockets-mwwj.vercel.app"
        ],
        methods: ["GET", "POST"],
        credentials: true
      }
 });

const userSocketMap = {};

valkey.set("key", "hello world");

valkey.get("key").then(function (result) {
    console.log(`The value of key is: ${result}`);
});

io.on('connection', (socket) => {
    const username = (socket.handshake.query.username || "").toLowerCase().trim();
    console.log('Username of connected client:', username);

    userSocketMap[username] = socket.id;

  // subscribe user to Redis channel
  const channelName = `chat_${username}`
  subscribe(channelName, (msg) => {
    console.log(`Redis published message for ${username}: ${msg}`);
    io.to(userSocketMap[username]).emit("chat msg", JSON.parse(msg));
  });

    socket.on('chat msg', (msg) => {
        console.log("Received msg:", msg);

        const receiverSocketId = userSocketMap[msg.receiver];
        if (receiverSocketId) {
          // receiver is connected to this backend
          io.to(receiverSocketId).emit('chat msg', msg);
        } else {
          // receiver is connected to another backend, publish via Redis 
          const channelName = `chat_${msg.receiver}`       
          publish(channelName, JSON.stringify(msg));
        }
     
        // save to DB
        addMsgToConversation([msg.sender, msg.receiver], {
          text: msg.text,
          sender:msg.sender,
          receiver:msg.receiver
        })
    });

    socket.on("disconnect", () => {
      console.log(`${username} disconnected`);
      delete userSocketMap[username];
    });

})

app.use('/msgs', msgsRouter);

app.get('/', (req, res) => {
  res.send('Congratulations HHLD Folks!');
});

server.listen(PORT, () => {
  connectDB();
  console.log(`Server is listening at http://localhost:${PORT}`);
});






