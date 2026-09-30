import { randomUUID } from "node:crypto";
export class HttpError extends Error {
  constructor(status, message, code = "REQUEST_ERROR") {
    super(message);
    this.status = status;
    this.code = code;
  }
}
export const ok = (res, data, status = 200) =>
  res.status(status).json({ success: true, data, requestId: res.locals.requestId });
export function asyncRoute(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
export function requestContext(req, res, next) {
  res.locals.requestId = req.get("x-request-id") || randomUUID();
  res.setHeader("x-request-id", res.locals.requestId);
  next();
}
export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  const status = err.status || 500;
  if (status >= 500) console.error({ requestId: res.locals.requestId, error: err.message });
  res
    .status(status)
    .json({
      success: false,
      error: {
        code: err.code || "INTERNAL_ERROR",
        message: status >= 500 ? "An unexpected error occurred." : err.message,
      },
      requestId: res.locals.requestId,
    });
}
