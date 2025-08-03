import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'

const app = express();

const routes = {
    '/api/auth': 'http://localhost:8081',
    '/api/users': 'http://localhost:8081',
    '/api/msgs': 'http://localhost:8080',
}

for(const route in routes){
    const target = routes[route];
    app.use(route, createProxyMiddleware({target, changeOrigin: true}));
}