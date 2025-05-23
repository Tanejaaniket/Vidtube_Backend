import jwt from "jsonwebtoken";
import {asyncHandler} from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.models.js";

const verifyToken = asyncHandler(async (req, res, next) => { 
  
  //* You can study more about headers
  try {
    const token = req.cookies.accessToken || req.header("Authorization").replace("Bearer ", "");
    if (!token) throw new ApiError(401, "Access token is required");
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id)
      .select("-password -refreshToken");
    if(!user) throw new ApiError(401, "Invalid access token");
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, "Invalid access token", error);
  }

})

export { verifyToken }