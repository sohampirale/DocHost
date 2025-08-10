import mongoose from "mongoose";
import User from "../models/user.model.js";

export async function getUserWithId(_id:string){
  try {
    const user = await User.findOne({
      _id
    }).select("-password")
    return user;
  } catch (error) {
    return null;
  }
}

export async function getAllInstancesOfUserWithId(_id:string){
  try {
    const user=await User.aggregate([
      {
        $match:{
          _id:new mongoose.Types.ObjectId(_id)
        }
      },{
        $lookup:{
          from:"instances",
          localField:"instances",
          foreignField:"_id",
          as:"allMyInstances"
        }
      }
    ])

    if(user.length>0){
      return user[0].allMyInstances;
    }
    return []
  } catch (error) {
    return [];
  }
}