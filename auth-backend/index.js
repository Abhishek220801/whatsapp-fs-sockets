import express from "express"
import dotenv from "dotenv"
import authRouter from "./routes/auth.route.js"
import usersRouter from "./routes/users.route.js"
import cors from "cors"
import cookieParser from "cookie-parser"
import connectDB from "./db/connectDB.js"

dotenv.config()
const PORT = process.env.PORT || 8081

const allowedOrigins = [
  "https://whatsapp-fs-sockets.vercel.app",
  "https://whatsapp-fs-sockets-mwwj.vercel.app",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
]

const app = express()

app.use(express.json())
app.use(cookieParser())

app.use("/", (req, res, next) => {
  const origin = req.headers["origin"]
  console.log({origin})
  if (!allowedOrigins.includes(origin)) return
  cors({
    origin,
    credentials: true,
  })(req,res,next);
})

app.use("/auth", authRouter)
app.use("/users", usersRouter)

app.get("/", (req, res) => {
  res.send("Auth Backend is up and spinning")
})

app.listen(PORT, () => {
  connectDB()
  console.log(`Server is listening at http://localhost:${PORT}`)
})
