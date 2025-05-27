import express from 'express';
import cors from "cors";
import cookieparser from "cookie-parser";


const app = express();


//use sare ke sare middleware aur configuration main aata hai
app.use(cors({
    origin : process.env.CORS_ORIGIN,
    Credentials : true
}))


//ho sakta hai in form of json aarhi hoo req,res
app.use(express.json({limit: "16kb"}));
//in form of urlencoded aarhi hoo req,res
app.use(express.urlencodede({extended: true,limit: "16kb"}))
//in form of photos something like that aarhi ho
app.use(express.static("public"));
//delailes ja rhi ho in form of cookies
app.use(cookieparser());


export {app}