import express from 'express'
import dotenv from 'dotenv'
import http from 'http'
import {Server} from 'socket.io'

dotenv.config();
const port = process.env.PORT || 5000;

const app = express();
const server = http.createServer(app);
const io = new Server(server);

io.on('connection', ()=>{
    console.log(`client connection established`)
})

app.get('/', (req,res)=>{
    res.send('Congo, HHLD folks!')
});

app.listen(port, ()=>{
    console.log(`Server is listening at http://localhost:${port}`)
});
