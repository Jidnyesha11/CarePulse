import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import {env} from "./config/env.js";
import routes from "./routes/index.js";
import {notFound,errorHandler} from "./middleware/errors.js";
export function createApp(){
 const app=express();app.disable("x-powered-by");app.use(helmet());app.use(cors({origin:env.clientUrl,credentials:true}));app.use(express.json({limit:"2mb"}));app.use(cookieParser());app.use(morgan(env.nodeEnv==="production"?"combined":"dev"));
 app.get("/",(req,res)=>res.json({success:true,message:"CarePulse API"}));app.get("/api/v1/health",(req,res)=>res.json({success:true,data:{status:"healthy",timestamp:new Date().toISOString()}}));
 app.use("/api/v1",routes);app.use(notFound);app.use(errorHandler);return app;
}
