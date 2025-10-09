import express from "express"
import { createProxyMiddleware } from "http-proxy-middleware"
import cors from 'cors'

const app = express()

app.use(cors({
   credentials: true,
   origin: [
     "http://localhost:3000",
     "http://localhost:3001",
     "http://localhost:3002",
     "https://whatsapp-fs-sockets.vercel.app",
     "https://whatsapp-fs-sockets-mwwj.vercel.app"
   ]
 }));

const routes = {
   	"/api/auth": process.env.AUTH_BACKEND_URL + "/auth",
   	"/api/users": process.env.AUTH_BACKEND_URL + "/users",
   	"/api/msgs": process.env.CHAT_BACKEND_URL + "/msgs"
};

for(const route in routes) {
   const target = routes[route];
   app.use(route, createProxyMiddleware({target, changeOrigin: true}));
}

const PORT = process.env.PORT || 8083;

app.listen(PORT, () => {
   console.log(`api gateway started listening on port : ${PORT}`)
})
