import { Router } from "express";
import User from "../models/user.model.js";
import ApiResponse from "../helpers/ApiResponse.js";
import ApiError from "../helpers/ApiError.js";
import { generateUserAccessToken } from "../helpers/token.js";
import handleApiError from "../helpers/handleApiError.js";
import { userSignupController } from "../controllers/user.controllers.js";
const userRouter = Router();

userRouter.route("/signup")
  .post(userSignupController)

userRouter.route("/signin")
  .post(async (req, res) => {
    const { username, password } = req.body;
    try {
      const existingUser = await User.findOne({
        username
      })

      if (!existingUser) {
        throw new ApiError(404, "User not found")
      } else if (!await existingUser.comparePassword(password)) {
        throw new ApiError(400, "Incorrect password")
      }
      const paylod = {
        _id: existingUser._id,
        username: existingUser.username,
        email: existingUser.email,
        instances: existingUser.instances
      }
      const accessToken = generateUserAccessToken(paylod)

      console.log('login successfull');
      
      return res.status(200)
        .cookie("accessToken", accessToken)
        .json(new ApiResponse(true, "Login successfully"))

    } catch (error: unknown) {
      return handleApiError(res, error)
    }
  })

export default userRouter;