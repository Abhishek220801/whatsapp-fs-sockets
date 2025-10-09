import express from "express"
import { createProxyMiddleware } from "http-proxy-middleware"

const app = express()

const routes = {
   	"/api/auth": process.env.AUTH_BACKEND_URL + "/auth",
   	"/api/users": process.env.AUTH_BACKEND_URL + "/users",
   	"/api/msgs": CHAT_BACKEND_URL + "/msgs"
};

for(const route in routes) {
   const target = routes[route];
   app.use(route, createProxyMiddleware({target, changeOrigin: true}));
}

const PORT = process.env.PORT || 8083;

app.listen(PORT, () => {
   console.log(`api gateway started listening on port : ${PORT}`)
})
