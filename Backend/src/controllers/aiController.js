import { triageSymptoms,streamGeneration } from "../services/aiProvider.js";
import Generation from "../models/Generation.js";
import { AppError,ok } from "../utils/http.js";
import { writeAudit } from "../middleware/audit.js";
export async function triage(req,res){if(!req.body.symptoms||req.body.symptoms.length<5)throw new AppError("Please describe symptoms",422);const r=await triageSymptoms(req.body.symptoms);await writeAudit({req,action:"AI_TRIAGE",resource:"AITriage",metadata:{department:r.department,urgency:r.urgency}});return ok(res,r)}
export async function stream(req,res){
  const {prompt,type="general"}=req.body;if(!prompt)throw new AppError("Prompt is required",422);
  res.status(200).set({"Content-Type":"text/event-stream; charset=utf-8","Cache-Control":"no-cache, no-transform","Connection":"keep-alive","X-Accel-Buffering":"no"});res.flushHeaders?.();
  const send=(event,data)=>res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  try{
    send("start",{model:process.env.OPENAI_MODEL||"configured"});
    const r=await streamGeneration({prompt,type,onDelta:async d=>send("delta",{text:d})});
    await Generation.create({actor:req.user._id,patient:req.user.role==="patient"?req.user._id:null,prompt,result:r.result,type,model:r.model});
    await writeAudit({req,action:"AI_GENERATION",resource:"Generation",metadata:{type}});
    send("done",{result:r.result,model:r.model});
  }catch(e){send("error",{message:e.message||"AI generation failed"})}finally{res.end()}
}
