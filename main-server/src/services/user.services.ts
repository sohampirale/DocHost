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