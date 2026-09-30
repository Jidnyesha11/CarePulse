import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models.js";
import { HttpError } from "../../utils/http.js";
export async function register(input) {
  if (input.role === "ADMIN")
    throw new HttpError(
      403,
      "Administrator accounts must be provisioned by an administrator.",
      "ROLE_RESTRICTED",
    );
  const email = input.email.trim().toLowerCase();
  if (await User.exists({ email }))
    throw new HttpError(409, "An account already exists for this email.", "EMAIL_EXISTS");
  const user = await User.create({
    name: input.name,
    email,
    password: await bcrypt.hash(input.password, 12),
    role: input.role || "PATIENT",
    department: input.department,
  });
  return issue(user);
}
export async function login({ email, password }) {
  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user) throw new HttpError(401, "Email or password is incorrect.", "INVALID_CREDENTIALS");
  if (user.lockedUntil > Date.now())
    throw new HttpError(423, "Account temporarily locked. Try again later.", "ACCOUNT_LOCKED");
  if (!(await bcrypt.compare(password, user.password))) {
    user.failedLogins += 1;
    if (user.failedLogins >= 5) {
      user.failedLogins = 0;
      user.lockedUntil = new Date(Date.now() + 15 * 60_000);
    }
    await user.save();
    throw new HttpError(401, "Email or password is incorrect.", "INVALID_CREDENTIALS");
  }
  user.failedLogins = 0;
  user.lockedUntil = undefined;
  user.lastLogin = new Date();
  await user.save();
  return issue(user);
}
export function issue(user) {
  const accessToken = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign({ sub: user.id, type: "refresh" }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
    },
  };
}
export async function refresh(token) {
  if (!token) throw new HttpError(401, "Refresh session is missing.", "UNAUTHENTICATED");
  try {
    const p = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    if (p.type !== "refresh") throw new Error();
    const user = await User.findById(p.sub);
    if (!user) throw new Error();
    return issue(user);
  } catch {
    throw new HttpError(401, "Session expired. Please sign in again.", "UNAUTHENTICATED");
  }
}
