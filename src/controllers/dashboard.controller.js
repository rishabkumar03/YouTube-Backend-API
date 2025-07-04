import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, createdAt

    const { channelId } = req.params

    if (!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid Channel Id")
    }



    const existingChannel = await User.findById(channelId)
    if (!existingChannel) {
        throw new ApiError(404, "Channel does not exist")
    }
    
    const pipeline = []

    if (channelId) {
        pipeline.push({
            $match : {
                _id: new mongoose.Types.ObjectId(channelId)
            }
        })
    }

    pipeline.push({
        $lookup: {
            from: "videos",
            localField: "_id",
            foreignField: "owner",
            as: "totalVideos",
            pipeline: [
                {
                    $match: {
                        isPublished: true
                    }
                }
            ]
        }
    })

    pipeline.push({
        $lookup: {
            from: "subscriptions",
            localField: "_id",
            foreignField: "channel",
            as: "totalSubscribers"
        }
    })

    pipeline.push({
        $lookup: {
            from: "videos",
            localField: "_id",
            foreignField: "owner",
            as: "videoStats"
        }
    })

    pipeline.push({
        $addFields: {
            totalVideos: { $size : "$totalVideos" },
            totalSubscribers: { $size : "$totalSubscribers" },
            totalViews: { $sum : "$videoStats.views" }
        }
    })

    pipeline.push({
        $project: {
            username:1,
            fullname: 1,
            avatar: 1,
            coverImage: 1,
            createdAt: 1,
            totalVideos: 1,
            totalSubscribers: 1,
            totalViews: 1
        }
    })

    try {
        const [channelStats] = await User.aggregate(pipeline) 
    
        if (!channelStats) {
            throw new ApiError(400, "Unable to fetch channel statistics")
        }
    
        return res
        .status(200)
        .json(
            new ApiResponse(200, channelStats, "Channel statistics fetched successfully")
        )
    } catch (error) {
        throw new ApiError(500, "Something went wrong while fetching channel statistics")
    }
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel

    const { channelId } = req.params

    const { page = 1, limit = 10, sortBy = "desc", sortType = "date"} = req.query

    if (sortBy && !["asc", "desc"].includes(sortBy)) {
        throw new ApiError(400, "sortBy must be either 'asc' or 'desc' ")
    }

    if (sortType && !["date", "views"].includes(sortType)) {
        throw new ApiError(400, "sortType must be either 'date' or 'views'")
    }

    if (!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel Id")
    }

    const existingChannel = await User.findById(channelId)
    if (!existingChannel) {
        throw new ApiError(404, "Channel does not exist")
    }

    const pipeline = []

    pipeline.push({
        $match: {
            owner: new mongoose.Types.ObjectId(channelId),
            isPublished: true
        }
    })

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
        $unwind: {
            path: "$ownerDetails",
            preserveNullAndEmptyArrays: false
        }
    })

    pipeline.push({
        $addFields: {
            owner: "$ownerDetails"
        }
    })

    const sortField = sortType === "date" ? "createdAt" : "views"
    const sortOrder = sortBy === "asc" ? 1 : -1

    pipeline.push({
        $sort: { [sortField]: sortOrder }
    })

    pipeline.push({
        $project: {
            title: 1,
            description: 1,
            videoFile: 1,
            thumbnail: 1,
            duration: 1,
            views: 1,
            isPublished: 1,
            createdAt: 1,
            updatedAt: 1,
            owner: 1
        }
    })

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const countPipeline = [...pipeline]
    countPipeline.push({ $count: "totalVideos" })

    pipeline.push({ $skip: skip })
    pipeline.push({ $limit: parseInt(limit) })

    try {
        const [videos, countResult] = await Promise.all([
            Video.aggregate(pipeline),
            Video.aggregate(countPipeline)
        ])
    
        const totalVideos = countResult[0]?.totalVideos || 0
        const totalPages = Math.ceil(totalVideos / limit)
    
        if (!videos || videos.length === 0) {
            return res
            .status(200)
            .json(
                new ApiResponse(200, {
                    videos: [],
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: 0,
                        totalVideos: 0,
                        hasPrevPage: false,
                        hasNextPage: false
                    },
                    existingChannel : {
                        username: existingChannel.username,
                        fullname: existingChannel.fullname,
                        avatar: existingChannel.avatar
                    }
                },
                "No videos fetched for this existing Channel"
                )
            )
        }
    
        return res
        .status(200)
        .json(
            new ApiResponse(200, {
                videos,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalVideos,
                    hasPrevPage: page > 1,
                    hasNextPage: page < totalPages
                },
                existingChannel : {
                    username: existingChannel.username,
                    fullname: existingChannel.fullname,
                    avatar: existingChannel.avatar
                }
            },
            "Channel Videos fetched successfully"
            )
        )
    } catch (error) {
        new ApiError(500, "Something went wrong while fetching channel videos")
    }
})
 
export {
    getChannelStats, 
    getChannelVideos
}