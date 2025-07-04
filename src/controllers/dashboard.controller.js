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

export {
    getChannelStats, 
    getChannelVideos
}