import ApiError from "./ApiError.js";
import ApiResponse from "./ApiResponse.js";

export default function handleApiError(res:any,error:unknown){
  console.log('ERROR : ',error);
  
  if(error instanceof ApiError){
    return res.status(error.status).json(
      new ApiResponse(false,error.message)
    )
  }
  return res.status(500).json(
    new ApiResponse(false,"Somethign went wrong")
  )
}