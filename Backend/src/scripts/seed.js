import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import {env} from "../config/env.js";
import User from "../models/User.js";
import DoctorProfile from "../models/DoctorProfile.js";
import PatientProfile from "../models/PatientProfile.js";
import Bed from "../models/Bed.js";
await mongoose.connect(env.mongoUri);
await User.deleteMany({email:{$in:["admin@carepulse.local","doctor@carepulse.local","patient@carepulse.local"]}});
const pass=s=>bcrypt.hash(s,12);
const [admin,doctor,patient]=await User.create([
 {name:"CarePulse Admin",email:"admin@carepulse.local",password:await pass("Admin@12345"),role:"admin"},
 {name:"Dr. Maya Sharma",email:"doctor@carepulse.local",password:await pass("Doctor@12345"),role:"doctor"},
 {name:"Aarav Patient",email:"patient@carepulse.local",password:await pass("Patient@12345"),role:"patient"}
]);
await DoctorProfile.create({user:doctor._id,department:"Cardiology",specialization:"Preventive Cardiology",licenseNumber:`CP-${Date.now()}`,consultationFee:800,experienceYears:8});
await PatientProfile.create({user:patient._id,bloodGroup:"O+"});
await Bed.deleteMany({});await Bed.insertMany([{ward:"General",bedNumber:"G-101"},{ward:"General",bedNumber:"G-102"},{ward:"ICU",bedNumber:"I-201",type:"icu"},{ward:"Private",bedNumber:"P-301",type:"private"}]);
console.log("Seed complete");await mongoose.disconnect();
