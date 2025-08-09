import mongoose from "mongoose";

export default async function connectDB(){
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('DB conncted successfully');
  } catch (error) {
    console.log('Failed to connect DB');
    throw error;
  }
}