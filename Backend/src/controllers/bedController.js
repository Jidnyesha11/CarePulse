import Bed from "../models/Bed.js";
import { AppError,ok } from "../utils/http.js";
import { writeAudit } from "../middleware/audit.js";
export async function list(req,res){return ok(res,await Bed.find().populate("patient","name email").sort({ward:1,bedNumber:1}).lean())}
export async function update(req,res){const b=await Bed.findById(req.params.id);if(!b)throw new AppError("Bed not found",404);b.status=req.body.status;b.patient=b.status==="occupied"?req.body.patient||null:null;b.admittedAt=b.status==="occupied"?(b.admittedAt||new Date()):null;await b.save();await writeAudit({req,action:"UPDATE",resource:"Bed",resourceId:b._id,patient:b.patient});return ok(res,b)}
