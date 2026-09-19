import bcrypt from "bcryptjs";
import User from "../models/User.js";
import PatientProfile from "../models/PatientProfile.js";
import { env } from "../config/env.js";
import { AppError,ok } from "../utils/http.js";
import { signAccessToken,signRefreshToken,verifyRefreshToken } from "../utils/jwt.js";
const publicUser=u=>({id:u._id,name:u.name,email:u.email,role:u.role,phone:u.phone,isActive:u.isActive});
const cookie={httpOnly:true,sameSite:"lax",secure:env.nodeEnv==="production",path:"/api/v1/auth"};
export async function register(req,res){
  const {name,email,password,phone}=req.body;
  if(!name||!email||!password)throw new AppError("Name, email and password are required",422);
  if(password.length<8)throw new AppError("Password must contain at least 8 characters",422);
  if(await User.exists({email:email.toLowerCase()}))throw new AppError("Email already registered",409,"EMAIL_EXISTS");
  const user=await User.create({name,email:email.toLowerCase(),password:await bcrypt.hash(password,12),phone,role:"patient"});
  await PatientProfile.create({user:user._id});
  res.cookie("refreshToken",signRefreshToken(user),cookie);
  return ok(res,{user:publicUser(user),accessToken:signAccessToken(user)},201);
}
export async function login(req,res){
  const {email,password}=req.body;const u=await User.findOne({email:email?.toLowerCase()}).select("+password");
  if(!u)throw new AppError("Invalid email or password",401,"INVALID_CREDENTIALS");
  if(u.lockedUntil&&u.lockedUntil>new Date())throw new AppError("Account temporarily locked",423,"ACCOUNT_LOCKED");
  if(!await bcrypt.compare(password||"",u.password)){
    u.failedLoginAttempts++;if(u.failedLoginAttempts>=5){u.lockedUntil=new Date(Date.now()+15*60*1000);u.failedLoginAttempts=0}await u.save();
    throw new AppError("Invalid email or password",401,"INVALID_CREDENTIALS");
  }
  if(!u.isActive)throw new AppError("Account is inactive",403,"ACCOUNT_INACTIVE");
  u.failedLoginAttempts=0;u.lockedUntil=null;await u.save();
  res.cookie("refreshToken",signRefreshToken(u),cookie);
  return ok(res,{user:publicUser(u),accessToken:signAccessToken(u)});
}
export async function refresh(req,res){
  const token=req.cookies.refreshToken;if(!token)throw new AppError("Refresh token missing",401);
  const p=verifyRefreshToken(token),u=await User.findById(p.sub);
  if(p.type!=="refresh"||!u||!u.isActive)throw new AppError("Invalid refresh token",401);
  return ok(res,{user:publicUser(u),accessToken:signAccessToken(u)});
}
export async function logout(req,res){res.clearCookie("refreshToken",{...cookie,maxAge:0});return ok(res,{message:"Logged out"})}
export async function me(req,res){return ok(res,{user:publicUser(req.user)})}
