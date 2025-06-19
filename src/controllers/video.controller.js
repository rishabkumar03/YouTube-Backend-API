import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadCloudinary} from "../utils/cloudinary.js"

const getAllVideos = asyncHandler(async (req, res) => {

    // get video details from query perameters
    // validation by required property - not empty
    // check if user exists when userId filter is provided
    // build aggregation pipeline for complex queries generally for viewers count
    // implement search, sort, and pagination
    // return structured response with video data

    const { page = 1, limit = 10, query, sortBy = "desc", sortType = "date", userId } = req.query

    //TODO: get all videos based on query, sort, pagination

    // Validation: Check if required parameters are valid

    // .includes() method is a JavaScript array method that checks if an array contains a specific element.
    if (sortBy && !["asc", "desc"].includes(sortBy)) {
        throw new ApiError(400, "sortBy must be either 'asc' or 'desc' ");
    }

    if (sortType && !["date", "views"].includes(sortType)) {
        throw new ApiError(400, "sortType must be either 'date' or 'views'")
    }

    // Check if user exists when userId filter is provided
    if (userId && !mongoose.isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID format")
    }

    if (userId) {
        const existedUser = await User.findById(userId)
        if (!existedUser) {
            throw new ApiError(400, "User does not exist")
        }
    }

    // Build aggregation pipeline stages
    const pipeline = []

    // Stage 1: Match stage for filtering
    const matchStage = {}

    if (userId) {
        matchStage.owner = new mongoose.Types.isValidObjectId(userId)
    }

    // $regex is a MongoDB query operator that provides regular expression capabilities for pattern matching in queries.

    // Options

    // i - Case insensitive matching
    // m - Multiline matching
    // x - Extended capability (ignore whitespace and comments)
    // s - Allows dot character (.) to match all characters including newline characters

    if (query && query.trim() !== "") {
        matchStage.$or = [
            {title: { $regex: query.trim(), $options: "i" } },
            { description: { $regex: query.trim(), $options: "i"}}
        ]
    }

    // Add matchStage if we have conditions
    if (Object.keys(matchStage).length > 0) {
        pipeline.push({ $match: matchStage})
    }

    // Stage 2: Lookup stage for joining with users collection
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

    // Stage 3: AddFields stage for computed fields

    // $first is a MongoDB aggregation operator that returns the first value from an array

    pipeline.push({
        $addFields: {
            owner: {
                $first: "$ownerDetails"
            }
        }
    })

    // Stage 4: Sort stage
    const sortField = sortType === "date" ? "createdAt" : "views"
    const sortOrder = sortBy === "asc" ? 1 : -1
    pipeline.push({
        $sort: { [sortField]: sortOrder }
    })

    // Stage 5: Project stage to select specific fields
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

    // parseInt() is a JavaScript function that parses a string and returns an integer.

    // Execute aggregation pipeline with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit)


    // The ... is the spread operator

    // Create pipeline for counting total documents
    const countPipeline = [...pipeline]
    countPipeline.push({ $count: "totalVideos" })

    // $skip is a MongoDB aggregation operator that skips a specified number of documents from the beginning of the result set.

    // Most common use - combined with $limit for paginated results

    // $limit is a MongoDB aggregation operator that restricts the number of documents passed to the next stage in the pipeline.

    // Add pagination stages to main pipeline
    pipeline.push({ $skip: skip })
    pipeline.push({ $limit: parseInt(limit)})

    // Promise.all is perfect when you need all operations to succeed and want maximum performance through concurrency.

    try {
        // Execute both pipelines concurrently
        const [videos, countResult] = await Promise.all([
            Video.aggregate(pipeline),
            Video.aggregate(countPipeline)
        ])
    
        // optional chaining (?.) and the logical OR operator (||) to safely extract a value with a fallback.
    
        const totalVideos = countResult[0]?.totalVideos || 0
        const totalPages = Math.ceil(totalVideos / limit)
    
        // Check if videos were found
        if (!videos || videos.length === 0) {
            return res
            .status(200)
            .json(
                new ApiResponse (200, {
                    videos: [],
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: 0,
                        totalVideos: 0,
                        hasPrevPage: false,
                        hasNextPage: false
                    }
                },
                "Videos doesn't exist"
                )
            )
        }
    
        return res
        .status(200)
        .json(
            new ApiResponse (200, {
                videos,
                pagination: {
                    currentPage: parseInt(page),
                    totalVideos,
                    totalPages,
                    hasPrevPage: page > 1,
                    hasNextPage: page < totalPages
                }
            },
            "Videos fetched successfully"
            )
        )
    } catch (error) {
        throw new ApiError("Something went wrong while fetching the videos");
    }
})

// const publishAVideo = asyncHandler(async (req, res) => {
//     const { title, description} = req.body
//     // TODO: get video, upload to cloudinary, create video
// })

// const getVideoById = asyncHandler(async (req, res) => {
//     const { videoId } = req.params
//     //TODO: get video by id
// })

// const updateVideo = asyncHandler(async (req, res) => {
//     const { videoId } = req.params
//     //TODO: update video details like title, description, thumbnail

// })

// const deleteVideo = asyncHandler(async (req, res) => {
//     const { videoId } = req.params
//     //TODO: delete video
// })

// const togglePublishStatus = asyncHandler(async (req, res) => {
    // const { videoId } = req.params
// })

export {
    getAllVideos
}