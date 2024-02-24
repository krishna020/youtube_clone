import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from '../utils/apiError.js'
import User from "../models/user.model.js"
import cloudnaryUploader from "../utils/cloudnary.js"
import ApiResponse from "../utils/apiResponse.js"


const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken =  await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()

        //console.log("accessToken...."+accessToken)
        //console.log("refreshToken...."+refreshToken)

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
    //remove password and refresh token field from userdetails.
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


    const user = await User.findById({ _id: createdUser._id }).select("-password -refreshToken")

    if (!user) {
        throw new ApiError(500, "something went wrong during registering user")
    }

    return res.status(201).json(
        new ApiResponse(200, user, "user successfully created")
    )





})

//login api

const userLogin = asyncHandler(async (req, res) =>{
    // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie

    const {email, userName, password} = req.body
    //console.log(email);

    if (!userName && !email) {
        throw new ApiError(400, "username or email is required")
    }
    
    // Here is an alternative of above code based on logic discussed in video:
    // if (!(username || email)) {
    //     throw new ApiError(400, "username or email is required")
        
    // }

    const user = await User.findOne({
        $or: [{userName}, {email}]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

   const isPasswordValid = await user.isPasswordCorrect(password)

   if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials")
    }

   const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )

})

// logout api
const logOut = asyncHandler(async (req, res) => {
   let data= await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: undefined } }, { new: true })

    console.log("logout user....."+data)

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged Out"))


})

//refress token
const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
            
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})





export { registerUser, userLogin, logOut , refreshAccessToken }