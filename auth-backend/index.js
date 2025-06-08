dotenv.config();
import express from 'express'
import dotenv from 'dotenv'
import authRouter from './routes/auth.route.js'
import connectDB from './db/connectDB.js';

const port = process.env.PORT || 5000;

const app = express();

await connectDB();

app.use(express.json());

app.use('/auth', authRouter);

app.get('/', (req, res)=>{
    res.send('Welcome to HHLD Chat App!')
})
app.listen(port, ()=>{
    console.log(`Server is listening at http://localhost:${port}`)
});
