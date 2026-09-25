import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import morgan from "morgan";

import { env } from "./config/env.js";
import routes from "./routes/index.js";

export function createApp() {
  const app = express();

  // Security
  app.use(helmet());

  app.use(
    cors({
      origin: env.clientUrl,
      credentials: true,
    })
  );

  // Body parsing
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.use(cookieParser());

  // Logging
  app.use(morgan("dev"));

  // Basic health endpoints
  app.get("/", (req, res) => {
    res.status(200).json({
      success: true,
      service: "CarePulse API",
      message: "CarePulse backend is running",
    });
  });

  app.get("/health", (req, res) => {
    res.status(200).json({
      status: "ok",
      service: "CarePulse API",
      timestamp: new Date().toISOString(),
    });
  });

  // All application routes
  app.use("/api/v1", routes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
  });

  // Error handler
  app.use((err, req, res, next) => {
    console.error("API ERROR:", err);

    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Internal server error",
    });
  });

  return app;
}