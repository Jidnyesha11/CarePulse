import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const signAccessToken = user => jwt.sign(
  { sub: user._id.toString(), role: user.role, type: "access" },
  env.jwtSecret, { expiresIn: env.jwtExpiresIn }
);
export const signRefreshToken = user => jwt.sign(
  { sub: user._id.toString(), type: "refresh" },
  env.refreshSecret, { expiresIn: env.refreshExpiresIn }
);
export const verifyAccessToken = token => jwt.verify(token, env.jwtSecret);
export const verifyRefreshToken = token => jwt.verify(token, env.refreshSecret);
