dotenv.config();
import express from 'express'
import dotenv from 'dotenv'
import http from 'http'
import {Server} from 'socket.io'
import cors from 'cors'
import connectDB from './db/connectDB.js';
import { addMsgToConversation } from './controllers/msg.controller.js';
import msgsRouter from './routes/msgs.route.js'

const port = 8080;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        allowedHeaders: ['*'],
        origin: '*'
    }
});

app.use(cors());

const userSocketMap = {};

io.on('connection', (socket)=>{
    // console.log(`client connection established`, socket.id);

    const username = socket.handshake.query.username;
    console.log('Username of connected client:', username);

    userSocketMap[username] = socket; //mapping to the usernames with their socket id in socket map

    socket.on('chat msg', (msg) => {
        console.log('Received message:', msg);
        // socket.broadcast.emit('chat msg', msg); // ✅ send to all others
        const receiverSocket = userSocketMap[msg.receiver];
        if(receiverSocket){
            receiverSocket.emit('chat msg', msg); //private messaging
        }
        addMsgToConversation([msg.sender, msg.receiver], {
            text: msg.text,
            sender: msg.sender,
            receiver: msg.receiver
        })
    })
})

app.use('/msgs', msgsRouter);

app.get('/', (_, res)=>{
    res.send('Welcome to HHLD Chat App!')
})

server.listen(port, async ()=>{
    await connectDB();
    console.log(`Server is listening at http://localhost:${port}`)
});
