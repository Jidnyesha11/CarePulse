import mongoose from "mongoose";
const schema = new mongoose.Schema({
  actor:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true,index:true},
  action:{type:String,required:true},resource:{type:String,required:true},
  resourceId:{type:String,default:""},patient:{type:mongoose.Schema.Types.ObjectId,ref:"User",default:null,index:true},
  metadata:{type:mongoose.Schema.Types.Mixed,default:{}},ip:{type:String,default:""},userAgent:{type:String,default:""}
},{timestamps:true,versionKey:false});
schema.index({createdAt:-1});
export default mongoose.model("AuditLog",schema);
