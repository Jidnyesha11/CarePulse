import AuditLog from "../models/AuditLog.js";
export async function writeAudit({req,action,resource,resourceId="",patient=null,metadata={}}){
  try{await AuditLog.create({actor:req.user._id,action,resource,resourceId:resourceId?.toString()||"",patient,metadata,ip:req.ip,userAgent:req.get("user-agent")||""})}
  catch(e){console.error("Audit log failure:",e.message)}
}
