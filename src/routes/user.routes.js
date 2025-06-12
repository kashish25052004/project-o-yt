import { Router } from "express";
import { registerUser,loginUser,logoutUser,refreshAccessToken } from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/register").post(
    upload.fields([
        { 
            name: "avatar", 
            maxCount: 1 
        },
        { 
            name: "coverImage", 
            maxCount: 1 
        } 
    ]),
    registerUser
)

router.route("/login").post(loginUser);

//secured routes
router.route("/logout").post(verifyJWT, logoutUser)//here we use verifyJWT middleware to protect the route, so that only logged in users can access it

router.route("/refresh-Token").post(refreshAccessToken);// here we do not use verifyJWT middleware because we are using refresh token to get new access token




export default router;
// ye default export hai, isliye import karte waqt {} nahi lagate