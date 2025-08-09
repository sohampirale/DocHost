import Instance from "../models/instance.model.js";
import User from "../models/user.model.js";

export async function createUser(username:string,email:string,password:string){
  try {
    const user=await User.create({
      username,
      email,
      password
    })

    console.log('User created successfully : ',user);
  } catch (error) {
    console.log('Failed to create user : ',error);
  }
}

export async function createInstance(username:string,password:string){
  try {
    const instance=await Instance.create({
      username,
      password
    })

    console.log('Instance created successfully : ',instance);
  } catch (error) {
    console.log('Failed to create instance : ',error);
  }
}