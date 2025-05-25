// npm run dev -- > in package.json - >script -> nodemon src/index.js 


import connectDB from "./db/index.js";
import dotenv from "dotenv";
dotenv.config({
    path: './env' 
})

connectDB()













// aproch first we will connect to the database and then start the server within the same folder 

/*

import mongoose from "mongoose";

import {DB_NAME} from "./constants.js";
import express from "express"; 
const app = express();
( async ()=>{
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        app.on("error", (err) => {
            console.error("MongoDB connection error:", err);
            throw err;
        });

        app.listen(process.env.Port, () => {
            console.log(`Server is running on port ${process.env.Port}`);
        })

    }catch(err){
        console.log("Error connecting to MongoDB:", err);
        throw err;
    }
    
})()
   
*/



