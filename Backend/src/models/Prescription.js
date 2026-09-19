import mongoose from "mongoose";
const medicine = new mongoose.Schema({
  name:{type:String,required:true}, dosage:{type:String,required:true},
  frequency:{type:String,required:true}, duration:{type:String,required:true},
  instructions:{type:String,default:""}
},{_id:false});
const schema = new mongoose.Schema({
  patient:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true,index:true},
  doctor:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},
  appointment:{type:mongoose.Schema.Types.ObjectId,ref:"Appointment",required:true},
  medicines:{type:[medicine],required:true}, notes:{type:String,default:""},
  verificationCode:{type:String,unique:true,index:true,required:true}, qrDataUrl:{type:String,default:""}
},{timestamps:true,versionKey:false});
export default mongoose.model("Prescription",schema);
