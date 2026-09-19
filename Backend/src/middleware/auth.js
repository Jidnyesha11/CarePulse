import User from "../models/User.js";
import { AppError } from "../utils/http.js";
import { verifyAccessToken } from "../utils/jwt.js";
export async function requireAuth(req,res,next){
  try{
    const h=req.headers.authorization||"", token=h.startsWith("Bearer ")?h.slice(7):null;
    if(!token) throw new AppError("Authentication required",401,"UNAUTHORIZED");
    const p=verifyAccessToken(token);
    if(p.type!=="access") throw new Error();
    const user=await User.findById(p.sub);
    if(!user||!user.isActive) throw new AppError("Account unavailable",401,"ACCOUNT_UNAVAILABLE");
    req.user=user;next();
  }catch(e){next(e instanceof AppError?e:new AppError("Invalid or expired token",401,"UNAUTHORIZED"))}
}
export const requireRole=(...roles)=>(req,res,next)=>roles.includes(req.user?.role)?next():next(new AppError("Forbidden",403,"FORBIDDEN"));
