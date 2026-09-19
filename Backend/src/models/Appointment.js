import mongoose from "mongoose";
const schema = new mongoose.Schema({
  patient:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true,index:true},
  doctor:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true,index:true},
  date:{type:String,required:true,index:true}, timeSlot:{type:String,required:true},
  department:{type:String,required:true}, reason:{type:String,required:true,maxlength:1000},
  status:{type:String,enum:["booked","confirmed","completed","cancelled","no_show"],default:"booked",index:true},
  aiTriage:{department:String,urgency:String,confidence:Number,disclaimer:String},
  notes:{type:String,default:""}
},{timestamps:true,versionKey:false});
schema.index({doctor:1,date:1,timeSlot:1},{unique:true,partialFilterExpression:{status:{$in:["booked","confirmed"]}}});
export default mongoose.model("Appointment",schema);
