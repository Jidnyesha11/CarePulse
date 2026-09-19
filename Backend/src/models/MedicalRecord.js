import mongoose from "mongoose";
const schema = new mongoose.Schema({
  patient:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true,index:true},
  doctor:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},
  appointment:{type:mongoose.Schema.Types.ObjectId,ref:"Appointment",required:true,unique:true},
  symptoms:{type:String,required:true}, diagnosis:{type:String,required:true},
  treatmentPlan:{type:String,default:""}, attachments:[{name:String,url:String,publicId:String}]
},{timestamps:true,versionKey:false});
export default mongoose.model("MedicalRecord",schema);
