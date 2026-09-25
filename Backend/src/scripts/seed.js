import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import mongoose from "mongoose";
import QRCode from "qrcode";

import { env } from "../config/env.js";

import User from "../models/User.js";
import DoctorProfile from "../models/DoctorProfile.js";
import PatientProfile from "../models/PatientProfile.js";
import Appointment from "../models/Appointment.js";
import MedicalRecord from "../models/MedicalRecord.js";
import Prescription from "../models/Prescription.js";
import Bill from "../models/Bill.js";
import Bed from "../models/Bed.js";
import AuditLog from "../models/AuditLog.js";

const PASSWORDS = {
  admin: "Admin@12345",
  doctor: "Doctor@12345",
  patient: "Patient@12345",
};

const CLIENT_URL =
  process.env.CLIENT_URL || "http://localhost:5173";

function dateOffset(days) {
  const date = new Date();

  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);

  return date;
}

function dateString(days) {
  return dateOffset(days).toISOString().slice(0, 10);
}

function id() {
  return new mongoose.Types.ObjectId();
}

function verificationCode(prefix) {
  return `${prefix}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

async function hash(password) {
  return bcrypt.hash(password, 12);
}

async function main() {
  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("       CAREPULSE DATABASE SEED");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("");

  await mongoose.connect(env.mongoUri);

  console.log("✓ MongoDB connected");
  console.log("");

  /*
   * ---------------------------------------------------------
   * 1. REMOVE PREVIOUS DEMO DATA
   * ---------------------------------------------------------
   */

  const demoEmails = [
    "admin@carepulse.local",

    "doctor@carepulse.local",
    "doctor.cardiology@carepulse.local",
    "doctor.pediatrics@carepulse.local",

    "patient@carepulse.local",
    "patient.anjali@carepulse.local",
    "patient.rohan@carepulse.local",
    "patient.sneha@carepulse.local",
    "patient.vikram@carepulse.local",
    "patient.priya@carepulse.local",
  ];

  const oldUsers = await User.find({
    email: { $in: demoEmails },
  }).select("_id");

  const oldUserIds = oldUsers.map((user) => user._id);

  if (oldUserIds.length) {
    await Promise.all([
      DoctorProfile.deleteMany({
        user: { $in: oldUserIds },
      }),

      PatientProfile.deleteMany({
        user: { $in: oldUserIds },
      }),

      Appointment.deleteMany({
        $or: [
          { patient: { $in: oldUserIds } },
          { doctor: { $in: oldUserIds } },
        ],
      }),

      MedicalRecord.deleteMany({
        $or: [
          { patient: { $in: oldUserIds } },
          { doctor: { $in: oldUserIds } },
        ],
      }),

      Prescription.deleteMany({
        $or: [
          { patient: { $in: oldUserIds } },
          { doctor: { $in: oldUserIds } },
        ],
      }),

      Bill.deleteMany({
        patient: { $in: oldUserIds },
      }),

      AuditLog.deleteMany({
        $or: [
          { actor: { $in: oldUserIds } },
          { patient: { $in: oldUserIds } },
        ],
      }),

      Bed.updateMany(
        { patient: { $in: oldUserIds } },
        {
          $set: {
            patient: null,
            status: "available",
            admittedAt: null,
          },
        }
      ),

      User.deleteMany({
        _id: { $in: oldUserIds },
      }),
    ]);

    console.log(`✓ Removed ${oldUserIds.length} old demo users`);
  }

  /*
   * ---------------------------------------------------------
   * 2. CREATE USERS
   * ---------------------------------------------------------
   */

  const [
    adminPassword,
    doctorPassword,
    patientPassword,
  ] = await Promise.all([
    hash(PASSWORDS.admin),
    hash(PASSWORDS.doctor),
    hash(PASSWORDS.patient),
  ]);

  const admin = await User.create({
    name: "CarePulse Admin",
    email: "admin@carepulse.local",
    password: adminPassword,
    role: "admin",
    phone: "+91 90000 10001",
    isActive: true,
  });

  const doctors = await User.insertMany([
    {
      name: "Dr. Maya Sharma",
      email: "doctor@carepulse.local",
      password: doctorPassword,
      role: "doctor",
      phone: "+91 90000 10002",
      isActive: true,
    },
    {
      name: "Dr. Arjun Mehta",
      email: "doctor.cardiology@carepulse.local",
      password: doctorPassword,
      role: "doctor",
      phone: "+91 90000 10003",
      isActive: true,
    },
    {
      name: "Dr. Neha Kapoor",
      email: "doctor.pediatrics@carepulse.local",
      password: doctorPassword,
      role: "doctor",
      phone: "+91 90000 10004",
      isActive: true,
    },
  ]);

  const patients = await User.insertMany([
    {
      name: "Aarav Patient",
      email: "patient@carepulse.local",
      password: patientPassword,
      role: "patient",
      phone: "+91 90000 20001",
      isActive: true,
    },
    {
      name: "Anjali Verma",
      email: "patient.anjali@carepulse.local",
      password: patientPassword,
      role: "patient",
      phone: "+91 90000 20002",
      isActive: true,
    },
    {
      name: "Rohan Shah",
      email: "patient.rohan@carepulse.local",
      password: patientPassword,
      role: "patient",
      phone: "+91 90000 20003",
      isActive: true,
    },
    {
      name: "Sneha Patel",
      email: "patient.sneha@carepulse.local",
      password: patientPassword,
      role: "patient",
      phone: "+91 90000 20004",
      isActive: true,
    },
    {
      name: "Vikram Joshi",
      email: "patient.vikram@carepulse.local",
      password: patientPassword,
      role: "patient",
      phone: "+91 90000 20005",
      isActive: true,
    },
    {
      name: "Priya Nair",
      email: "patient.priya@carepulse.local",
      password: patientPassword,
      role: "patient",
      phone: "+91 90000 20006",
      isActive: true,
    },
  ]);

  console.log("✓ Created users");
  console.log("  • 1 administrator");
  console.log("  • 3 doctors");
  console.log("  • 6 patients");

  /*
   * ---------------------------------------------------------
   * 3. DOCTOR PROFILES
   * ---------------------------------------------------------
   */

  await DoctorProfile.insertMany([
    {
      user: doctors[0]._id,
      department: "General Medicine",
      specialization: "Internal Medicine",
      licenseNumber: "CP-MED-1001",
      consultationFee: 700,
      experienceYears: 8,
      bio: "Focused on preventive care, chronic conditions and comprehensive adult medicine.",
      workingHours: {
        start: "09:00",
        end: "17:00",
      },
      slotMinutes: 30,
    },

    {
      user: doctors[1]._id,
      department: "Cardiology",
      specialization: "Preventive Cardiology",
      licenseNumber: "CP-CARD-1002",
      consultationFee: 1000,
      experienceYears: 12,
      bio: "Specializes in cardiovascular risk assessment and preventive cardiac care.",
      workingHours: {
        start: "10:00",
        end: "18:00",
      },
      slotMinutes: 30,
    },

    {
      user: doctors[2]._id,
      department: "Pediatrics",
      specialization: "Child Health",
      licenseNumber: "CP-PED-1003",
      consultationFee: 800,
      experienceYears: 7,
      bio: "Provides pediatric consultations and routine child health management.",
      workingHours: {
        start: "09:00",
        end: "16:00",
      },
      slotMinutes: 30,
    },
  ]);

  /*
   * ---------------------------------------------------------
   * 4. PATIENT PROFILES
   * ---------------------------------------------------------
   */

  await PatientProfile.insertMany([
    {
      user: patients[0]._id,
      dateOfBirth: new Date("1997-04-12"),
      gender: "male",
      bloodGroup: "O+",
      allergies: ["Penicillin"],
      emergencyContact: {
        name: "Rahul Patient",
        phone: "+91 90000 30001",
        relation: "Brother",
      },
      insuranceProvider: "Demo Health Insurance",
      insuranceNumber: "CP-INS-10001",
    },

    {
      user: patients[1]._id,
      dateOfBirth: new Date("1994-08-21"),
      gender: "female",
      bloodGroup: "A+",
      allergies: [],
      emergencyContact: {
        name: "Karan Verma",
        phone: "+91 90000 30002",
        relation: "Spouse",
      },
      insuranceProvider: "Demo Health Insurance",
      insuranceNumber: "CP-INS-10002",
    },

    {
      user: patients[2]._id,
      dateOfBirth: new Date("1989-11-03"),
      gender: "male",
      bloodGroup: "B+",
      allergies: ["Dust"],
      emergencyContact: {
        name: "Meera Shah",
        phone: "+91 90000 30003",
        relation: "Spouse",
      },
      insuranceProvider: "Demo Care",
      insuranceNumber: "CP-INS-10003",
    },

    {
      user: patients[3]._id,
      dateOfBirth: new Date("2001-02-15"),
      gender: "female",
      bloodGroup: "AB+",
      allergies: [],
      emergencyContact: {
        name: "Ravi Patel",
        phone: "+91 90000 30004",
        relation: "Father",
      },
      insuranceProvider: "Demo Care",
      insuranceNumber: "CP-INS-10004",
    },

    {
      user: patients[4]._id,
      dateOfBirth: new Date("1978-06-30"),
      gender: "male",
      bloodGroup: "O-",
      allergies: ["Sulfa"],
      emergencyContact: {
        name: "Nisha Joshi",
        phone: "+91 90000 30005",
        relation: "Spouse",
      },
      insuranceProvider: "Demo Health Insurance",
      insuranceNumber: "CP-INS-10005",
    },

    {
      user: patients[5]._id,
      dateOfBirth: new Date("1992-09-18"),
      gender: "female",
      bloodGroup: "A-",
      allergies: [],
      emergencyContact: {
        name: "Amit Nair",
        phone: "+91 90000 30006",
        relation: "Brother",
      },
      insuranceProvider: "Demo Care",
      insuranceNumber: "CP-INS-10006",
    },
  ]);

  console.log("✓ Created doctor and patient profiles");

  /*
   * ---------------------------------------------------------
   * 5. APPOINTMENTS
   * ---------------------------------------------------------
   *
   * Past appointments become completed/no-show records.
   * Future appointments remain booked/confirmed.
   */

  const appointments = await Appointment.insertMany([
    /*
     * COMPLETED
     */

    {
      patient: patients[0]._id,
      doctor: doctors[0]._id,
      date: dateString(-21),
      timeSlot: "10:00",
      department: "General Medicine",
      reason: "Persistent fatigue and routine health assessment",
      status: "completed",
      aiTriage: {
        department: "General Medicine",
        urgency: "routine",
        confidence: 0.88,
        disclaimer: "This is not a medical diagnosis.",
      },
    },

    {
      patient: patients[1]._id,
      doctor: doctors[1]._id,
      date: dateString(-18),
      timeSlot: "11:00",
      department: "Cardiology",
      reason: "Blood pressure follow-up and cardiovascular screening",
      status: "completed",
    },

    {
      patient: patients[2]._id,
      doctor: doctors[0]._id,
      date: dateString(-14),
      timeSlot: "14:00",
      department: "General Medicine",
      reason: "Seasonal cough and medication review",
      status: "completed",
    },

    {
      patient: patients[3]._id,
      doctor: doctors[2]._id,
      date: dateString(-10),
      timeSlot: "10:30",
      department: "Pediatrics",
      reason: "Routine pediatric consultation",
      status: "completed",
    },

    {
      patient: patients[4]._id,
      doctor: doctors[1]._id,
      date: dateString(-7),
      timeSlot: "15:00",
      department: "Cardiology",
      reason: "Cholesterol and cardiac risk review",
      status: "completed",
    },

    {
      patient: patients[5]._id,
      doctor: doctors[0]._id,
      date: dateString(-4),
      timeSlot: "11:30",
      department: "General Medicine",
      reason: "Headache and sleep pattern consultation",
      status: "completed",
    },

    /*
     * NO SHOW
     */

    {
      patient: patients[2]._id,
      doctor: doctors[2]._id,
      date: dateString(-5),
      timeSlot: "13:00",
      department: "Pediatrics",
      reason: "Follow-up consultation",
      status: "no_show",
    },

    /*
     * CANCELLED
     */

    {
      patient: patients[3]._id,
      doctor: doctors[0]._id,
      date: dateString(-2),
      timeSlot: "16:00",
      department: "General Medicine",
      reason: "General consultation",
      status: "cancelled",
    },

    /*
     * FUTURE - BOOKED
     */

    {
      patient: patients[0]._id,
      doctor: doctors[1]._id,
      date: dateString(1),
      timeSlot: "10:30",
      department: "Cardiology",
      reason: "Preventive cardiovascular screening",
      status: "booked",
      aiTriage: {
        department: "Cardiology",
        urgency: "soon",
        confidence: 0.81,
        disclaimer: "This is not a medical diagnosis.",
      },
    },

    {
      patient: patients[1]._id,
      doctor: doctors[0]._id,
      date: dateString(2),
      timeSlot: "09:30",
      department: "General Medicine",
      reason: "Follow-up consultation",
      status: "confirmed",
    },

    {
      patient: patients[4]._id,
      doctor: doctors[1]._id,
      date: dateString(3),
      timeSlot: "14:30",
      department: "Cardiology",
      reason: "Blood pressure monitoring",
      status: "confirmed",
    },

    {
      patient: patients[5]._id,
      doctor: doctors[2]._id,
      date: dateString(5),
      timeSlot: "11:00",
      department: "Pediatrics",
      reason: "Routine health consultation",
      status: "booked",
    },
  ]);

  console.log(`✓ Created ${appointments.length} appointments`);

  /*
   * ---------------------------------------------------------
   * 6. MEDICAL RECORDS
   * ---------------------------------------------------------
   */

  const completedAppointments = appointments.filter(
    (appointment) => appointment.status === "completed"
  );

  const recordData = [
    {
      symptoms:
        "Fatigue for several weeks with reduced energy during the day.",
      diagnosis:
        "Fatigue requiring lifestyle review and routine monitoring.",
      treatmentPlan:
        "Maintain regular sleep schedule, hydration and balanced meals. Follow up if symptoms persist.",
    },

    {
      symptoms:
        "Occasional elevated blood pressure readings and mild headaches.",
      diagnosis:
        "Elevated blood pressure requiring monitoring.",
      treatmentPlan:
        "Monitor blood pressure regularly and continue lifestyle modifications. Review readings at follow-up.",
    },

    {
      symptoms:
        "Dry cough and mild throat irritation for several days.",
      diagnosis:
        "Upper respiratory symptoms.",
      treatmentPlan:
        "Hydration, rest and symptom monitoring. Return for review if symptoms worsen or persist.",
    },

    {
      symptoms:
        "Routine pediatric health assessment with no acute complaints.",
      diagnosis:
        "Routine child health assessment.",
      treatmentPlan:
        "Continue age-appropriate nutrition, activity and preventive care.",
    },

    {
      symptoms:
        "History of elevated cholesterol with no acute symptoms.",
      diagnosis:
        "Cardiovascular risk factors under monitoring.",
      treatmentPlan:
        "Continue cardiovascular risk reduction measures and schedule periodic lipid monitoring.",
    },

    {
      symptoms:
        "Recurring mild headaches and inconsistent sleep schedule.",
      diagnosis:
        "Tension-type headache pattern suspected.",
      treatmentPlan:
        "Improve sleep routine, hydration and screen breaks. Follow up if symptoms increase.",
    },
  ];

  const records = [];

  for (let i = 0; i < completedAppointments.length; i += 1) {
    const appointment = completedAppointments[i];
    const data = recordData[i];

    const record = await MedicalRecord.create({
      patient: appointment.patient,
      doctor: appointment.doctor,
      appointment: appointment._id,
      symptoms: data.symptoms,
      diagnosis: data.diagnosis,
      treatmentPlan: data.treatmentPlan,
    });

    records.push(record);
  }

  console.log(`✓ Created ${records.length} medical records`);

  /*
   * ---------------------------------------------------------
   * 7. PRESCRIPTIONS
   * ---------------------------------------------------------
   */

  const prescriptionPlans = [
    {
      appointment: completedAppointments[0],
      medicines: [
        {
          name: "Daily multivitamin",
          dosage: "1 tablet",
          frequency: "Once daily",
          duration: "30 days",
          instructions: "Take after breakfast.",
        },
      ],
      notes: "Continue healthy sleep and nutrition habits.",
    },

    {
      appointment: completedAppointments[1],
      medicines: [
        {
          name: "Amlodipine",
          dosage: "5 mg",
          frequency: "Once daily",
          duration: "30 days",
          instructions: "Take at the same time each day as directed.",
        },
      ],
      notes: "Monitor blood pressure and maintain a low-sodium diet.",
    },

    {
      appointment: completedAppointments[2],
      medicines: [
        {
          name: "Paracetamol",
          dosage: "500 mg",
          frequency: "As directed",
          duration: "3 days",
          instructions: "Use only according to clinician instructions.",
        },
      ],
      notes: "Rest and maintain adequate hydration.",
    },

    {
      appointment: completedAppointments[3],
      medicines: [
        {
          name: "Vitamin D supplement",
          dosage: "As directed",
          frequency: "Once weekly",
          duration: "4 weeks",
          instructions: "Use according to clinician instructions.",
        },
      ],
      notes: "Continue routine pediatric preventive care.",
    },

    {
      appointment: completedAppointments[4],
      medicines: [
        {
          name: "Atorvastatin",
          dosage: "10 mg",
          frequency: "Once daily",
          duration: "30 days",
          instructions: "Take according to clinician instructions.",
        },
      ],
      notes: "Continue cardiovascular lifestyle measures.",
    },
  ];

  const prescriptions = [];

  for (let i = 0; i < prescriptionPlans.length; i += 1) {
    const plan = prescriptionPlans[i];

    const code = verificationCode(`CP${i + 1}`);

    const verificationUrl =
      `${CLIENT_URL}/verify-prescription/${code}`;

    const qrDataUrl = await QRCode.toDataURL(
      verificationUrl
    );

    const prescription = await Prescription.create({
      patient: plan.appointment.patient,
      doctor: plan.appointment.doctor,
      appointment: plan.appointment._id,
      medicines: plan.medicines,
      notes: plan.notes,
      verificationCode: code,
      qrDataUrl,
    });

    prescriptions.push(prescription);
  }

  console.log(
    `✓ Created ${prescriptions.length} prescriptions with QR verification`
  );

  /*
   * ---------------------------------------------------------
   * 8. BILLS
   * ---------------------------------------------------------
   */

  const billPlans = [
    {
      appointment: completedAppointments[0],
      items: [
        {
          description: "General Medicine Consultation",
          quantity: 1,
          unitPrice: 700,
        },
      ],
      tax: 35,
      status: "paid",
    },

    {
      appointment: completedAppointments[1],
      items: [
        {
          description: "Cardiology Consultation",
          quantity: 1,
          unitPrice: 1000,
        },
        {
          description: "ECG",
          quantity: 1,
          unitPrice: 450,
        },
      ],
      tax: 72.5,
      status: "paid",
    },

    {
      appointment: completedAppointments[2],
      items: [
        {
          description: "General Medicine Consultation",
          quantity: 1,
          unitPrice: 700,
        },
      ],
      tax: 35,
      status: "paid",
    },

    {
      appointment: completedAppointments[3],
      items: [
        {
          description: "Pediatric Consultation",
          quantity: 1,
          unitPrice: 800,
        },
      ],
      tax: 40,
      status: "paid",
    },

    {
      appointment: completedAppointments[4],
      items: [
        {
          description: "Cardiology Consultation",
          quantity: 1,
          unitPrice: 1000,
        },
        {
          description: "Lipid Profile",
          quantity: 1,
          unitPrice: 600,
        },
      ],
      tax: 80,
      status: "unpaid",
    },

    {
      appointment: completedAppointments[5],
      items: [
        {
          description: "General Medicine Consultation",
          quantity: 1,
          unitPrice: 700,
        },
      ],
      tax: 35,
      status: "unpaid",
    },
  ];

  const bills = [];

  for (let i = 0; i < billPlans.length; i += 1) {
    const plan = billPlans[i];

    const subtotal = plan.items.reduce(
      (sum, item) =>
        sum +
        Number(item.quantity || 1) *
        Number(item.unitPrice || 0),
      0
    );

    const total = subtotal + Number(plan.tax || 0);

    const bill = await Bill.create({
      patient: plan.appointment.patient,
      appointment: plan.appointment._id,
      items: plan.items,
      subtotal,
      tax: plan.tax,
      total,
      status: plan.status,
      paymentReference:
        plan.status === "paid"
          ? `DEMO-PAY-${10000 + i}`
          : "",
    });

    bills.push(bill);
  }

  console.log(`✓ Created ${bills.length} bills`);

  /*
   * ---------------------------------------------------------
   * 9. HOSPITAL BEDS
   * ---------------------------------------------------------
   */

  await Bed.deleteMany({
    ward: {
      $in: [
        "General Ward",
        "ICU",
        "Private Ward",
        "Semi Private Ward",
      ],
    },
  });

  const beds = [
    {
      ward: "General Ward",
      bedNumber: "G-101",
      type: "general",
      status: "occupied",
      patient: patients[4]._id,
      admittedAt: dateOffset(-3),
    },

    {
      ward: "General Ward",
      bedNumber: "G-102",
      type: "general",
      status: "available",
      patient: null,
      admittedAt: null,
    },

    {
      ward: "General Ward",
      bedNumber: "G-103",
      type: "general",
      status: "available",
      patient: null,
      admittedAt: null,
    },

    {
      ward: "General Ward",
      bedNumber: "G-104",
      type: "general",
      status: "occupied",
      patient: patients[2]._id,
      admittedAt: dateOffset(-1),
    },

    {
      ward: "ICU",
      bedNumber: "I-201",
      type: "icu",
      status: "available",
      patient: null,
      admittedAt: null,
    },

    {
      ward: "ICU",
      bedNumber: "I-202",
      type: "icu",
      status: "maintenance",
      patient: null,
      admittedAt: null,
    },

    {
      ward: "Private Ward",
      bedNumber: "P-301",
      type: "private",
      status: "available",
      patient: null,
      admittedAt: null,
    },

    {
      ward: "Private Ward",
      bedNumber: "P-302",
      type: "private",
      status: "occupied",
      patient: patients[0]._id,
      admittedAt: dateOffset(-2),
    },

    {
      ward: "Semi Private Ward",
      bedNumber: "S-401",
      type: "semi_private",
      status: "available",
      patient: null,
      admittedAt: null,
    },

    {
      ward: "Semi Private Ward",
      bedNumber: "S-402",
      type: "semi_private",
      status: "available",
      patient: null,
      admittedAt: null,
    },
  ];

  await Bed.insertMany(beds);

  console.log(`✓ Created ${beds.length} hospital beds`);

  /*
   * ---------------------------------------------------------
   * 10. AUDIT LOGS
   * ---------------------------------------------------------
   */

  const auditLogs = [];

  for (const appointment of appointments) {
    auditLogs.push({
      actor: admin._id,
      action: "CREATE",
      resource: "Appointment",
      resourceId: appointment._id.toString(),
      patient: appointment.patient,
      metadata: {
        seeded: true,
        status: appointment.status,
      },
      ip: "127.0.0.1",
      userAgent: "CarePulse Demo Seed",
    });
  }

  for (const record of records) {
    auditLogs.push({
      actor: record.doctor,
      action: "CREATE",
      resource: "MedicalRecord",
      resourceId: record._id.toString(),
      patient: record.patient,
      metadata: {
        seeded: true,
      },
      ip: "127.0.0.1",
      userAgent: "CarePulse Demo Seed",
    });
  }

  for (const prescription of prescriptions) {
    auditLogs.push({
      actor: prescription.doctor,
      action: "CREATE",
      resource: "Prescription",
      resourceId: prescription._id.toString(),
      patient: prescription.patient,
      metadata: {
        seeded: true,
        verificationCode:
          prescription.verificationCode,
      },
      ip: "127.0.0.1",
      userAgent: "CarePulse Demo Seed",
    });
  }

  for (const bill of bills) {
    auditLogs.push({
      actor: admin._id,
      action: "CREATE",
      resource: "Bill",
      resourceId: bill._id.toString(),
      patient: bill.patient,
      metadata: {
        seeded: true,
        total: bill.total,
        status: bill.status,
      },
      ip: "127.0.0.1",
      userAgent: "CarePulse Demo Seed",
    });
  }

  await AuditLog.insertMany(auditLogs);

  console.log(
    `✓ Created ${auditLogs.length} audit log entries`
  );

  /*
   * ---------------------------------------------------------
   * 11. FINAL SUMMARY
   * ---------------------------------------------------------
   */

  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("           SEED COMPLETE");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("");

  console.log("DATA CREATED");
  console.log("────────────────────────────────────");
  console.log("✓ 1 administrator");
  console.log("✓ 3 doctors");
  console.log("✓ 6 patients");
  console.log("✓ 3 doctor profiles");
  console.log("✓ 6 patient profiles");
  console.log(`✓ ${appointments.length} appointments`);
  console.log(`✓ ${records.length} medical records`);
  console.log(`✓ ${prescriptions.length} prescriptions`);
  console.log(`✓ ${bills.length} bills`);
  console.log(`✓ ${beds.length} hospital beds`);
  console.log(`✓ ${auditLogs.length} audit logs`);

  console.log("");
  console.log("DEMO LOGIN");
  console.log("────────────────────────────────────");

  console.log("");
  console.log("ADMIN");
  console.log("Email:    admin@carepulse.local");
  console.log("Password: Admin@12345");

  console.log("");
  console.log("DOCTOR");
  console.log("Email:    doctor@carepulse.local");
  console.log("Password: Doctor@12345");

  console.log("");
  console.log("CARDIOLOGY DOCTOR");
  console.log(
    "Email:    doctor.cardiology@carepulse.local"
  );
  console.log("Password: Doctor@12345");

  console.log("");
  console.log("PATIENT");
  console.log("Email:    patient@carepulse.local");
  console.log("Password: Patient@12345");

  console.log("");
  console.log("ADDITIONAL PATIENT");
  console.log(
    "Email:    patient.anjali@carepulse.local"
  );
  console.log("Password: Patient@12345");

  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("   CarePulse demo database is ready");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("");

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error("");
  console.error("❌ SEED FAILED");
  console.error("");
  console.error(error);

  await mongoose.disconnect().catch(() => {});

  process.exit(1);
});