import express from "express"
import dotenv from "dotenv"
import authRouter from "./routes/auth.route.js"
import usersRouter from "./routes/users.route.js"
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./db/connectDB.js";

dotenv.config();
const PORT = process.env.PORT || 8081;

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  credentials: true,
  origin: ["https://whatsapp-fs-sockets.vercel.app","https://whatsapp-fs-sockets-mwwj.vercel.app"]
}));
 
app.use('/auth', authRouter);
app.use('/users', usersRouter);

app.get('/', (req, res) => {
  res.send('Congratulations HHLD Folks!');
});

app.listen(PORT, () => {
  connectDB();
  console.log(`Server is listening at http://localhost:${PORT}`);
});

