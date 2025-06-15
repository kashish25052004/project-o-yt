import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiErrors.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefereshTokens = async(userId) => {
    try{
       const user =  await User.findById(userId)
       const accessToken = user.generateAcessToken()
       const refreshToken = user.generateRefreshToken()
       //access token toh user ko dedete hai ,per refresh token hum database ko bhi dete hai 
       //accesstoken short time ke liye hota hia, refresh long time ke liye
       user.refreshToken = refreshToken; // store refresh token in user document
       await user.save({validateBeforeSave: false })// skip validation for refreshToken field
        return {accessToken, refreshToken} 


    }catch(error){
        throw new ApiError(500,"something went wrong while generating refresh and access token")

    }

}

const registerUser = asyncHandler(async (req, res) => {
    // res.status(200).json({
    //     message: "ok",
    // }) -- for testing purpose

    // get user details from frontend
    // validation -- not empty
    // check if user already exists : through email or username
    // check for images, check for avatar
    // upload them to cloudinary , avatar
    //creat  user object (bcz nosql database where we have to store in the form of object) -- create entry in db
    // remove password and refresh token from user object (response)
    //check for user creation
    // return response
    // steps hi algorithm hai

    //get data from frontend
    const {fullName, email,username, password } = req.body;
    console.log("email : ", email);
    console.log("username : ", username);
    console.log("password : ", password);

    //validation
    if (!fullName || !email || !username || !password) {
       throw new ApiError(400, "All fields are required");
    }

    //check if user already exists
    const existingUser = await User.findOne({ 
        $or: [
            { email}, // check by email
            { username } // check by username
        ] 
    });
    console.log("existingUser : ", existingUser);

    if(existingUser){
        throw new ApiError(409, "User already exists with this email or username");
    }

    // res.body ka asscess hume express.js se milta hai, jisme hum data bhejte hai
    //res.file ka access hume multer se milta hai, jisme hum images bhejte hai


   //check for images
   
    //upload them to local
    const avatarLocalPath = req.files?.avatar[0]?.path; // assuming multer stores the file path in req.files.avatar[0].path
    // const coverImageLocalPath = req.files?.coverImage[0]?.path; // assuming multer stores the file path in req.files.coverImage[0].path // give undefined error when no cverimage is sent
    
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length >0){
        coverImageLocalPath = req.files.coverImage[0].path;
    }
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar image is required");
    }

    //upload them to cloudinary-- third party service for image storage
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath) ;
    if(!avatar){
        throw new ApiError(400, " avatar image not found");
    }


    //create user object

    const user = await User.create({
        fullName,
        avatar: avatar.url, // cloudinary url
        coverImage: coverImage?.url || "", // cloudinary url
        email,
        password, // password will be hashed in the user model pre-save hook
        username: username.toLowerCase(), // username will be stored in lowercase
    })

    //check for user creation
    // mondo db har ek entry ke sath _ id name ka feild add karta hai

   const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    ); // select all fields except password and refreshToken

    if (!createdUser) {
        throw new ApiError(500, "User creation failed , something went wrong while registering user");
    }

    //return response
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    );


})

const loginUser = asyncHandler(async(req,res) =>{
    //req body se data lenge;
    //username or email
    //find the user
    //password check
    //backend sends access token and refresh token to user
    //through sending cookie
    console.log(req.body)
    const {email,username,password} = req.body

    if(!username || !email){
        if(!username && !email){
            throw new ApiError(400,"username or email is required")
        }

        
    }

   const user =  await User.findOne({
        $or:[{username}, {email}]
    })

    if(!user){
        throw new ApiError(404,"user not exist")
    }

    //here we want userSchema--  so we use user instead of User
    const isPasswordVaild = await user.isPasswordMatch(password)

    if(!isPasswordVaild){
        throw new ApiError(401,"invalid user credentials , password wrong")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpsOnly: true,
        secure: true,
    }
    //cookies ko by default koi bhi modify kar sakta hai -- frontend per but ye krne se ye cookies sirf server se modify hoti hai
    return res.status(200)
    .cookie("accessToken",accessToken, options) // key:value pair
    .cookie("refreshToken", refreshToken,options) // key:value pair
    .json(
        new ApiResponse(200,{user:loggedInUser,accessToken,refreshToken},"user logged in successfully")
         
    )





})

