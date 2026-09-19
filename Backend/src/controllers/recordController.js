import MedicalRecord from "../models/MedicalRecord.js";
import Appointment from "../models/Appointment.js";
import { AppError,ok } from "../utils/http.js";
import { writeAudit } from "../middleware/audit.js";
export async function create(req,res){
  const {appointmentId,symptoms,diagnosis,treatmentPlan}=req.body,a=await Appointment.findById(appointmentId);
  if(!a)throw new AppError("Appointment not found",404);
  if(req.user.role!=="admin"&&!a.doctor.equals(req.user._id))throw new AppError("Forbidden",403);
  const r=await MedicalRecord.create({patient:a.patient,doctor:a.doctor,appointment:a._id,symptoms,diagnosis,treatmentPlan});
  a.status="completed";await a.save();await writeAudit({req,action:"CREATE",resource:"MedicalRecord",resourceId:r._id,patient:r.patient});return ok(res,r,201);
}
export async function list(req,res){
  const id=req.params.patientId;if(req.user.role==="patient"&&id!==req.user._id.toString())throw new AppError("Forbidden",403);
  if(req.user.role==="doctor"&&!await Appointment.exists({doctor:req.user._id,patient:id}))throw new AppError("Forbidden",403);
  const rows=await MedicalRecord.find({patient:id}).populate("doctor","name").populate("appointment","date timeSlot department").sort({createdAt:-1}).lean();
  await writeAudit({req,action:"READ",resource:"MedicalRecord",patient:id});return ok(res,rows);
}
