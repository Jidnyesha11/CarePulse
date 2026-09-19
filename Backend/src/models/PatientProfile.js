import mongoose from "mongoose";
const schema = new mongoose.Schema({
  user:{type:mongoose.Schema.Types.ObjectId,ref:"User",unique:true,required:true},
  dateOfBirth:Date, gender:{type:String,default:"prefer_not_to_say"},
  bloodGroup:{type:String,default:""}, allergies:{type:[String],default:[]},
  emergencyContact:{name:String,phone:String,relation:String},
  insuranceProvider:{type:String,default:""}, insuranceNumber:{type:String,default:""}
},{timestamps:true,versionKey:false});
export default mongoose.model("PatientProfile",schema);