const logoutUser = asyncHandler(async(req,res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            // mongo db operator 
            $set:{
                refreshToken:undefined // set refresh token to undefined
            }
        },
        {
            new: true, // return the updated user
           
        }
    )

     const options = {
        httpsOnly: true,
        secure: true,
    }

    return res.status(200)
    .clearCookie("accessToken", options) // clear access token cookie
    .clearCookie("refreshToken", options) // clear refresh token cookie 
    .json(
        new ApiResponse(200, {}, "User logged out successfully")
    )





})

// refresh access token
//for refresh the access token 
//access token short time ke liye hota hai, refresh token long time ke liye hota hai
// so we can use refresh token to get new access token
const refreshAccessToken = asyncHandler(async(req,res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken; // get refresh token from cookies
    if(!incomingRefreshToken){
        throw new ApiError(401,"refresh token is required , unauthorized request")

    }

    try {
        const decodeToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
    
        const user  = await User.findById(decodeToken?._id)
    
        if(!user){
            throw new ApiError(404,"user not found , please login again , Invalid refresh token")
        }
    
        //match the incoming refresh token which is given by user with the one stored in database
        if(user?.refreshToken !== incomingRefreshToken){
            throw new ApiError(401,"Invalid refresh token, please login again, refresh token is expired or used")
    
        }
    
        //generate new access and refresh token
        const options= {
            httpsOnly: true,
            secure: true,
        }
    
        const {accessToken, newRefreshToken}=await generateAccessAndRefereshTokens(user._id)
    
        return res.status(200)
        .cookie("accessToken", accessToken, options) // set new access token cookie
        .cookie("refreshToken", newRefreshToken, options) // set new refresh token cookie  
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken:newRefreshToken},
                "Access token refreshed successfully"
            )
    
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Something went wrong while refreshing access token")
        
    }


})

const changeCurrentPassword = asyncHandler(async(req,res) => {
    // rout main hi jwt verify se pata laga lenge ki voh user already loged in hai ya nhi hai , ya cookies hai ya nhi -->vaha middle ware auth use hoga
    const {oldPassword, newPassword} = req.body;


    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordMatch(oldPassword)
    if(!isPasswordCorrect){
        throw new ApiError(400, "Old password is incorrect");
    }

    user.password = newPassword; // set new password
    await user.save({validateBeforeSave: false}) // skip validation for password field
    //baki ke validation main run nhi karna chahte hain, kyuki password ko hash karne ka kaam user model main hai

    return res.status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))



})

const getCurrentUser = asyncHandler(async(req,res) => {
    // get current user from req.user
    return res.status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"))
})

//agar file update karna ho toh kabhi bhi ek sath mat karna alag se ushi file ko update karwana , sirf aur sirf ushi file ko
const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {fullName , email} = req.body;
    if(!fullName || !email){
        throw new ApiError(400,"All fields are required")
    }

     const user= await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName: fullName,
                email: email
            }
        },
        {new: true} // returns the updated user
     ).select("-password")

     return res
     .status(200)
     .json(new ApiResponse(200,user,"account details updated successfully"))

})

const updateUserAvatar = asyncHandler(async(req,res)=>{
   //sirf ek file leni hai isiliye file
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400,"avatar file is missing")

    }

   const avatar =  await uploadOnCloudinary(avatarLocalPath)
   //avatar-->object
   if(!avatar.url){
    throw new ApiError(400,"error while uploading on avatar")

   }

   const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
        $set:{
            avatar : avatar.url
        }
    },
    {new:true}
   ).select("-password")

   return res.status(200)
   .json(
    new ApiResponse(200,user,"avatar image uploaded successfully")
   )

})

