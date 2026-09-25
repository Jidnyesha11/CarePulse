const jwt=require("jsonwebtoken"),{User}=require("./models");
exports.auth=async(req,res,next)=>{try{let h=req.headers.authorization||"";if(!h.startsWith("Bearer "))return res.status(401).json({message:"Authentication required"});let p=jwt.verify(h.slice(7),process.env.JWT_SECRET),u=await User.findById(p.id);if(!u||!u.isActive)return res.status(401).json({message:"Account unavailable"});req.user=u;next()}catch(e){res.status(401).json({message:"Invalid or expired token"})}};
exports.roles=(...r)=>(req,res,next)=>r.includes(req.user.role)?next():res.status(403).json({message:"Insufficient permissions"});
exports.errors=(e,q,s,n)=>{console.error(e);s.status(e.code===11000?409:e.status||500).json({message:e.code===11000?"Conflict":e.message||"Server error"})};
