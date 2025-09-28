import express from "express"
import dotenv from "dotenv"
import http from "http"
import { Server } from "socket.io";
import cors from "cors";
import msgsRouter from "./routes/msgs.route.js"
import connectDB from "./db/connectDB.js";
import { addMsgToConversation } from "./controllers/msgs.controller.js";
import Valkey from "ioredis";0
import { subscribe, publish } from "./redis/msgsPubSub.js";
dotenv.config();

const serviceUri = process.env.SERVICE_URI
const valkey = new Valkey(serviceUri);

const PORT = process.env.PORT || 8080;

const app = express();

app.use(cors({
  credentials: true,
  origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"]
}));


const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        allowedHeaders: ["*"],
        origin: "*"
      }
 });

const userSocketMap = {};

valkey.set("key", "hello world");

valkey.get("key").then(function (result) {
    console.log(`The value of key is: ${result}`);
    valkey.disconnect();
});

io.on('connection', (socket) => {
    const username = (socket.handshake.query.username || "").toLowerCase().trim();
    console.log('Username of connected client:', username);

    userSocketMap[username] = socket;

  const channelName = `chat_${username}`
  subscribe(channelName, (msg) => {
    socket.emit("chat msg", JSON.parse(msg));
  });

    socket.on('chat msg', (msg) => {
        console.log(msg.sender);
        console.log(msg.receiver);
        console.log(msg.text);
        console.log(msg);
        const receiverSocket = userSocketMap[msg.receiver];
        if (receiverSocket) {
          receiverSocket.emit('chat msg', msg);
        } else {
          const channelName = `chat_${msg.receiver}`
          publish(channelName, JSON.stringify(msg));
        }
     
        addMsgToConversation([msg.sender, msg.receiver], {
          text: msg.text,
          sender:msg.sender,
          receiver:msg.receiver
        })
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






