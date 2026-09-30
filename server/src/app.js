import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import { Server } from "socket.io";
import { z } from "zod";
import authRoutes from "./modules/auth/routes.js";
import appointmentRoutes from "./modules/appointments/routes.js";
import triageRoutes from "./modules/triage/routes.js";
import clinicalRoutes from "./modules/clinical/routes.js";
import operationsRoutes from "./modules/operations/routes.js";
import { requestContext, errorHandler, ok, asyncRoute, HttpError } from "./utils/http.js";
import { authenticate, allow } from "./middleware/auth.js";
import { Appointment, Bill, AuditLog } from "./modules/models.js";
export function createApp(httpServer) {
  const app = express();
  httpServer.on("request", app);
  const io = new Server(httpServer, {
    cors: {
      origin: (process.env.CLIENT_URL || "http://localhost:5173").split(","),
      credentials: true,
    },
  });
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) throw new Error();
      import("jsonwebtoken").then(({ default: jwt }) => {
        try {
          const p = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
          socket.data.userId = p.sub;
          socket.data.role = p.role;
          next();
        } catch {
          next(new Error("unauthorized"));
        }
      });
    } catch {
      next(new Error("unauthorized"));
    }
  });
  io.on("connection", (socket) => {
    socket.on("doctor:watch", (id) => {
      if (typeof id === "string" && id.length < 60) socket.join(`doctor:${id}`);
    });
  });
  app.set("io", io);
  app.disable("x-powered-by");
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(
    cors({
      origin: (process.env.CLIENT_URL || "http://localhost:5173").split(","),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "32kb" }));
  app.use(cookieParser());
  app.use(requestContext);
  app.get("/api/v1/health", (req, res) =>
    ok(res, {
      status: "ok",
      service: "carepulse-api",
      time: new Date().toISOString(),
    }),
  );
  app.use(
    "/api/v1/auth",
    rateLimit({
      windowMs: 15 * 60_000,
      limit: 50,
      standardHeaders: "draft-8",
      legacyHeaders: false,
    }),
    authRoutes,
  );
  app.use(
    "/api/v1/triage",
    rateLimit({
      windowMs: 60_000,
      limit: 8,
      standardHeaders: "draft-8",
      legacyHeaders: false,
    }),
    triageRoutes,
  );
  app.use("/api/v1/appointments", appointmentRoutes(io));
  app.use("/api/v1", clinicalRoutes());
  app.use("/api/v1/admin", operationsRoutes(io));
  app.post(
    "/api/v1/admin/bills/:appointmentId",
    authenticate,
    allow("ADMIN"),
    asyncRoute(async (req, res) => {
      const p = z
        .object({
          items: z
            .array(
              z.object({
                description: z.string().trim().min(2).max(200),
                amount: z.number().positive().max(10_000_000),
              }),
            )
            .min(1)
            .max(30)
            .optional(),
        })
        .safeParse(req.body);
      if (!p.success)
        throw new HttpError(400, "Provide valid bill line items.", "VALIDATION_ERROR");
      const appt = await Appointment.findById(req.params.appointmentId);
      if (!appt) throw new HttpError(404, "Appointment not found.", "NOT_FOUND");
      const items = p.data.items || [{ description: "Consultation", amount: 500 }],
        total = items.reduce((sum, item) => sum + item.amount, 0);
      let bill;
      try {
        bill = await Bill.findOneAndUpdate(
          { appointmentId: appt._id },
          {
            $setOnInsert: {
              patientId: appt.patientId,
              appointmentId: appt._id,
              items,
              total,
              currency: "INR",
              status: "UNPAID",
            },
          },
          { upsert: true, new: true },
        );
      } catch (error) {
        if (error.code === 11000) bill = await Bill.findOne({ appointmentId: appt._id });
        else throw error;
      }
      await AuditLog.create({
        actorId: req.user._id,
        action: "bill.create",
        resource: "bill",
        resourceId: bill.id,
        requestId: res.locals.requestId,
        ip: req.ip,
      });
      return ok(res, { bill }, 201);
    }),
  );
  app.patch(
    "/api/v1/admin/bills/:id/payment",
    authenticate,
    allow("ADMIN"),
    asyncRoute(async (req, res) => {
      const b = await Bill.findById(req.params.id);
      if (!b) throw new HttpError(404, "Bill not found.", "NOT_FOUND");
      if (req.body.status !== "PAID")
        throw new HttpError(
          400,
          "Only simulated payment confirmation is supported.",
          "VALIDATION_ERROR",
        );
      b.status = "PAID";
      b.paidAt = new Date();
      await b.save();
      await AuditLog.create({
        actorId: req.user._id,
        action: "bill.payment.simulated",
        resource: "bill",
        resourceId: b.id,
        requestId: res.locals.requestId,
        ip: req.ip,
      });
      return ok(res, { bill: b, simulation: true });
    }),
  );
  const openapi = {
    openapi: "3.0.3",
    info: {
      title: "CarePulse API",
      version: "1.0.0",
      description: "Role-protected hospital operations API.",
    },
    servers: [{ url: "/api/v1" }],
    paths: {
      "/health": {
        get: {
          summary: "Service health",
          responses: { 200: { description: "Healthy" } },
        },
      },
      "/auth/register": {
        post: {
          summary: "Register patient or doctor",
          responses: { 201: { description: "Created" } },
        },
      },
      "/auth/login": {
        post: {
          summary: "Sign in",
          responses: { 200: { description: "Signed in" } },
        },
      },
      "/triage": {
        post: {
          summary: "Patient symptom routing",
          responses: { 201: { description: "Structured triage suggestion" } },
        },
      },
      "/appointments": {
        get: {
          summary: "List appointments",
          responses: { 200: { description: "Appointment page" } },
        },
        post: {
          summary: "Book appointment",
          responses: {
            201: { description: "Booked" },
            409: { description: "Slot conflict" },
          },
        },
      },
    },
  };
  app.get("/api/v1/openapi.json", (req, res) => res.json(openapi));
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapi));
  app.use((req, res, next) =>
    next(new HttpError(404, "The requested endpoint was not found.", "NOT_FOUND")),
  );
  app.use(errorHandler);
  return app;
}
