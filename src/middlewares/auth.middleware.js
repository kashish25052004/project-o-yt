import { ApiError } from "../utils/ApiErrors.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js"; 


const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        //request ke pass cookies hote hai, unme se token nikalte hai
        // app.js main tumne app.use(cookieParser()) kiya hai
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        if(!token){
            throw new ApiError(401, "Access token is required, unauthorized request");
        }
        //token ko verify karte hai
        //jwt.verify(token, secretKey)
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
       const user=  await User.findById(decodedToken?._id).select("-password -refreshToken")
       if(!user){
        throw new ApiError(401, "User not found, unauthorized request, Invalid access token");
    
       }
    
       req.user = user; // attaching user to request object
        next(); // call next middleware or route handler
    } catch (error) {
        throw new ApiError(401, error.message || "Unauthorized request, Invalid access token");
        
        
    }
    

})

export {verifyJWT};