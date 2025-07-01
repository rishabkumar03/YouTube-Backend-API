import mongoose from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"
import { Comment } from "../models/comment.model.js"
import { Tweet } from "../models/tweet.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video Id")
    }

    const existingVideo = await Video.findById(videoId)
    if (!existingVideo) {
        throw new ApiError(404, "Video does not exist")
    }

    const existingLike = await Like.findOne({
        likedBy: req.user._id,
        video: videoId
    })

    if (existingLike) {
        // Unlike
        await Like.findByIdAndDelete(existingLike._id)

        return res
        .status(200)
        .json(
            new ApiResponse(200, { liked : false }, "Video Unliked Successfully")
        )
    }

    else {
        const newLikedVideo = await Like.create({
            likedBy: req.user._id,
            video: videoId
        })

        return res
        .status(200)
        .json(
            new ApiResponse(200, { liked : true, likeData : newLikedVideo }, "Video Liked Successfully")
        )
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment

    if (!mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid Comment Id")
    }

    const existingComment = await Comment.findById(commentId)
    if (!existingComment) {
        throw new ApiError(404, "Comment does not exist")
    }

    const existingLike = await Like.findOne({
        likedBy: req.user._id,
        comment: commentId
    })

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id)
        return res
        .status(200)
        .json(
            new ApiResponse(200, { liked: false}, "Comment uniked successfully")
        )
    }

    else {
        const newLikedComment = await Like.create({
            likedBy: req.user._id,
            comment: commentId
        })

        return res
        .status(200)
        .json(
            new ApiResponse(200, { liked: true, likeData: newLikedComment }, "Comment liked successfully" )
        )
    }
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet

    if (!mongoose.isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid Tweet Id")
    }

    const existingTweet = await Tweet.findById(tweetId) 
    if (!existingTweet) {
        throw new ApiError(404, "Tweet does not match")
    }

    const existingLike = await Like.findOne({
        likedBy: req.user._id,
        tweet: tweetId
    })

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id)
        return res
        .status(200)
        .json(
            new ApiResponse(200, { liked: false}, "Tweet unliked successfully")
        )
    }

    else {
        const newLikedTweet = await Like.create({
            likedBy: req.user._id,
            tweet: tweetId
        })

        return res
        .status(200)
        .json(
            new ApiResponse(200, { liked: true, likedData: newLikedTweet}, "Tweet liked successfully")
        )
    }
})

export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike
}