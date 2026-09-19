import Bill from "../models/Bill.js";
import Appointment from "../models/Appointment.js";
import { AppError,ok } from "../utils/http.js";
import { writeAudit } from "../middleware/audit.js";
export async function create(req,res){
  const {appointmentId,items=[],tax=0}=req.body,a=await Appointment.findById(appointmentId);if(!a)throw new AppError("Appointment not found",404);
  const subtotal=items.reduce((s,i)=>s+Number(i.quantity||1)*Number(i.unitPrice||0),0),total=subtotal+Number(tax||0);
  const b=await Bill.create({patient:a.patient,appointment:a._id,items,subtotal,tax,total});await writeAudit({req,action:"CREATE",resource:"Bill",resourceId:b._id,patient:b.patient});return ok(res,b,201);
}
export async function list(req,res){const f=req.user.role==="patient"?{patient:req.user._id}:{};const b=await Bill.find(f).populate("patient","name").populate("appointment","date timeSlot department").sort({createdAt:-1}).lean();return ok(res,b)}
export async function pay(req,res){const b=await Bill.findById(req.params.id);if(!b)throw new AppError("Bill not found",404);if(req.user.role==="patient"&&!b.patient.equals(req.user._id))throw new AppError("Forbidden",403);b.status="paid";b.paymentReference=`DEMO-${Date.now()}`;await b.save();await writeAudit({req,action:"PAY",resource:"Bill",resourceId:b._id,patient:b.patient});return ok(res,b)}
