import mongoose from "mongoose";
const schema = new mongoose.Schema({
  name:{type:String,required:true,trim:true,minlength:2,maxlength:80},
  email:{type:String,required:true,unique:true,lowercase:true,trim:true,index:true},
  password:{type:String,required:true,minlength:8,select:false},
  role:{type:String,enum:["admin","doctor","patient"],default:"patient",index:true},
  phone:{type:String,default:""},
  avatar:{type:String,default:""},
  isActive:{type:Boolean,default:true,index:true},
  failedLoginAttempts:{type:Number,default:0},
  lockedUntil:{type:Date,default:null}
},{timestamps:true,versionKey:false});
export default mongoose.model("User",schema);
