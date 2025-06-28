import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import authRouter from './routes/auth.route.js';
import usersRouter from './routes/users.route.js';
import connectDB from './db/connectDB.js';
dotenv.config();

const port = process.env.PORT || 5000;

const app = express();

await connectDB();

app.use(express.json());
app.use(cors({
    credentials: true,
    origin: 'http://localhost:3000'
}));

app.use('/auth', authRouter);
app.use('/users', usersRouter);

app.get('/', (req, res)=>{
    res.send('Welcome to HHLD Chat App!')
})
app.listen(port, ()=>{
    console.log(`Server is listening at http://localhost:${port}`)
});
