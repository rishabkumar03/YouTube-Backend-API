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

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets

    const { userId } = req.params

    if (userId && !mongoose.isValidObjectId(userId)){
        throw new ApiError(400, "Invalid user ID format")
    }

    if (userId) {
        const existedUser = await User.findById(userId)
        if(!existedUser){
            throw new ApiError(400, "User does not exist")
        }
    }
    
    const pipeline = []
    
    if (userId) {
        pipeline.push({
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        })
    }
    
    pipeline.push({
        $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "ownerDetails",
            pipeline: [
                {
                    $project: {
                        username: 1,
                        fullname: 1,
                        avatar: 1
                    }
                }
            ]
        }
    })
    
    pipeline.push({
        $addFields: {
            owner: {
                $first: "$ownerDetails"
            }
        }
    })
    
    pipeline.push({
        $project: {
            content: 1,
            createdAt: 1,
            updatedAt: 1,
            owner: 1
        }
    })
    
    const tweet = await Tweet.aggregate(pipeline)
    
    return res
    .status(200)
    .json(
        new ApiResponse(200, tweet, "Tweets fetched successfully")
    )
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet

    const { tweetId } = req.params
    const { content } = req.body

    if (!mongoose.isValidObjectId(tweetId)) {
        throw new ApiError(404, "Invalid Tweet Id")
    }

    if (!content) {
        throw new ApiError(404, "Content field is required")
    }

    const existingTweet = await Tweet.findById(tweetId)

    if(!existingTweet) {
        throw new ApiError(404, "Tweet doesn't exist")
    }

    if (existingTweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(404, "Tweet does not match")
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: {
                content,
            }
        },
        {new: true}
    ).populate("owner", "username fullname avatar")

    return res
    .status(200)
    .json(new ApiResponse(200, updatedTweet, "Tweet updated successfully"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet

    const { tweetId } = req.params

    if (!mongoose.isValidObjectId(tweetId)) {
        throw new ApiError(404, "Invalid Tweet Id")
    }

    const existingTweet = await Tweet.findById(tweetId)

    if(!existingTweet) {
        throw new ApiError(404, "Tweet doesn't exist")
    }

    if (existingTweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(404, "Tweet does not match")
    }

    const deletedTweet = await Tweet.findByIdAndDelete(
        tweetId
    )

    return res
    .status(200)
    .json(new ApiResponse(200, deletedTweet, "Tweet deleted successfully"))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}