import "dotenv/config";
import http from "node:http";
import { connectDB } from "./config/db.js";
import { createApp } from "./app.js";
const port = Number(process.env.PORT) || 4000;
const server = http.createServer();
createApp(server);
connectDB()
  .then(() => server.listen(port, () => console.info(`CarePulse API listening on ${port}`)))
  .catch((error) => {
    console.error("Startup failed:", error.message);
    process.exit(1);
  });
