import { Router } from "express";
import { z } from "zod";
import { Appointment, User, AuditLog } from "../models.js";
import { authenticate, allow } from "../../middleware/auth.js";
import { asyncRoute, ok, HttpError } from "../../utils/http.js";
import { predictNoShowRisk } from "./risk.js";
export default function appointmentRoutes(io) {
  const r = Router();
  r.use(authenticate);
  r.get(
    "/",
    asyncRoute(async (req, res) => {
      const filter =
        req.user.role === "PATIENT"
          ? { patientId: req.user._id }
          : req.user.role === "DOCTOR"
            ? { doctorId: req.user._id }
            : {};
      if (req.query.status) filter.status = req.query.status;
      const page = Math.max(1, +req.query.page || 1),
        limit = Math.min(100, +req.query.limit || 20);
      const [items, total] = await Promise.all([
        Appointment.find(filter)
          .sort({ date: 1, timeSlot: 1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .populate("patientId", "name email")
          .populate("doctorId", "name department specialty"),
        Appointment.countDocuments(filter),
      ]);
      await AuditLog.create({
        actorId: req.user._id,
        action: "appointment.list.read",
        resource: "appointment",
        requestId: res.locals.requestId,
        ip: req.ip,
      });
      return ok(res, { items, total, page, limit });
    }),
  );
  r.get(
    "/availability/:doctorId",
    allow("PATIENT", "DOCTOR", "ADMIN"),
    asyncRoute(async (req, res) => {
      const d = await User.findOne({ _id: req.params.doctorId, role: "DOCTOR" }).select(
        "name department specialty",
      );
      if (!d) throw new HttpError(404, "Doctor not found.", "NOT_FOUND");
      const date = String(req.query.date || new Date().toISOString().slice(0, 10));
      const busy = await Appointment.find({
        doctorId: d._id,
        date,
        status: { $ne: "CANCELLED" },
      }).select("timeSlot");
      const taken = new Set(busy.map((x) => x.timeSlot));
      const all = [
        "09:00",
        "09:30",
        "10:00",
        "10:30",
        "11:00",
        "11:30",
        "13:00",
        "13:30",
        "14:00",
        "14:30",
        "15:00",
        "15:30",
        "16:00",
      ];
      return ok(res, {
        doctor: d,
        date,
        slots: all.map((time) => ({ time, available: !taken.has(time) })),
      });
    }),
  );
  r.post(
    "/",
    allow("PATIENT"),
    asyncRoute(async (req, res) => {
      const s = z
        .object({
          doctorId: z.string().regex(/^[0-9a-f]{24}$/i),
          date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          timeSlot: z.string().regex(/^\d{2}:\d{2}$/),
          department: z.string().max(80).optional(),
          reason: z.string().max(500).optional(),
          triageId: z.string().optional(),
        })
        .safeParse(req.body);
      if (!s.success)
        throw new HttpError(400, "Provide a valid doctor, date and time slot.", "VALIDATION_ERROR");
      const slotDate = new Date(`${s.data.date}T${s.data.timeSlot}:00+05:30`);
      if (Number.isNaN(slotDate.getTime()) || slotDate <= new Date())
        throw new HttpError(400, "Choose a future appointment time.", "INVALID_DATE");
      const doctor = await User.findOne({ _id: s.data.doctorId, role: "DOCTOR" });
      if (!doctor) throw new HttpError(404, "Doctor not found.", "NOT_FOUND");
      try {
        const risk = await predictNoShowRisk(req.user._id, s.data.date, s.data.timeSlot);
        const appt = await Appointment.create({
          ...s.data,
          patientId: req.user._id,
          status: "CONFIRMED",
          createdBy: req.user._id,
          risk,
        });
        await AuditLog.create({
          actorId: req.user._id,
          action: "appointment.create",
          resource: "appointment",
          resourceId: appt.id,
          requestId: res.locals.requestId,
          ip: req.ip,
        });
        io.to(`doctor:${doctor.id}`).emit("slot:booked", {
          doctorId: doctor.id,
          date: appt.date,
          timeSlot: appt.timeSlot,
        });
        io.to(`doctor:${doctor.id}`).emit("appointment:created", {
          appointmentId: appt.id,
          date: appt.date,
          timeSlot: appt.timeSlot,
        });
        return ok(res, { appointment: appt }, 201);
      } catch (e) {
        if (e.code === 11000)
          throw new HttpError(
            409,
            "This appointment slot has just been booked. Choose another time.",
            "SLOT_TAKEN",
          );
        throw e;
      }
    }),
  );
  r.patch(
    "/:id/cancel",
    asyncRoute(async (req, res) => {
      const appt = await Appointment.findById(req.params.id);
      if (!appt) throw new HttpError(404, "Appointment not found.", "NOT_FOUND");
      if (
        (req.user.role === "PATIENT" && String(appt.patientId) !== String(req.user._id)) ||
        (req.user.role === "DOCTOR" && String(appt.doctorId) !== String(req.user._id))
      )
        throw new HttpError(403, "You cannot change this appointment.", "FORBIDDEN");
      if (!["SCHEDULED", "CONFIRMED"].includes(appt.status))
        throw new HttpError(409, "This appointment can no longer be cancelled.", "INVALID_STATUS");
      appt.status = "CANCELLED";
      await appt.save();
      io.to(`doctor:${appt.doctorId}`).emit("slot:released", {
        doctorId: String(appt.doctorId),
        date: appt.date,
        timeSlot: appt.timeSlot,
      });
      await AuditLog.create({
        actorId: req.user._id,
        action: "appointment.cancel",
        resource: "appointment",
        resourceId: appt.id,
        requestId: res.locals.requestId,
        ip: req.ip,
      });
      return ok(res, { appointment: appt });
    }),
  );
  r.patch(
    "/:id/reschedule",
    allow("PATIENT"),
    asyncRoute(async (req, res) => {
      const p = z
        .object({
          date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
          timeSlot: z.string().regex(/^\d{2}:\d{2}$/),
        })
        .safeParse(req.body);
      if (!p.success) throw new HttpError(400, "Choose a valid date and time.", "VALIDATION_ERROR");
      if (
        Number.isNaN(new Date(`${p.data.date}T${p.data.timeSlot}:00+05:30`).getTime()) ||
        new Date(`${p.data.date}T${p.data.timeSlot}:00+05:30`) <= new Date()
      )
        throw new HttpError(400, "Choose a future appointment time.", "INVALID_DATE");
      const appt = await Appointment.findOne({ _id: req.params.id, patientId: req.user._id });
      if (!appt) throw new HttpError(404, "Appointment not found.", "NOT_FOUND");
      if (!["SCHEDULED", "CONFIRMED"].includes(appt.status))
        throw new HttpError(
          409,
          "This appointment can no longer be rescheduled.",
          "INVALID_STATUS",
        );
      const old = { doctorId: String(appt.doctorId), date: appt.date, timeSlot: appt.timeSlot };
      appt.date = p.data.date;
      appt.timeSlot = p.data.timeSlot;
      try {
        await appt.save();
      } catch (e) {
        if (e.code === 11000)
          throw new HttpError(
            409,
            "This appointment slot has just been booked. Choose another time.",
            "SLOT_TAKEN",
          );
        throw e;
      }
      io.to(`doctor:${old.doctorId}`).emit("slot:released", old);
      io.to(`doctor:${old.doctorId}`).emit("slot:booked", {
        doctorId: old.doctorId,
        date: appt.date,
        timeSlot: appt.timeSlot,
      });
      io.to(`doctor:${old.doctorId}`).emit("appointment:rescheduled", {
        appointmentId: appt.id,
        old,
        date: appt.date,
        timeSlot: appt.timeSlot,
      });
      await AuditLog.create({
        actorId: req.user._id,
        action: "appointment.reschedule",
        resource: "appointment",
        resourceId: appt.id,
        requestId: res.locals.requestId,
        ip: req.ip,
      });
      return ok(res, { appointment: appt });
    }),
  );
  r.patch(
    "/:id/status",
    allow("DOCTOR", "ADMIN"),
    asyncRoute(async (req, res) => {
      const p = z
        .enum(["IN_PROGRESS", "COMPLETED", "NO_SHOW", "CONFIRMED"])
        .safeParse(req.body.status);
      if (!p.success) throw new HttpError(400, "Invalid appointment status.", "VALIDATION_ERROR");
      const appt = await Appointment.findById(req.params.id);
      if (!appt) throw new HttpError(404, "Appointment not found.", "NOT_FOUND");
      if (req.user.role === "DOCTOR" && String(appt.doctorId) !== String(req.user._id))
        throw new HttpError(403, "You cannot update this appointment.", "FORBIDDEN");
      appt.status = p.data;
      await appt.save();
      await AuditLog.create({
        actorId: req.user._id,
        action: "appointment.status.update",
        resource: "appointment",
        resourceId: appt.id,
        requestId: res.locals.requestId,
        ip: req.ip,
      });
      return ok(res, { appointment: appt });
    }),
  );
  return r;
}
