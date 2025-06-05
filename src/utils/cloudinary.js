import {v2 as cloudinary} from 'cloudinary';
//v2 is the latest version of Cloudinary's Node.js SDK
//sdk is used to interact with Cloudinary's services
// full form of sdk is Software Development Kit
// This SDK allows you to upload, manage, and manipulate media files in Cloudinary.
import fs from "fs"
//fs is the Node.js file system module, which allows you to work with the file system on your computer.
//unlike in fs is used to read and write files on your local machine, cloudinary is used to upload and manage files in the cloud.

 //Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME ,
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

    const uploadOnCloudinary = async (localFilePath) =>{
        try{
            if(!localFilePath) return null;
            //upload the file on cloudinary
            const response = await cloudinary.uploader.upload(localFilePath,{
                resource_type: "auto" // This allows Cloudinary to automatically determine the resource type (image, video, etc.)
            })
            //file is uploaded successfully
            // console.log("File uploaded successfully:", response.url); --> for testing purposes
            fs.unlinkSync(localFilePath); // Delete the local file after upload to save space
            return response;

        }catch(error){
            fs.unlinkSync(localFilePath); // Delete the local file if upload fails
            return null; // Return null if there is an error


        }
    }

    export {uploadOnCloudinary}