const updateUserCoverImage = asyncHandler(async(req,res)=>{
   //sirf ek file leni hai isiliye file
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(400,"coverimage file is missing")

    }

   const coverImage =  await uploadOnCloudinary(avatarLocalPath)
   //avatar-->object
   if(!coverImage.url){
    throw new ApiError(400,"error while uploading on coverImage")

   }

   const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
        $set:{
            coverImage : coverImage.url
        }
    },
    {new:true}
   ).select("-password")

   return res.status(200)
   .json(
    new ApiResponse(200,user,"coverImage image uploaded successfully")
   )

})

const getUserChannelProfile = asyncHandler(async(req,res)=>{
    const {username} = req.params // url

    if(!username?.trim()){
        throw new ApiError(400,"username is missing!!")

    }

    const channel = await User.aggregate([
        {
            $match:{
                username : username?.toLowerCase()
            }
        },

        {
            $lookup:{
                from: "subscriptions", // mongo db main modle ka name lower case + plural main save hota hai
                localField: "_id",
                foreignField: "channel",
                as: "subscribers" // is field main channel+subscriber dono ek doc main rahenge , aur bohot sare doc banenge
            }
        },

        {
            $lookup:{
                from: "subscriptions", // mongo db main modle ka name lower case + plural main save hota hai
                localField: "_id",
                foreignField: "subscriber",
                as: "subscriberedTo" // is field main channel+subscriber dono ek doc main rahenge , aur bohot sare doc banenge
            }
        },

        { // voh jo profile hai uske andar feild add karwana hai
            $addFields:{
                subscribersCount:{
                    $size : "$subscribers" // $ bcz -->subscribers bhi aab ek field hai
                },

                channelsSubscribedToCount: {
                    $size: "$subscriberedTo"
                },

                isSubscribed: {
                    $cond: {
                        if: {$in:[req.user?._id,"$subscribers.subscriber"]},
                        then: true,
                        else: false 

                    }
                }
            } 
        },

        {
            // project ke undar --> hum voh likhnge jo humko return karna hai

            $project:{
                fullName:1,
                username:1,
                subscribersCount:1,
                channelsSubscribedToCount:1,
                email:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1
            }

        }
    ]) //  gives array in which object is there

    if(!channel?.length){
        throw new ApiError(400 ,"channel does not exist"

        )
    }

    return res.status(200)
    .json(new ApiResponse(200,channel[0],"user Channel fetched successfully"))

})

const getWatchHistory = asyncHandler(async(req,res) =>{
    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)

            }
        },

        {
            $lookup:{
                 // aabhi tum user pr hoo 
                 //yaha hum user model main watchHistory field ko video model main _id se match karte hai
                from: "videos", // mongo db main modle ka name lower case + plural main save hota hai 
                localField: "watchHistory", // user model main watchHistory field hai
                foreignField: "_id", // video model main _id field hai
                as: "watchHistoryVideos", // is field main watchHistory+videos dono ek doc main rahenge , aur bohot sare doc banenge
                pipeline:[
                    {
                        $lookup:{
                            //yaha hum video model main owner field ko user model main _id se match karte hai
                            from: "users", // mongo db main modle ka name lower case + plural main save hota hai
                            localField: "owner", // video model main owner field hai
                            foreignField: "_id", // user model main _id field hai
                            as: "owner", // is field main owner+user dono ek doc main rahenge , aur bohot sare doc banenge
                            pipeline:[
                                {
                                    $project:{
                                        fullName: 1,
                                        username:1,
                                        avatar:1
                                    }
                                }
                            ]


                        }
                    },
                     
                    // owner feild jo mili voh ek array main hai, usko hum first element se access karenge
                    {
                        $addFields:{
                            owner:{
                            $first: "$owner" // is used to get the first element of the array
                            }
                        }
                    }
                ]


            }
        }
    ])

    return res.status(200)
    .json(new ApiResponse(200,user[0]?.watchHistoryVideos || [],"Watch history fetched successfully"))
})



export {registerUser,loginUser, logoutUser,refreshAccessToken,changeCurrentPassword,getCurrentUser,updateAccountDetails,updateUserAvatar,updateUserCoverImage,getUserChannelProfile,getWatchHistory} // export all functions so that we can use them in routes

