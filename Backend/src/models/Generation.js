import mongoose from "mongoose";
const schema = new mongoose.Schema({
  actor:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true,index:true},
  patient:{type:mongoose.Schema.Types.ObjectId,ref:"User",default:null},
  prompt:{type:String,required:true,maxlength:10000},result:{type:String,required:true,maxlength:50000},
  type:{type:String,default:"general"},model:{type:String,required:true}
},{timestamps:true,versionKey:false});
export default mongoose.model("Generation",schema);
