import crypto from "node:crypto";
import QRCode from "qrcode";
import Prescription from "../models/Prescription.js";
import Appointment from "../models/Appointment.js";
import { AppError,ok } from "../utils/http.js";
import { writeAudit } from "../middleware/audit.js";
export async function create(req,res){
  const {appointmentId,medicines,notes=""}=req.body,a=await Appointment.findById(appointmentId);if(!a)throw new AppError("Appointment not found",404);
  if(req.user.role!=="admin"&&!a.doctor.equals(req.user._id))throw new AppError("Forbidden",403);
  const code=crypto.randomBytes(8).toString("hex").toUpperCase(),url=`${process.env.CLIENT_URL}/verify-prescription/${code}`,qrDataUrl=await QRCode.toDataURL(url);
  const p=await Prescription.create({patient:a.patient,doctor:a.doctor,appointment:a._id,medicines,notes,verificationCode:code,qrDataUrl});
  await writeAudit({req,action:"CREATE",resource:"Prescription",resourceId:p._id,patient:p.patient});return ok(res,p,201);
}
export async function list(req,res){
  const filter=req.user.role==="patient"?{patient:req.user._id}:req.user.role==="doctor"?{doctor:req.user._id}:{};
  const rows=await Prescription.find(filter).populate("doctor","name").populate("patient","name").sort({createdAt:-1}).lean();
  await writeAudit({req,action:"READ",resource:"Prescription",patient:req.user.role==="patient"?req.user._id:null});return ok(res,rows);
}
export async function verify(req,res){const p=await Prescription.findOne({verificationCode:req.params.code}).populate("doctor","name").populate("patient","name");if(!p)throw new AppError("Prescription not found",404);return ok(res,{verified:true,prescription:p})}
