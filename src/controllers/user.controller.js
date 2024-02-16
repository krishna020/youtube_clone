import { asyncHandler } from "../utils/asyncHandler.js"
import {ApiError}  from '../utils/apiError.js'
import User from "../models/user.model.js"
import cloudnaryUploader from "../utils/cloudnary.js"
import ApiResponse from "../utils/apiResponse.js"


const registerUser=asyncHandler(async (req,res)=>
{
  // get user details from customer.
  // vaidation
  // check user already exist. username and email
  //check for profile and avatar
  // upload then to cloudnary
  //create user object
  //remove password and refress token field from userdetails.
  // check for user creation
  // return res.

  
const {userName,email,fullName,password,confirm_password}=req.body


if(!userName|| !email || !fullName || !password || !confirm_password)
{
    throw new ApiError(400,"All fields are requireds..!") 
}

const userExists=User.findOne({$or:[{userName:userName}, {email:email}]})
if(userExists)
{
    throw new ApiError(409,"user already exists")
}

const avatarLocalPath=req.files?.avatar[0]?.path
const coverImageLocalPath=req.files?.coverImage[0]?.path
if(avatarLocalPath)
{
    throw new ApiError(400, "Avatar fields is required..!")
}

if(password!==confirm_password)
{
    throw new ApiError(400,"password and confirm password does not matched")
}

const avatar = await cloudnaryUploader(avatarLocalPath)
const coverImage = await cloudnaryUploader(coverImageLocalPath)

if(!avatar)
{
    throw new ApiError(400, "Avatar fields is required..!")  
}

const createdUser=await User.create({
    userName:userName.lowercase(),
    fullName,
    avatar:avatar.url,
    coverImage:coverImage?.url || "",
    email,
    password    
})

const user= User.findById({_id:createdUser._id}).select("-password -refressToken")
if(!user)
{
    throw new ApiError(500, "something went wrong during registering user")
}

 return res.status(201).json(
    new ApiResponse(200,user,"user successfully created")
 )





})

export {registerUser}