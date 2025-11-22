
import ApiResponse from "../utils/ApiResponse.js";

const healthCheck = (req,res,status)=>{
  res.status(200).json(new ApiResponse(200,"Success",{}))
}

export {healthCheck}