import type { Request, Response } from "express";
import ApiError from "../helpers/ApiError.js";
import ApiResponse from "../helpers/ApiResponse.js";
import handleApiError from "../helpers/handleApiError.js";
import { generateUserAccessToken } from "../helpers/token.js";
import User from "../models/user.model.js";

export async function userSignupController(req:Request, res:Response){

  const { username, email, password } = req.body;
  
  try {
    const existingUser = await User.findOne({
      $or: [{
        username
      }, {
        email
      }]
    })

    if (existingUser) {
      throw new ApiError(409, "User already exists with requested email or username")
    }

    const user = await User.create({
      username,
      email,
      password
    })

    if (!user) {
      throw new ApiError(500, "Failed to create the user")
    }

    const payload = {
      _id: user._id,
      username: user.username,
      email: user.email,
      instances: user.instances
    }

    const accessToken = generateUserAccessToken(payload);
    console.log('signup successful token : ', accessToken);

    return res
      .cookie("accessToken", accessToken, {
        httpOnly: true,       
        secure: true,
        sameSite: "none"
      })
      .status(201)
      .json(
        new ApiResponse(true, "User created successfully")
      )

  } catch (error: unknown) {
    return handleApiError(res, error)
  }
}