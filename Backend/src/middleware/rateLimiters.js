import rateLimit from "express-rate-limit";
export const authLimiter=rateLimit({windowMs:15*60*1000,limit:50,standardHeaders:"draft-8",legacyHeaders:false});
export const aiLimiter=rateLimit({windowMs:60*1000,limit:15,standardHeaders:"draft-8",legacyHeaders:false});
