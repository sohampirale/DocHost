import ApiError from "../helpers/ApiError.js";
import ApiResponse from "../helpers/ApiResponse.js";
import handleApiError from "../helpers/handleApiError.js";
import { generateUserAccessToken } from "../helpers/token.js";
import Instance from "../models/instance.model.js";

export async function signupInstanceController(req:Request,res:Response){
  try {
    const {username,password,labName,opearatingSystem,maxContainers}=req.body;

    const existingInstance=await Instance.findOne({
      username
    })

    if(!existingInstance){
      throw new ApiError(409,"Instance with that name already exists")
    }

    const instance = await Instance.create({
      username,
      password,
      labName,
      opearatingSystem,
      maxContainers
    })

    if(!instance){
      throw new ApiError(500,"Failed to signup the instance")
    }


    const payload={
      _id:instance._id,
      username:instance.username
    }

    const accessToken = generateUserAccessToken(payload)

    return res
    .status(201)
    .json(
      new ApiResponse(true,"Instance signed up successfully",{
        accessToken
      })
    )
  } catch (error) {
    return handleApiError(res,error)
  }
}