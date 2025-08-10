import { Router } from "express";
import ApiResponse from "../helpers/ApiResponse.js";
import ApiError from "../helpers/ApiError.js";
import { generateInstanceAccessToken } from "../helpers/token.js";
import { signinInstanceController, signupInstanceController } from "../controllers/instance.controllers.js";
const instanceRouter = Router();

instanceRouter.route("/signup")
  .post(signupInstanceController)

instanceRouter.route("/signin")
  .post(signinInstanceController)

export default instanceRouter;