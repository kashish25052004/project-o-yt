import { Router } from "express";
import { registerUser,loginUser,logoutUser,refreshAccessToken,changeCurrentPassword, getCurrentUser, updateAccountDetails, getUserChannelProfile, updateUserAvatar, updateUserCoverImage, getWatchHistory } from "../controllers/user.controllers.js";
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

router.route("/change-password").post(verifyJWT,changeCurrentPassword)
router.route("/current-user").get(verifyJWT,getCurrentUser)
router.route("/update-account").patch(verifyJWT,updateAccountDetails)

router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)// here we use upload.single("avatar") middleware to upload single file with field name "avatar";


router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)// here we use upload.single("coverImage") middleware to upload single file with field name "coverImage";

router.route("/c/:username").get(verifyJWT,getUserChannelProfile)

router.route("/history").get(verifyJWT,getWatchHistory)


export default router;
// ye default export hai, isliye import karte waqt {} nahi lagate