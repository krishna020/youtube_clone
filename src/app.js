import express, { urlencoded } from "express";
import cors from 'cors'
import cookieParser from "cookie-parser";

const app=express();
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true

}))
app.use(express.json({limit:"16kb"})) // want json type data with max 16kb length
app.use(urlencoded({extended:true, limit:"16kb"})) // want to parse url string 
app.use(express.static("public"))  // use single or double
app.use(cookieParser())

export default app;