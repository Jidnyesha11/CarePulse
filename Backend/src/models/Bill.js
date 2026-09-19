import mongoose from "mongoose";
const item = new mongoose.Schema({description:String,quantity:{type:Number,default:1},unitPrice:{type:Number,default:0}},{_id:false});
const schema = new mongoose.Schema({
  patient:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true,index:true},
  appointment:{type:mongoose.Schema.Types.ObjectId,ref:"Appointment",required:true,unique:true},
  items:{type:[item],required:true},subtotal:Number,tax:{type:Number,default:0},total:Number,
  status:{type:String,enum:["unpaid","paid","cancelled"],default:"unpaid",index:true},paymentReference:{type:String,default:""}
},{timestamps:true,versionKey:false});
export default mongoose.model("Bill",schema);
