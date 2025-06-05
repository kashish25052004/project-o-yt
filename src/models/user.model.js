import mongoose ,{Schema} from "mongoose";

import jwt from "jsonwebtoken" // used for generating JWT tokens --> visit jwt.io for more info
import bcrypt from "bcrypt" // used for hashing passwords


const userSchema = new Schema(
    {
        username: {
            type:String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true, // Index for faster search , aur anywhere you want to aaply searshing field you can use index

        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
            
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
            index: true
        },

        avatar: {
            type: String,  // URL of the avatar image , cloudinary url
            required: true
            
        },

        coverImage: {
            type: String,  // URL of the cover image
        
        },

        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video" // Reference to the Video model


            }
        ],

        password: {
            type: String,
            required: [true, "Password is required"],


        },

        refreshToken: {
            type: String
        }


    },{timestamps: true} // Automatically adds createdAt and updatedAt fields

)

// Middleware to hash the password before saving the user
// This is a pre-save hook that runs before the user document is saved to the database
//middleware is a function that runs before or after a certain event in mongoose
// next is a callback function that tells mongoose to continue with the next middleware or save the document
//async -- this is used to handle asynchronous operations, such as hashing the password because it takes time to hash the password
//dont use arrow function here because we need to access the `this` keyword to get the user document
userSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 10) // Hash the password with a salt rounds of 10 
    }
    next()
})

// await bcs crypography is an asynchronous operation, it takes time to compare the password
userSchema.methods.isPasswordMatch = async function (password) {
    return await bcrypt.compare(password, this.password) // Compare the provided password with the hashed password
}

//jwt is a bearer token, it is used to authenticate the user -- like when you login, you get a token that you can use to access protected routes , it is like a key

userSchema.methods.generateAcessToken = function () {
    return jwt.sign(
        { 
            _id: this._id , // Include user ID in the token payload for identification
            email: this.email, 
            username: this.username, 
            fullName: this.fullName
        }, 
        process.env.ACCESS_TOKEN_SECRET, 
        { 
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY 
        }
    ) 

}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        { 
            _id: this._id , // Include user ID in the token payload for identification
            
        }, 
        process.env.REFRESH_TOKEN_SECRET, 
        { 
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY 
        }
    ) 
}

export const User = mongoose.model("User", userSchema)