export function notFound(req,res){res.status(404).json({success:false,error:{code:"NOT_FOUND",message:"Route not found"}})}
export function errorHandler(error,req,res,next){
  const duplicate=error?.code===11000,status=error.status||(duplicate?409:500);
  const code=typeof error.code==="string"?error.code:(duplicate?"DUPLICATE":"INTERNAL_ERROR");
  const message=duplicate?"A unique record already exists":(error.message||"Internal server error");
  if(status>=500)console.error(error);
  res.status(status).json({success:false,error:{code,message}});
}
