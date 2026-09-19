import mongoose from "mongoose";
const schema = new mongoose.Schema({
  user:{type:mongoose.Schema.Types.ObjectId,ref:"User",unique:true,required:true,index:true},
  department:{type:String,required:true}, specialization:{type:String,required:true},
  licenseNumber:{type:String,required:true,unique:true}, consultationFee:{type:Number,default:0},
  experienceYears:{type:Number,default:0}, bio:{type:String,default:""},
  workingHours:{start:{type:String,default:"09:00"},end:{type:String,default:"17:00"}},
  slotMinutes:{type:Number,enum:[15,30,45,60],default:30}
},{timestamps:true,versionKey:false});
export default mongoose.model("DoctorProfile",schema);
