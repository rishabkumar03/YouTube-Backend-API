import mongoose from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"
import { Comment } from "../models/comment.model.js"
import { Tweet } from "../models/tweet.model.js"
import { User } from "../models/user.model.js"

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
            new ApiResponse(200, { liked: false}, "Comment Uniked Successfully")
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
            new ApiResponse(200, { liked: true, likeData: newLikedComment }, "Comment Liked Successfully" )
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
            new ApiResponse(200, { liked: false}, "Tweet Unliked Successfully")
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
            new ApiResponse(200, { liked: true, likedData: newLikedTweet}, "Tweet Liked Successfully")
        )
    }
})

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos

    const {userId} = req.params
    const {page = 1, limit = 10} = req.query

    if (!mongoose.isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid User Id")
    }

    const existingUser = await User.findById(userId) 
    if (!existingUser) {
        throw new ApiError(404, "User does not exist")
    }

    const pipeline = []

    if (userId) {
        pipeline.push({
            $match: {
                likedBy: new mongoose.Types.ObjectId(userId),
                video: { $exists: true }
            }
        })
    }

    pipeline.push({
        $lookup: {
            from: "videos",
            localField: "video",
            foreignField: "_id",
            as: "videoDetails"
        }
    })

    //  $unwind expects an array, Using $unwind on a non-array field will likely cause your aggregation pipeline to fail
    pipeline.push({
        $unwind: {
            path: "$videoDetails",
            preserveNullAndEmptyArrays: false
        }
    })

    pipeline.push({
        $match: {
            "videoDetails.isPublished": true
        }
    })

    pipeline.push({
        $lookup: {
            from: "users",
            localField: "videoDetails.owner",
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
    },
    {
        $addFields: {
            "videoDetails.owner" : {
                $first: "$ownerDetails"
            }
        }
    })

    pipeline.push({
        $project: {
            video: "$videoDetails",
            createdAt: 1
        }
    })

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const countPipeline = [...pipeline]
    countPipeline.push({ $count: "totalLikedVideos" })

    pipeline.push({ $skip: skip })
    pipeline.push({ $limit: parseInt(limit) })

    try {
        const [likedVideos, countResult] = await Promise.all([
            Like.aggregate(pipeline),
            Like.aggregate(countPipeline)
        ])
    
        const totalLikedVideos = countResult[0]?.totalLikedVideos || 0
        const totalPages = Math.ceil( totalLikedVideos / limit )
    
        if (!likedVideos || likedVideos.length === 0){
            return res
            .status(200)
            .json(
                new ApiResponse (200, {
                    likedVideos: [],
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: 0,
                        totalLikedVideos: 0,
                        hasPrevPage: false,
                        hasNextPage: false
                    }
                },
                "Liked Videos does not exist"
                )
            )
        }
    
        return res
        .status(200)
        .json(
            new ApiResponse(200, {
                likedVideos,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalLikedVideos,
                    hasPrevPage: page > 1,
                    hasNextPage: page < totalPages
                }
            },
            "Liked Videos fetched successfully"
            )
        )
    } catch (error) {
        throw new ApiError(500, "Something went wrong while fetching liked videos")
    }
})

export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos
}