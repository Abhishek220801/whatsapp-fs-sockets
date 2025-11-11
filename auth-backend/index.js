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
  "http://localhost:3000/",
  "http://localhost:3001/",
  "http://localhost:3002",
]

const app = express()

app.use(express.json())
app.use(cookieParser())

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

 
// app.use('/',
//   cors({
//     credentials: true,
//     origin: function(origin, callback){
//       // Allow requests with no origin (like mobile apps or curl)
//       if(!origin) return callback(null, true);
//       if(allowedOrigins.includes(origin)){
//         console.log(req.headers);
//         callback(null, true);
//       } else {
//         callback(new Error("Not allowed by CORS"));
//       }
//     },
//   })
// );

// app.options('*', cors({
//   credentials: true,
//   origin: function (origin, callback) {
//     if (!origin) return callback(null, true);
//     if (allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error("Not allowed by CORS"));
//     }
//   }
// }));

// app.use((req, res, next) => {
//   res.header('Vary', 'Origin');
//   next();
// })

app.use("/auth", authRouter)
app.use("/users", usersRouter)

app.get("/", (req, res) => {
  res.send("Auth Backend is up and spinning")
})

app.listen(PORT, () => {
  connectDB()
  console.log(`Server is listening at http://localhost:${PORT}`)
})
