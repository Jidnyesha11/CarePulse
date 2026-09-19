import http from "node:http";
import {Server} from "socket.io";
import {createApp} from "./app.js";
import {connectDB} from "./config/db.js";
import {env} from "./config/env.js";
const app=createApp(),server=http.createServer(app);
const io=new Server(server,{cors:{origin:env.clientUrl,credentials:true}});
io.of("/appointments").on("connection",socket=>socket.on("doctor:watch",id=>id&&socket.join(`doctor:${id}`)));
app.set("io",io);await connectDB();server.listen(env.port,()=>console.log(`CarePulse API on http://localhost:${env.port}`));
