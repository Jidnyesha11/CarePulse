import { AuditLog } from "../models.js";
export async function audit(req, action, resource, resourceId, metadata = {}) {
  await AuditLog.create({
    actorId: req.user?._id,
    action,
    resource,
    resourceId: String(resourceId || ""),
    requestId: req.res?.locals?.requestId,
    ip: req.ip,
    metadata,
  });
}
