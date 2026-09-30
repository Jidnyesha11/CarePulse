import "dotenv/config";
import bcrypt from "bcryptjs";
import { connectDB } from "./config/db.js";
import { User, Appointment, Bed, MedicalRecord, Bill, Prescription } from "./modules/models.js";
await connectDB();
const pass = await bcrypt.hash("CarePulseDemo26!", 12);
const users = [];
for (const d of [
  { name: "Maya Chen", email: "admin@carepulse.demo", role: "ADMIN" },
  {
    name: "Amara Okafor",
    email: "doctor@carepulse.demo",
    role: "DOCTOR",
    department: "Cardiology",
    specialty: "Cardiologist",
  },
  {
    name: "Noah Williams",
    email: "doctor2@carepulse.demo",
    role: "DOCTOR",
    department: "General Medicine",
    specialty: "Internal Medicine",
  },
  { name: "Olivia Martin", email: "patient@carepulse.demo", role: "PATIENT" },
  { name: "Ethan Park", email: "patient2@carepulse.demo", role: "PATIENT" },
])
  users.push(
    await User.findOneAndUpdate(
      { email: d.email },
      { $set: { ...d, password: pass } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ),
  );
const [admin, doc1, doc2, p1, p2] = users;
const day = new Date();
day.setDate(day.getDate() + 1);
const date = day.toISOString().slice(0, 10);
const a = await Appointment.findOneAndUpdate(
  { doctorId: doc1._id, date, timeSlot: "10:00" },
  {
    $setOnInsert: {
      patientId: p1._id,
      department: "Cardiology",
      status: "CONFIRMED",
      reason: "Follow-up consultation",
    },
  },
  { upsert: true, new: true },
);
await Appointment.findOneAndUpdate(
  { doctorId: doc2._id, date, timeSlot: "11:30" },
  {
    $setOnInsert: {
      patientId: p2._id,
      department: "General Medicine",
      status: "CONFIRMED",
      reason: "Annual review",
    },
  },
  { upsert: true, new: true },
);
let record = await MedicalRecord.findOne({ appointmentId: a._id });
if (!record)
  record = await MedicalRecord.create({
    patientId: p1._id,
    doctorId: doc1._id,
    appointmentId: a._id,
    symptoms: ["Follow-up"],
    diagnosis: "Follow-up review",
    notes: "Demo seed record for walkthrough.",
  });
if (!(await Bill.exists({ appointmentId: a._id })))
  await Bill.create({
    patientId: p1._id,
    appointmentId: a._id,
    items: [{ description: "Consultation", amount: 800 }],
    total: 800,
    currency: "INR",
    status: "UNPAID",
  });
if (!(await Bed.exists({ ward: "North", number: "N-01" })))
  await Bed.create({ ward: "North", number: "N-01", type: "General" });
if (!(await Bed.exists({ ward: "North", number: "N-02" })))
  await Bed.create({
    ward: "North",
    number: "N-02",
    type: "General",
    status: "OCCUPIED",
    patientId: p2._id,
    admittedAt: new Date(),
  });
if (!(await Prescription.exists({ recordId: record._id })))
  await Prescription.create({
    patientId: p1._id,
    doctorId: doc1._id,
    appointmentId: a._id,
    recordId: record._id,
    items: [
      {
        medicine: "Example medicine",
        dosage: "As prescribed",
        frequency: "As directed",
        duration: "7 days",
      },
    ],
    instructions: "Demo-only prescription; not medical advice.",
    verifyCode: "carepulse-demo-verification-2026",
  });
console.info("Seed complete. Demo users share password: CarePulseDemo26!");
await import("mongoose").then((m) => m.default.disconnect());
