import express from "express";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import msgsRouter from "./routes/msgs.route.js";
import connectDB from "./db/connectDB.js";
import { addMsgToConversation } from "./controllers/msgs.controller.js";
import { createSubscriber, publish } from "./redis/msgsPubSub.js";
import Valkey from "ioredis";

dotenv.config();

const serviceUri = process.env.SERVICE_URI;
const valkey = new Valkey(serviceUri);

const PORT = process.env.PORT || 8080;

const app = express();

app.use(
  cors({
    origin: [
      "https://whatsapp-fs-sockets.vercel.app",
      "https://whatsapp-fs-sockets-mwwj.vercel.app",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  })
);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    allowedHeaders: ["*"],
    origin: [
      "https://whatsapp-fs-sockets.vercel.app",
      "https://whatsapp-fs-sockets-mwwj.vercel.app",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const userSocketMap = {};

valkey.set("key", "hello world");
valkey.get("key").then((result) => {
  console.log(`Redis test key value: ${result}`);
});

io.on("connection", (socket) => {
  const username = (socket.handshake.query.username || "").toLowerCase().trim();
  if (!username) return;
  console.log(`🔗 User connected: ${username}`);

  userSocketMap[username] = socket.id;

  // Create a dedicated Redis subscriber for this user
  const subscriber = createSubscriber();
  const channelName = `chat_${username}`;

  subscriber.subscribe(channelName, (err) => {
    if (err) {
      console.error(`❌ Redis subscribe error for ${username}:`, err);
    } else {
      console.log(`✅ Subscribed to ${channelName}`);
    }
  });

  // Handle messages received from Redis
  subscriber.on("message", (subscribedChannel, message) => {
    if (subscribedChannel === channelName) {
      console.log(`📩 Redis delivered to ${username}: ${message}`);
      io.to(userSocketMap[username]).emit("chat msg", JSON.parse(message));
    }
  });

  // Handle chat messages coming from clients
  socket.on("chat msg", async (msg) => {
    console.log("💬 Received msg:", msg);

    const receiverSocketId = userSocketMap[msg.receiver];
    if (receiverSocketId) {
      console.log(`📡 Sending message directly to ${msg.receiver}`);
      io.to(receiverSocketId).emit("chat msg", msg);
    } else {
      console.log(`📤 Publishing to Redis channel for ${msg.receiver}`);
      const channel = `chat_${msg.receiver}`;
      await publish(channel, JSON.stringify(msg));
    }

    // Save the message in MongoDB
    addMsgToConversation([msg.sender, msg.receiver], {
      text: msg.text,
      sender: msg.sender,
      receiver: msg.receiver,
    });
  });

  socket.on("disconnect", () => {
    console.log(`❌ ${username} disconnected`);
    delete userSocketMap[username];
    subscriber.unsubscribe();
    subscriber.quit();
  });
});

app.use("/msgs", msgsRouter);

app.get("/", (req, res) => {
  res.send("✅ WhatsApp-FS Socket Server Running!");
});

server.listen(PORT, () => {
  connectDB();
  console.log(`🚀 Server is listening on port ${PORT}`);
});
