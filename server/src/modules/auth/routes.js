import { Router } from "express";
import { z } from "zod";
import { asyncRoute, ok, HttpError } from "../../utils/http.js";
import { login, register, refresh } from "./service.js";
import { authenticate } from "../../middleware/auth.js";
import { AuditLog } from "../models.js";
const router = Router();
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(8).max(128) });
const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: z.literal("PATIENT").optional(),
  department: z.string().max(80).optional(),
});
function send(res, session, status = 200) {
  res.cookie("carepulse_refresh", session.refreshToken, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: "lax",
    path: "/api/v1/auth",
    maxAge: 7 * 86400_000,
  });
  return ok(res, { accessToken: session.accessToken, user: session.user }, status);
}
router.post(
  "/register",
  asyncRoute(async (req, res) => {
    const p = registerSchema.safeParse(req.body);
    if (!p.success) throw new HttpError(400, p.error.issues[0].message, "VALIDATION_ERROR");
    return send(res, await register(p.data), 201);
  }),
);
router.post(
  "/login",
  asyncRoute(async (req, res) => {
    const p = loginSchema.safeParse(req.body);
    if (!p.success)
      throw new HttpError(400, "Enter a valid email and password.", "VALIDATION_ERROR");
    const session = await login(p.data);
    await AuditLog.create({
      actorId: session.user.id,
      action: "auth.login",
      resource: "session",
      requestId: res.locals.requestId,
      ip: req.ip,
    });
    return send(res, session);
  }),
);
router.post(
  "/refresh",
  asyncRoute(async (req, res) => send(res, await refresh(req.cookies.carepulse_refresh))),
);
router.post("/logout", (req, res) => {
  res.clearCookie("carepulse_refresh", {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: "lax",
    path: "/api/v1/auth",
  });
  return ok(res, { loggedOut: true });
});
router.get("/me", authenticate, (req, res) =>
  ok(res, {
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      department: req.user.department,
    },
  }),
);
export default router;
