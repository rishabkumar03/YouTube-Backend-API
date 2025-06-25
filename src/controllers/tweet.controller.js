import mongoose from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet

    const{ content } = req.body

    if(!content) {
        throw new ApiError(400, "Content field is required")
    }

    const tweet = await Tweet.create({
        owner: req.user._id,
        content: content.trim()
    })

    const uploadedTweet = await Tweet.findById(tweet._id)
    .populate(
        "owner",
        "username fullname avatar"
    )

    console.log("Tweet has been uploaded", uploadedTweet);
    
    if(!uploadedTweet){
        throw new ApiError(500, "Something went wrong")
    }

    return res
    .status(201)
    .json(
        new ApiResponse(200, uploadedTweet, "Tweet uploaded successfully")
    )
})

// const getUserTweets = asyncHandler(async (req, res) => {
//     // TODO: get user tweets
// })

// const updateTweet = asyncHandler(async (req, res) => {
//     //TODO: update tweet
// })

// const deleteTweet = asyncHandler(async (req, res) => {
//     //TODO: delete tweet
// })

export {
    createTweet
}