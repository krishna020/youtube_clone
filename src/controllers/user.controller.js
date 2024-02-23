import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from '../utils/apiError.js'
import User from "../models/user.model.js"
import cloudnaryUploader from "../utils/cloudnary.js"
import ApiResponse from "../utils/apiResponse.js"


const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}


const registerUser = asyncHandler(async (req, res) => {
    // get user details from customer.
    // vaidation
    // check user already exist. username and email
    //check for profile and avatar
    // upload then to cloudnary
    //create user object
    //remove password and refress token field from userdetails.
    // check for user creation
    // return res.


    const { userName, email, fullName, password, confirmPassword } = req.body


    if (!userName || !email || !fullName || !password || !confirmPassword) {
        throw new ApiError(400, "All fields are requireds..!")
    }

    //console.log('confirm password...'+confirmPassword)

    const userExists = await User.findOne({ $or: [{ userName: userName }, { email: email }] })
    if (userExists) {
        throw new ApiError(409, "user already exists")
    }

    //console.log('req.file  37....'+req.files?.avatar[0]?.path)

    const avatarLocalPath = req.files?.avatar[0]?.path
    //console.log("avatarLocalPath......"+avatarLocalPath)
    const coverImageLocalPath = req.files?.coverImage[0]?.path
    //console.log("coverImageLocalPath......."+coverImageLocalPath)
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar fields is required..!")
    }

    if (password !== confirmPassword) {
        throw new ApiError(400, "password and confirm password does not matched")
    }

    console.log('all is good till 49')

    const avatarData = await cloudnaryUploader(avatarLocalPath)
    const coverImageData = await cloudnaryUploader(coverImageLocalPath)

    if (!avatarData) {
        throw new ApiError(400, "Avatar fields is required..!")
    }


    console.log("avatar.secure_url......." + avatarData.url)

    const createdUser = await User.create({
        userName: userName,
        fullName,
        avatar: avatarData.url,
        coverImage: coverImageData?.url || "",
        email,
        password
    })


    const user = await User.findById({ _id: createdUser._id }).select("-password -refressToken")

    if (!user) {
        throw new ApiError(500, "something went wrong during registering user")
    }

    return res.status(201).json(
        new ApiResponse(200, user, "user successfully created")
    )





})

//login api

const userLogin = asyncHandler(async (req, res) => {
    const { userName, email, password } = req.body

    if (!userName || !email) {
        throw new ApiError(400, "username or password required..!")
    }
    const userDetails = await User.findOne({ $or: [{ email: email }, { userName: userName }] })
    if (!userDetails) {
        throw new ApiError(404, "user does not exists.")
    }
    const isPassword= await userDetails.isPasswordCorrect(password)

    if(isPassword)
    {
        throw new ApiError(400, "password does not matched..")  
    }

    const {accessToken,refreshToken}=await generateAccessAndRefereshTokens(userDetails._id)
    const loggedUser=await User.findById(userDetails._id).select(" -password -refressToken")

    const options={
        httpOnly:true,
        secure:true
    }
    return res
    .status(200)
    .cookie("accessToken", accessToken,options)
    .cookie("refressToken", refreshToken,options)
    .json(
        new ApiResponse(200,{user:loggedUser,refreshToken,accessToken},"user login successfully..!")
    )

})

// logout api
const logOut= asyncHandler(async()=>
{
       
})

export { registerUser, userLogin }