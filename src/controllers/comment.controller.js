import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10, sortBy = "desc", sortType = "date" } = req.query

    if (sortBy && !["asc", "desc"].includes(sortBy)) {
        throw new ApiError(400, "sortBy must be either 'asc' or 'desc' ");
    }

    if (sortType && !["date", "mostLikes"].includes(sortType)) {
        throw new ApiError(400, "sortType must contain 'date' or 'mostLikes'")
    }

    if (videoId && !mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video Id")
    }

    const existingVideo = await Video.findById(videoId)
    if (!existingVideo) {
        throw new ApiError(404, "Video doesnt exist")
    }

    const pipeline = []

    if (videoId) {
        pipeline.push({
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
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
    },
    {
        $addFields: {
            owner: {
                $first: "$ownerDetails"
            }
        }
    },
    // We are removing ownerDetails to avoid duplicaion and less cluster in API response.
    {
        $unset: "ownerDetails" 
    })

    const sortField = sortType === "date" ? "createdAt" : "mostLikes"

    const sortOrder = sortBy === "asc" ? 1 : -1

    pipeline.push({
        $sort: { [sortField]: sortOrder }
    })

    pipeline.push({
        $project: {
            content: 1,
            owner: 1,
            createdAt: 1,
            updatedAt: 1
        }
    })

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const countPipeline = [...pipeline]
    countPipeline.push({ $count: "totalComments" })

    pipeline.push({ $skip: skip })
    pipeline.push({ $limit: parseInt(limit) })

    try {
        const [comments, countResult] = await Promise.all([
            Comment.aggregate(pipeline),
            Comment.aggregate(countPipeline)
        ])
    
        const totalComments = countResult[0]?.totalComments || 0
        const totalPages = Math.ceil( totalComments / limit )
    
        if (!comments || comments.length === 0){
            return res
            .status(200)
            .json(
                new ApiResponse (200, {
                    comments: [],
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: 0,
                        totalComments: 0,
                        hasPrevPage : false,
                        hasNextPage: false
                    }
                },
                "Comments doesn't exist"
                )
            )
        }
    
        return res
        .status(200)
        .json(
            new ApiResponse(200, {
                comments,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalComments,
                    hasPrevPage: page > 1,
                    hasNextPage: page < totalPages
                }
            },
            "Comments fetched successfully"
            )
        )
    } catch (error) {
        throw new ApiError("Something went wrong while fetching the comments");
    }
})

export {
    getVideoComments
}