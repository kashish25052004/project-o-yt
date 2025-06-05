import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiErrors.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js";

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


export {registerUser,}

