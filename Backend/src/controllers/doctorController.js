import DoctorProfile from "../models/DoctorProfile.js";
import Appointment from "../models/Appointment.js";
import { AppError,ok } from "../utils/http.js";
export async function listDoctors(req,res){
  const q={};if(req.query.department)q.department=req.query.department;
  const rows=await DoctorProfile.find(q).populate({path:"user",match:{isActive:true},select:"name email phone"}).lean();
  return ok(res,rows.filter(x=>x.user));
}
export async function availability(req,res){
  const d=await DoctorProfile.findOne({user:req.params.doctorId});if(!d)throw new AppError("Doctor not found",404);
  const date=req.query.date;if(!date)throw new AppError("date is required",422);
  const booked=await Appointment.find({doctor:d.user,date,status:{$in:["booked","confirmed"]}}).select("timeSlot").lean();
  const taken=new Set(booked.map(x=>x.timeSlot));const [sh,sm]=d.workingHours.start.split(":").map(Number),[eh,em]=d.workingHours.end.split(":").map(Number);
  const out=[];for(let m=sh*60+sm;m+d.slotMinutes<=eh*60+em;m+=d.slotMinutes){const s=`${String(Math.floor(m/60)).padStart(2,"0")}:${String(m%60).padStart(2,"0")}`;out.push({timeSlot:s,available:!taken.has(s)})}
  return ok(res,{date,doctor:d.user,slots:out});
}
