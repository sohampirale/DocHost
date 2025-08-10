import ApiError from "../helpers/ApiError.js";
import ApiResponse from "../helpers/ApiResponse.js";
import handleApiError from "../helpers/handleApiError.js";
import { generateInstanceAccessToken, generateUserAccessToken } from "../helpers/token.js";
import Instance from "../models/instance.model.js";

export async function signupInstanceController(req,res){
  try {
    const {username,password,labName,opearatingSystem,maxContainers}=req.body;

    const existingInstance=await Instance.findOne({
      username
    })

    if(existingInstance){
      throw new ApiError(409,"Instance with that username already exists")
    }

    const instance = await Instance.create({
      username,
      password,
      labName,
      opearatingSystem,
      maxContainers
    })

    if(!instance){
      throw new ApiError(500,"Failed to register the instance")
    }

    const payload={
      _id:instance._id,
      username:instance.username
    }
    
    const DOCKHOST_API_KEY = generateUserAccessToken(payload)
    instance.API_KEY=DOCKHOST_API_KEY;
    await instance.save()

    return res
      .status(201)
      .json(
        new ApiResponse(true,"Instance signed up successfully",{
          DOCKHOST_API_KEY
        })
      )

  } catch (error) {
    return handleApiError(res,error)
  }
}

export async function signinInstanceController(req,res){
    const { username, password } = req.body;
    try {
      const existingInstance = await Instance.findOne({
        username
      })

      if (!existingInstance) {
        throw new ApiError(404, "Instance not found")
      } else if (!await existingInstance.comparePassword(password)) {
        throw new ApiError(400, "Incorrect password")
      }
      
      let DOCKHOST_API_KEY = existingInstance.API_KEY
      
      if(!DOCKHOST_API_KEY){
        const payload = {
          _id: existingInstance._id,
          username: existingInstance.username,
        }
        DOCKHOST_API_KEY=generateInstanceAccessToken(payload);
        existingInstance.API_KEY=DOCKHOST_API_KEY;
        await existingInstance.save()
      }

      console.log('login successfull');
      
      return res.status(200)
        .json(new ApiResponse(true, "Login successfully",{
          DOCKHOST_API_KEY
        }))

    } catch (error: unknown) {
      return handleApiError(res, error)
    }
}