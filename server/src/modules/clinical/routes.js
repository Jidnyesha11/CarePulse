import { Router } from "express";
import { randomBytes, createHmac } from "node:crypto";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { z } from "zod";
import {
  Appointment,
  MedicalRecord,
  Prescription,
  Bill,
  User,
  AuditLog,
  Claim,
} from "../models.js";
import { authenticate, allow } from "../../middleware/auth.js";
import { asyncRoute, ok, HttpError } from "../../utils/http.js";
export default function clinicalRoutes() {
  const r = Router();
  r.use(authenticate);
  r.get(
    "/doctor/analytics",
    allow("DOCTOR"),
    asyncRoute(async (req, res) => {
      const start = new Date(Date.now() - 6 * 86400_000).toISOString().slice(0, 10);
      const [total, completed, upcoming, byDay] = await Promise.all([
        Appointment.countDocuments({ doctorId: req.user._id }),
        Appointment.countDocuments({ doctorId: req.user._id, status: "COMPLETED" }),
        Appointment.countDocuments({
          doctorId: req.user._id,
          date: { $gte: new Date().toISOString().slice(0, 10) },
          status: { $in: ["SCHEDULED", "CONFIRMED"] },
        }),
        Appointment.aggregate([
          { $match: { doctorId: req.user._id, date: { $gte: start } } },
          { $group: { _id: "$date", count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ]),
      ]);
      return ok(res, { total, completed, upcoming, appointments: byDay });
    }),
  );
  r.get(
    "/records",
    asyncRoute(async (req, res) => {
      const f =
        req.user.role === "PATIENT"
          ? { patientId: req.user._id }
          : req.user.role === "DOCTOR"
            ? { doctorId: req.user._id }
            : {};
      const rows = await MedicalRecord.find(f)
        .sort({ createdAt: -1 })
        .limit(100)
        .populate("patientId", "name")
        .populate("doctorId", "name");
      await AuditLog.create({
        actorId: req.user._id,
        action: "record.list.read",
        resource: "medical-record",
        requestId: res.locals.requestId,
        ip: req.ip,
      });
      return ok(res, { items: rows });
    }),
  );
  r.post(
    "/records/:appointmentId",
    allow("DOCTOR"),
    asyncRoute(async (req, res) => {
      const p = z
        .object({
          symptoms: z.array(z.string().max(200)).max(20).default([]),
          diagnosis: z.string().trim().min(1).max(500),
          notes: z.string().max(5000).default(""),
        })
        .safeParse(req.body);
      if (!p.success)
        throw new HttpError(
          400,
          "Provide a diagnosis and valid clinical notes.",
          "VALIDATION_ERROR",
        );
      const appt = await Appointment.findOne({
        _id: req.params.appointmentId,
        doctorId: req.user._id,
      });
      if (!appt) throw new HttpError(404, "Assigned appointment not found.", "NOT_FOUND");
      let doc = await MedicalRecord.findOne({ appointmentId: appt._id });
      if (doc) Object.assign(doc, p.data);
      else
        doc = await MedicalRecord.create({
          ...p.data,
          patientId: appt.patientId,
          doctorId: req.user._id,
          appointmentId: appt._id,
        });
      appt.status = "COMPLETED";
      await appt.save();
      await AuditLog.create({
        actorId: req.user._id,
        action: "record.create",
        resource: "medical-record",
        resourceId: doc.id,
        requestId: res.locals.requestId,
        ip: req.ip,
      });
      return ok(res, { record: doc }, 201);
    }),
  );
  r.get(
    "/prescriptions",
    asyncRoute(async (req, res) => {
      const f =
        req.user.role === "PATIENT"
          ? { patientId: req.user._id }
          : req.user.role === "DOCTOR"
            ? { doctorId: req.user._id }
            : {};
      const items = await Prescription.find(f)
        .sort({ issuedAt: -1 })
        .limit(100)
        .populate("patientId", "name")
        .populate("doctorId", "name");
      await AuditLog.create({
        actorId: req.user._id,
        action: "prescription.list.read",
        resource: "prescription",
        requestId: res.locals.requestId,
        ip: req.ip,
      });
      return ok(res, { items });
    }),
  );
  r.post(
    "/prescriptions",
    allow("DOCTOR"),
    asyncRoute(async (req, res) => {
      const p = z
        .object({
          recordId: z.string(),
          items: z
            .array(
              z.object({
                medicine: z.string().min(1),
                dosage: z.string().min(1),
                frequency: z.string().min(1),
                duration: z.string().min(1),
              }),
            )
            .min(1)
            .max(20),
          instructions: z.string().max(2000).default(""),
        })
        .safeParse(req.body);
      if (!p.success)
        throw new HttpError(400, "Add at least one complete medication item.", "VALIDATION_ERROR");
      const record = await MedicalRecord.findOne({ _id: p.data.recordId, doctorId: req.user._id });
      if (!record) throw new HttpError(404, "Medical record not found.", "NOT_FOUND");
      const prescription = await Prescription.create({
        patientId: record.patientId,
        doctorId: req.user._id,
        appointmentId: record.appointmentId,
        recordId: record._id,
        items: p.data.items,
        instructions: p.data.instructions,
        verifyCode: randomBytes(16).toString("hex"),
      });
      await AuditLog.create({
        actorId: req.user._id,
        action: "prescription.issue",
        resource: "prescription",
        resourceId: prescription.id,
        requestId: res.locals.requestId,
        ip: req.ip,
      });
      return ok(
        res,
        {
          prescription,
          verifyUrl: `${process.env.PUBLIC_API_URL || `http://localhost:${process.env.PORT || 4000}`}/api/v1/prescriptions/verify/${prescription.verifyCode}`,
        },
        201,
      );
    }),
  );
  r.get(
    "/prescriptions/verify/:code",
    asyncRoute(async (req, res) => {
      const p = await Prescription.findOne({ verifyCode: req.params.code })
        .select("verifyCode issuedAt doctorId")
        .populate("doctorId", "name department");
      if (!p) throw new HttpError(404, "Prescription not found or invalid.", "NOT_FOUND");
      await AuditLog.create({
        action: "prescription.verify.public",
        resource: "prescription-verification",
        resourceId: p.id,
        requestId: res.locals.requestId,
        ip: req.ip,
      });
      return ok(res, {
        valid: true,
        verifyCode: p.verifyCode,
        issuedAt: p.issuedAt,
        doctor: p.doctorId,
      });
    }),
  );
  r.get(
    "/prescriptions/:id/pdf",
    asyncRoute(async (req, res) => {
      const f =
        req.user.role === "PATIENT"
          ? { patientId: req.user._id }
          : req.user.role === "DOCTOR"
            ? { doctorId: req.user._id }
            : {};
      const p = await Prescription.findOne({ _id: req.params.id, ...f })
        .populate("patientId", "name")
        .populate("doctorId", "name department");
      if (!p) throw new HttpError(404, "Prescription not found.", "NOT_FOUND");
      await AuditLog.create({
        actorId: req.user._id,
        action: "prescription.pdf.download",
        resource: "prescription",
        resourceId: p.id,
        requestId: res.locals.requestId,
        ip: req.ip,
      });
      const qr = await QRCode.toDataURL(
        `${process.env.PUBLIC_API_URL || `http://localhost:${process.env.PORT || 4000}`}/api/v1/prescriptions/verify/${p.verifyCode}`,
      );
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="carepulse-prescription-${p.id}.pdf"`,
      );
      const pdf = new PDFDocument({ margin: 52 });
      pdf.pipe(res);
      pdf.fontSize(23).fillColor("#153d3a").text("CarePulse", 52, 50);
      pdf.fontSize(11).fillColor("#52636a").text("DIGITAL PRESCRIPTION", 52, 83);
      pdf
        .moveDown(2)
        .fillColor("#142a30")
        .fontSize(12)
        .text(`Patient: ${p.patientId.name}`)
        .text(
          `Prescriber: ${p.doctorId.name}${p.doctorId.department ? ` · ${p.doctorId.department}` : ""}`,
        )
        .text(`Issued: ${p.issuedAt.toLocaleDateString()}`)
        .moveDown();
      pdf.fontSize(15).text("Medication");
      p.items.forEach((m, i) =>
        pdf
          .moveDown(0.4)
          .fontSize(11)
          .text(`${i + 1}. ${m.medicine} — ${m.dosage}, ${m.frequency}, ${m.duration}`),
      );
      if (p.instructions) pdf.moveDown().text(`Instructions: ${p.instructions}`);
      pdf.image(qr, 420, 665, { width: 100 });
      pdf
        .fontSize(8)
        .fillColor("#667")
        .text(`Verification code: ${p.verifyCode}`, 52, 758, { width: 330 });
      pdf.end();
    }),
  );
  r.get(
    "/doctors",
    asyncRoute(async (req, res) => {
      const filter = { role: "DOCTOR" };
      if (req.query.department)
        filter.department = new RegExp(
          String(req.query.department).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          "i",
        );
      if (req.query.search)
        filter.name = new RegExp(
          String(req.query.search)
            .slice(0, 60)
            .replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          "i",
        );
      const items = await User.find(filter).select("name department specialty").limit(100);
      return ok(res, { items });
    }),
  );
  r.get(
    "/patients",
    allow("DOCTOR", "ADMIN"),
    asyncRoute(async (req, res) => {
      const filter = { role: "PATIENT" };
      if (req.user.role === "DOCTOR") {
        const ids = await Appointment.distinct("patientId", { doctorId: req.user._id });
        filter._id = { $in: ids };
      }
      if (req.query.search)
        filter.name = new RegExp(
          String(req.query.search)
            .slice(0, 60)
            .replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          "i",
        );
      const items = await User.find(filter).select("name email phone").limit(100);
      await AuditLog.create({
        actorId: req.user._id,
        action: "patient.list.read",
        resource: "patient",
        requestId: res.locals.requestId,
        ip: req.ip,
      });
      return ok(res, { items });
    }),
  );
  r.get(
    "/bills",
    asyncRoute(async (req, res) => {
      if (req.user.role === "DOCTOR")
        throw new HttpError(
          403,
          "You do not have permission to view billing records.",
          "FORBIDDEN",
        );
      const f = req.user.role === "PATIENT" ? { patientId: req.user._id } : {};
      const items = await Bill.find(f)
        .sort({ createdAt: -1 })
        .limit(100)
        .populate("patientId", "name");
      await AuditLog.create({
        actorId: req.user._id,
        action: "bill.list.read",
        resource: "bill",
        requestId: res.locals.requestId,
        ip: req.ip,
      });
      return ok(res, { items });
    }),
  );
  r.get(
    "/claims",
    asyncRoute(async (req, res) => {
      if (req.user.role === "DOCTOR")
        throw new HttpError(
          403,
          "You do not have permission to view insurance claims.",
          "FORBIDDEN",
        );
      const f = req.user.role === "PATIENT" ? { patientId: req.user._id } : {};
      const items = await Claim.find(f).sort({ createdAt: -1 }).populate("billId", "total status");
      await AuditLog.create({
        actorId: req.user._id,
        action: "insurance-claim.list.read",
        resource: "claim",
        requestId: res.locals.requestId,
        ip: req.ip,
      });
      return ok(res, { items });
    }),
  );
  r.post(
    "/claims",
    allow("PATIENT"),
    asyncRoute(async (req, res) => {
      const p = z
        .object({
          billId: z.string().regex(/^[0-9a-f]{24}$/i),
          provider: z.string().trim().min(2).max(100),
          policyNumber: z.string().trim().min(3).max(100),
        })
        .safeParse(req.body);
      if (!p.success)
        throw new HttpError(
          400,
          "Provide insurance provider, policy number, and bill.",
          "VALIDATION_ERROR",
        );
      const bill = await Bill.findOne({ _id: p.data.billId, patientId: req.user._id });
      if (!bill) throw new HttpError(404, "Bill not found.", "NOT_FOUND");
      const policy = p.data.policyNumber.trim();
      const policyHash = createHmac("sha256", process.env.JWT_ACCESS_SECRET)
        .update(policy.toLowerCase())
        .digest("hex");
      const claim = await Claim.create({
        billId: bill._id,
        provider: p.data.provider,
        patientId: req.user._id,
        policyHash,
        policyLast4: policy.slice(-4),
      });
      await AuditLog.create({
        actorId: req.user._id,
        action: "insurance-claim.submit",
        resource: "claim",
        resourceId: claim.id,
        requestId: res.locals.requestId,
        ip: req.ip,
      });
      return ok(
        res,
        {
          claim: {
            id: claim.id,
            status: claim.status,
            provider: claim.provider,
            policyLast4: claim.policyLast4,
            createdAt: claim.createdAt,
          },
        },
        201,
      );
    }),
  );
  return r;
}
