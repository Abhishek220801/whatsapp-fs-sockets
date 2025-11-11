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

// CORS configuration
const allowedOrigins = [
  "https://whatsapp-fs-sockets.vercel.app",
  "https://whatsapp-fs-sockets-mwwj.vercel.app",
  "http://localhost:3000/", // Add for local testing
  "http://localhost:3001/",
  "http://localhost:3002/"
];

app.use("/",(req,res,next) =>{
  console.log(req.headers["origin"])
   if(!allowedOrigins.includes(req.headers["origin"])){
      return  
   }
   res.set({
    "Access-Control-Allow-Origin":req.headers["origin"]
   })
   next()
})

app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
  // Allow both polling and websocket transports
  transports: ['polling', 'websocket'],
  // Ping settings for keeping connection alive
  pingTimeout: 60000,
  pingInterval: 25000,
});

const userSocketMap = {};
const userSubscribers = new Map(); // Track subscribers properly

// Test Redis connection
valkey.set("key", "hello world");
valkey.get("key").then((result) => {
  console.log(`✅ Redis connected. Test value: ${result}`);
}).catch(err => {
  console.error("❌ Redis connection failed:", err);
});

io.on("connection", (socket) => {
  const username = (socket.handshake.query.username || "").toLowerCase().trim();
  
  if (!username) {
    console.log("⚠️ Connection attempt without username");
    socket.disconnect();
    return;
  }
  
  console.log(`🔗 User connected: ${username} (Socket: ${socket.id})`);
  userSocketMap[username] = socket.id;

  // Clean up any existing subscriber for this user
  if (userSubscribers.has(username)) {
    const oldSubscriber = userSubscribers.get(username);
    oldSubscriber.unsubscribe();
    oldSubscriber.quit();
  }

  // Create a dedicated Redis subscriber for this user
  const subscriber = createSubscriber();
  userSubscribers.set(username, subscriber);
  
  const channelName = `chat_${username}`;

  subscriber.subscribe(channelName, (err) => {
    if (err) {
      console.error(`❌ Redis subscribe error for ${username}:`, err);
    } else {
      console.log(`✅ ${username} subscribed to ${channelName}`);
    }
  });

  // Handle messages received from Redis (for offline users)
  subscriber.on("message", (subscribedChannel, message) => {
    if (subscribedChannel === channelName && userSocketMap[username]) {
      console.log(`📩 Redis message for ${username}: ${message}`);
      try {
        const parsedMsg = JSON.parse(message);
        io.to(userSocketMap[username]).emit("chat msg", parsedMsg);
      } catch (error) {
        console.error("Error parsing Redis message:", error);
      }
    }
  });

  subscriber.on("error", (err) => {
    console.error(`Redis subscriber error for ${username}:`, err);
  });

  // Handle chat messages from clients
  socket.on("chat msg", async (msg) => {
    console.log("💬 Received message:", msg);

    // Validate message
    if (!msg.text || !msg.sender || !msg.receiver) {
      console.error("Invalid message format:", msg);
      return;
    }

    // Add timestamp if not present
    msg.timestamp = msg.timestamp || new Date().toISOString();

    const receiverSocketId = userSocketMap[msg.receiver];
    
    if (receiverSocketId) {
      // User is online - send directly
      console.log(`📡 Sending directly to online user: ${msg.receiver}`);
      io.to(receiverSocketId).emit("chat msg", msg);
    } else {
      // User is offline - publish to Redis
      console.log(`📤 User ${msg.receiver} offline. Publishing to Redis`);
      const channel = `chat_${msg.receiver}`;
      await publish(channel, JSON.stringify(msg));
    }

    // Save to MongoDB
    try {
      await addMsgToConversation([msg.sender, msg.receiver], {
        text: msg.text,
        sender: msg.sender,
        receiver: msg.receiver,
        timestamp: msg.timestamp,
      });
    } catch (error) {
      console.error("Error saving message to DB:", error);
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`❌ ${username} disconnected`);
    delete userSocketMap[username];
    
    // Clean up subscriber
    if (userSubscribers.has(username)) {
      const subscriber = userSubscribers.get(username);
      subscriber.unsubscribe();
      subscriber.quit();
      userSubscribers.delete(username);
    }
  });

  // Handle errors
  socket.on("error", (error) => {
    console.error(`Socket error for ${username}:`, error);
  });
});

// Routes
app.use("/msgs", msgsRouter);

app.get("/", (req, res) => {
  res.json({ 
    status: "✅ WhatsApp-FS Socket Server Running!",
    socketConnections: Object.keys(userSocketMap).length,
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint for Render
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

server.listen(PORT, () => {
  connectDB();
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
});