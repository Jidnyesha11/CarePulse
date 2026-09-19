import Appointment from "../models/Appointment.js";
import DoctorProfile from "../models/DoctorProfile.js";
import { AppError,ok } from "../utils/http.js";
import { writeAudit } from "../middleware/audit.js";
export async function create(req,res){
  const {doctorId,date,timeSlot,reason,department,aiTriage}=req.body;
  const d=await DoctorProfile.findOne({user:doctorId});if(!d)throw new AppError("Doctor not found",404);
  try{
    const a=await Appointment.create({patient:req.user._id,doctor:doctorId,date,timeSlot,reason,department,aiTriage});
    req.app.get("io")?.to(`doctor:${doctorId}`).emit("slot:booked",{doctorId,date,timeSlot});
    await writeAudit({req,action:"CREATE",resource:"Appointment",resourceId:a._id,patient:req.user._id});
    return ok(res,a,201);
  }catch(e){if(e.code===11000)throw new AppError("That slot is no longer available",409,"SLOT_CONFLICT");throw e}
}
export async function list(req,res){
  const f={};if(req.user.role==="patient")f.patient=req.user._id;if(req.user.role==="doctor")f.doctor=req.user._id;
  if(req.query.status)f.status=req.query.status;if(req.query.date)f.date=req.query.date;
  const page=Math.max(1,Number(req.query.page||1)),limit=Math.min(50,Number(req.query.limit||20));
  const [items,total]=await Promise.all([
    Appointment.find(f).populate("patient","name email").populate("doctor","name email").sort({date:1,timeSlot:1}).skip((page-1)*limit).limit(limit).lean(),
    Appointment.countDocuments(f)
  ]);
  return ok(res,{items,total,page,limit,pages:Math.ceil(total/limit)});
}
export async function status(req,res){
  const a=await Appointment.findById(req.params.id);if(!a)throw new AppError("Appointment not found",404);
  if(req.user.role==="doctor"&&a.doctor.toString()!==req.user._id.toString())throw new AppError("Forbidden",403);
  a.status=req.body.status;await a.save();await writeAudit({req,action:"UPDATE_STATUS",resource:"Appointment",resourceId:a._id,patient:a.patient});
  return ok(res,a);
}
export async function cancel(req,res){
  const a=await Appointment.findById(req.params.id);if(!a)throw new AppError("Appointment not found",404);
  if(req.user.role!=="admin"&&!a.patient.equals(req.user._id)&&!a.doctor.equals(req.user._id))throw new AppError("Forbidden",403);
  a.status="cancelled";await a.save();req.app.get("io")?.to(`doctor:${a.doctor}`).emit("slot:released",{doctorId:a.doctor,date:a.date,timeSlot:a.timeSlot});
  await writeAudit({req,action:"CANCEL",resource:"Appointment",resourceId:a._id,patient:a.patient});return ok(res,a);
}
