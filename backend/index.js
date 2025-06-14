dotenv.config();
import express from 'express'
import dotenv from 'dotenv'
import http from 'http'
import {Server} from 'socket.io'
import cors from 'cors'

const port = process.env.PORT || 5000;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        allowedHeaders: ['*'],
        origin: '*'
    }
});

app.use(cors());

io.on('connection', (socket)=>{
    console.log(`client connection established`, socket.id);
    socket.on('chat msg', (msg) => {
        socket.broadcast.emit('chat msg', msg);
        console.log(`Received message: ${msg}`);
    })
})

app.get('/', (_, res)=>{
    res.send('Welcome to HHLD Chat App!')
})

server.listen(port, ()=>{
    console.log(`Server is listening at http://localhost:${port}`)
});
