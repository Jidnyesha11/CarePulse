import User from "../models/User.js";
import DoctorProfile from "../models/DoctorProfile.js";
import Appointment from "../models/Appointment.js";
import Bill from "../models/Bill.js";
import Bed from "../models/Bed.js";
import AuditLog from "../models/AuditLog.js";
import {ok} from "../utils/http.js";
export async function analytics(req,res){
  const [patients,doctors,appointments,revenue,occupied,total,recent]=await Promise.all([
    User.countDocuments({role:"patient"}),User.countDocuments({role:"doctor"}),Appointment.countDocuments(),
    Bill.aggregate([{$match:{status:"paid"}},{$group:{_id:null,total:{$sum:"$total"}}}]),
    Bed.countDocuments({status:"occupied"}),Bed.countDocuments(),Appointment.find().populate("patient","name").populate("doctor","name").sort({createdAt:-1}).limit(8).lean()
  ]);
  return ok(res,{patients,doctors,appointments,revenue:revenue[0]?.total||0,beds:{occupied,total},recent});
}
export async function users(req,res){return ok(res,await User.find().select("name email role phone isActive createdAt").sort({createdAt:-1}).lean())}
export async function status(req,res){return ok(res,await User.findByIdAndUpdate(req.params.id,{isActive:Boolean(req.body.isActive)},{new:true}).select("name email role isActive"))}
export async function role(req,res){return ok(res,await User.findByIdAndUpdate(req.params.id,{role:req.body.role},{new:true}).select("name email role isActive"))}
export async function doctors(req,res){return ok(res,await DoctorProfile.find().populate("user","name email phone isActive").lean())}
export async function audit(req,res){const page=Number(req.query.page||1),limit=Math.min(50,Number(req.query.limit||20));const [items,total]=await Promise.all([AuditLog.find().populate("actor","name email role").populate("patient","name email").sort({createdAt:-1}).skip((page-1)*limit).limit(limit).lean(),AuditLog.countDocuments()]);return ok(res,{items,total,page,limit,pages:Math.ceil(total/limit)})}
