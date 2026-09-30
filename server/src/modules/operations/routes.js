import { Router } from "express";
import { z } from "zod";
import { Bed, User, Appointment, Bill, AuditLog, Claim } from "../models.js";
import { authenticate, allow } from "../../middleware/auth.js";
import { asyncRoute, ok, HttpError } from "../../utils/http.js";
export default function operationsRoutes(io) {
  const r = Router();
  r.use(authenticate, allow("ADMIN"));
  r.get(
    "/beds",
    asyncRoute(async (req, res) => {
      const items = await Bed.find().sort({ ward: 1, number: 1 }).populate("patientId", "name");
      await AuditLog.create({
        actorId: req.user._id,
        action: "bed.list.read",
        resource: "bed",
        requestId: res.locals.requestId,
        ip: req.ip,
      });
      return ok(res, { items });
    }),
  );
  r.post(
    "/beds",
    asyncRoute(async (req, res) => {
      const p = z
        .object({
          ward: z.string().min(1).max(80),
          number: z.string().min(1).max(20),
          type: z.string().default("General"),
        })
        .safeParse(req.body);
      if (!p.success) throw new HttpError(400, "Provide ward and bed number.", "VALIDATION_ERROR");
      return ok(res, { bed: await Bed.create(p.data) }, 201);
    }),
  );
  r.patch(
    "/beds/:id/status",
    asyncRoute(async (req, res) => {
      const p = z
        .object({
          status: z.enum(["AVAILABLE", "OCCUPIED", "MAINTENANCE"]),
          patientId: z.string().optional(),
        })
        .safeParse(req.body);
      if (!p.success) throw new HttpError(400, "Invalid bed status.", "VALIDATION_ERROR");
      const b = await Bed.findById(req.params.id);
      if (!b) throw new HttpError(404, "Bed not found.", "NOT_FOUND");
      if (p.data.status === "OCCUPIED" && !p.data.patientId)
        throw new HttpError(400, "Select a patient before occupying a bed.", "VALIDATION_ERROR");
      if (p.data.patientId && !(await User.exists({ _id: p.data.patientId, role: "PATIENT" })))
        throw new HttpError(400, "Choose an existing patient.", "VALIDATION_ERROR");
      if (
        (p.data.status === "OCCUPIED" && b.status !== "AVAILABLE") ||
        (p.data.status === "MAINTENANCE" && b.status !== "AVAILABLE") ||
        (p.data.status === "AVAILABLE" && !["OCCUPIED", "MAINTENANCE"].includes(b.status))
      )
        throw new HttpError(409, "This bed status changed. Refresh and try again.", "BED_CONFLICT");
      let updated;
      try {
        updated = await Bed.findOneAndUpdate(
          { _id: b._id, status: b.status },
          {
            $set: {
              status: p.data.status,
              patientId: p.data.status === "OCCUPIED" ? p.data.patientId : null,
              admittedAt: p.data.status === "OCCUPIED" ? new Date() : null,
            },
          },
          { new: true },
        );
      } catch (error) {
        if (error.code === 11000)
          throw new HttpError(
            409,
            "This patient already has an occupied bed.",
            "PATIENT_ALREADY_ADMITTED",
          );
        throw error;
      }
      if (!updated)
        throw new HttpError(
          409,
          "This bed was updated by another user. Refresh and try again.",
          "BED_CONFLICT",
        );
      await AuditLog.create({
        actorId: req.user._id,
        action: `bed.${p.data.status.toLowerCase()}`,
        resource: "bed",
        resourceId: updated.id,
        requestId: res.locals.requestId,
        ip: req.ip,
      });
      io.emit("bed:status-updated", {
        bedId: updated.id,
        status: updated.status,
        ward: updated.ward,
        number: updated.number,
      });
      return ok(res, { bed: updated });
    }),
  );
  r.get(
    "/audit",
    asyncRoute(async (req, res) => {
      const page = Math.max(1, +req.query.page || 1);
      const [items, total] = await Promise.all([
        AuditLog.find()
          .sort({ createdAt: -1 })
          .skip((page - 1) * 30)
          .limit(30)
          .populate("actorId", "name role"),
        AuditLog.countDocuments(),
      ]);
      return ok(res, { items, total, page });
    }),
  );
  r.get(
    "/analytics",
    asyncRoute(async (req, res) => {
      const today = new Date().toISOString().slice(0, 10),
        [patients, doctors, todayAppointments, completed, appointments, bedCounts, revenue, logs] =
          await Promise.all([
            User.countDocuments({ role: "PATIENT" }),
            User.countDocuments({ role: "DOCTOR" }),
            Appointment.countDocuments({ date: today }),
            Appointment.countDocuments({ status: "COMPLETED" }),
            Appointment.aggregate([
              {
                $match: {
                  date: { $gte: new Date(Date.now() - 6 * 86400_000).toISOString().slice(0, 10) },
                },
              },
              { $group: { _id: "$date", count: { $sum: 1 } } },
              { $sort: { _id: 1 } },
            ]),
            Bed.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
            Bill.aggregate([
              { $match: { status: "PAID" } },
              { $group: { _id: null, total: { $sum: "$total" } } },
            ]),
            AuditLog.find().sort({ createdAt: -1 }).limit(6).populate("actorId", "name"),
          ]);
      const beds = Object.fromEntries(bedCounts.map((x) => [x._id, x.count]));
      return ok(res, {
        patients,
        doctors,
        todayAppointments,
        completed,
        revenue: revenue[0]?.total || 0,
        beds,
        appointments,
        recentActivity: logs,
      });
    }),
  );
  r.get(
    "/users",
    asyncRoute(async (req, res) => {
      const items = await User.find({ role: req.query.role || { $in: ["DOCTOR", "PATIENT"] } })
        .select("name email role department specialty createdAt")
        .sort({ createdAt: -1 })
        .limit(100);
      await AuditLog.create({
        actorId: req.user._id,
        action: "user.directory.read",
        resource: "user",
        requestId: res.locals.requestId,
        ip: req.ip,
      });
      return ok(res, { items });
    }),
  );
  r.post(
    "/users/:id/doctors",
    asyncRoute(async (req, res) => {
      const p = z
        .object({ department: z.string().max(80), specialty: z.string().max(100).optional() })
        .safeParse(req.body);
      if (!p.success) throw new HttpError(400, "Enter valid department.", "VALIDATION_ERROR");
      const u = await User.findByIdAndUpdate(
        req.params.id,
        { role: "DOCTOR", ...p.data },
        { new: true },
      ).select("name email role department specialty");
      if (!u) throw new HttpError(404, "User not found.", "NOT_FOUND");
      return ok(res, { user: u });
    }),
  );
  r.get(
    "/claims",
    asyncRoute(async (req, res) =>
      ok(res, {
        items: await Claim.find()
          .sort({ createdAt: -1 })
          .populate("patientId", "name")
          .populate("billId", "total"),
      }),
    ),
  );
  return r;
}
