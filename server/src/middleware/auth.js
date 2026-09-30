import jwt from "jsonwebtoken";
import { User } from "../modules/models.js";
import { asyncRoute, HttpError } from "../utils/http.js";
export const authenticate = asyncRoute(async (req, res, next) => {
  const token = req.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) throw new HttpError(401, "Authentication required", "UNAUTHENTICATED");
  try {
    const p = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(p.sub).select("name email role department specialty");
    if (!user) throw new Error("missing");
    req.user = user;
    next();
  } catch {
    throw new HttpError(401, "Session expired. Please sign in again.", "UNAUTHENTICATED");
  }
});
export const hasRole = (user, roles) => Boolean(user && roles.includes(user.role));
export const allow =
  (...roles) =>
  (req, res, next) =>
    hasRole(req.user, roles)
      ? next()
      : next(new HttpError(403, "You do not have permission to perform this action.", "FORBIDDEN"));
