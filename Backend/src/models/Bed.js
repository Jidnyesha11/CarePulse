import mongoose from "mongoose";
const schema = new mongoose.Schema({
  ward:{type:String,required:true},bedNumber:{type:String,required:true},
  type:{type:String,enum:["general","icu","private","semi_private"],default:"general"},
  status:{type:String,enum:["available","occupied","maintenance"],default:"available",index:true},
  patient:{type:mongoose.Schema.Types.ObjectId,ref:"User",default:null},admittedAt:{type:Date,default:null}
},{timestamps:true,versionKey:false});
schema.index({ward:1,bedNumber:1},{unique:true});
export default mongoose.model("Bed",schema);
