import { Router } from "express";
import { z } from "zod";
import { triage } from "./service.js";
import { authenticate, allow } from "../../middleware/auth.js";
import { asyncRoute, ok, HttpError } from "../../utils/http.js";
import { AuditLog } from "../models.js";
const r = Router();
r.post(
  "/",
  authenticate,
  allow("PATIENT"),
  asyncRoute(async (req, res) => {
    const p = z.object({ symptoms: z.string().trim().min(8).max(2000) }).safeParse(req.body);
    if (!p.success)
      throw new HttpError(
        400,
        "Describe symptoms using at least 8 characters.",
        "VALIDATION_ERROR",
      );
    const result = await triage(p.data.symptoms, req.user);
    await AuditLog.create({
      actorId: req.user._id,
      action: "triage.create",
      resource: "triage",
      resourceId: result.id,
      requestId: res.locals.requestId,
      ip: req.ip,
    });
    return ok(res, result, 201);
  }),
);
export default r;
