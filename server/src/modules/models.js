import mongoose from "mongoose";
const { Schema, model, models } = mongoose;
const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxLength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["ADMIN", "DOCTOR", "PATIENT"], default: "PATIENT", index: true },
    department: String,
    specialty: String,
    license: String,
    phone: String,
    failedLogins: { type: Number, default: 0 },
    lockedUntil: Date,
    lastLogin: Date,
  },
  { timestamps: true },
);
export const User = models.User || model("User", UserSchema);
const AppointmentSchema = new Schema(
  {
    patientId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    doctorId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: String, required: true },
    timeSlot: { type: String, required: true },
    department: String,
    status: {
      type: String,
      enum: ["SCHEDULED", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"],
      default: "SCHEDULED",
      index: true,
    },
    triageId: Schema.Types.ObjectId,
    reason: String,
    risk: { score: Number, label: String },
    createdBy: Schema.Types.ObjectId,
  },
  { timestamps: true },
);
AppointmentSchema.index(
  { doctorId: 1, date: 1, timeSlot: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["SCHEDULED", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "NO_SHOW"] },
    },
  },
);
export const Appointment = models.Appointment || model("Appointment", AppointmentSchema);
export const MedicalRecord =
  models.MedicalRecord ||
  model(
    "MedicalRecord",
    new Schema(
      {
        patientId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        doctorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        appointmentId: { type: Schema.Types.ObjectId, ref: "Appointment", unique: true },
        symptoms: [String],
        diagnosis: String,
        notes: String,
        attachments: [String],
      },
      { timestamps: true },
    ),
  );
export const Prescription =
  models.Prescription ||
  model(
    "Prescription",
    new Schema(
      {
        patientId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        doctorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        appointmentId: Schema.Types.ObjectId,
        recordId: Schema.Types.ObjectId,
        items: [{ medicine: String, dosage: String, frequency: String, duration: String }],
        instructions: String,
        verifyCode: { type: String, unique: true, index: true },
        issuedAt: { type: Date, default: Date.now },
      },
      { timestamps: true },
    ),
  );
export const Bill =
  models.Bill ||
  model(
    "Bill",
    new Schema(
      {
        patientId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        appointmentId: { type: Schema.Types.ObjectId, ref: "Appointment", unique: true },
        items: [{ description: String, amount: Number }],
        total: { type: Number, required: true },
        currency: { type: String, default: "INR" },
        status: { type: String, enum: ["UNPAID", "PAID", "OVERDUE"], default: "UNPAID" },
        paidAt: Date,
      },
      { timestamps: true },
    ),
  );
const BedSchema = new Schema(
  {
    ward: { type: String, required: true },
    number: { type: String, required: true },
    type: { type: String, default: "General" },
    status: {
      type: String,
      enum: ["AVAILABLE", "OCCUPIED", "MAINTENANCE"],
      default: "AVAILABLE",
      index: true,
    },
    patientId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    admittedAt: Date,
  },
  { timestamps: true },
);
BedSchema.index({ ward: 1, number: 1 }, { unique: true });
BedSchema.index(
  { patientId: 1 },
  { unique: true, partialFilterExpression: { status: "OCCUPIED" } },
);
export const Bed = models.Bed || model("Bed", BedSchema);
export const Triage =
  models.Triage ||
  model(
    "Triage",
    new Schema(
      {
        patientId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        symptoms: { type: String, required: true, select: false },
        department: String,
        specialist: String,
        urgency: { type: String, enum: ["LOW", "MEDIUM", "HIGH", "EMERGENCY"] },
        confidence: Number,
        reasoning: String,
        disclaimer: String,
        model: String,
        manualSelection: Boolean,
      },
      { timestamps: true },
    ),
  );
export const Claim =
  models.Claim ||
  model(
    "Claim",
    new Schema(
      {
        patientId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        billId: { type: Schema.Types.ObjectId, ref: "Bill", required: true },
        provider: String,
        policyLast4: String,
        policyHash: { type: String, select: false },
        status: {
          type: String,
          enum: ["SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED"],
          default: "SUBMITTED",
        },
        notes: String,
      },
      { timestamps: true },
    ),
  );
export const AuditLog =
  models.AuditLog ||
  model(
    "AuditLog",
    new Schema(
      {
        actorId: { type: Schema.Types.ObjectId, ref: "User", index: true },
        action: { type: String, required: true },
        resource: { type: String, required: true, index: true },
        resourceId: String,
        requestId: String,
        ip: String,
        metadata: Schema.Types.Mixed,
      },
      { timestamps: true, versionKey: false },
    ),
  );
