import mongoose from "mongoose"
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
            throw new ApiError(404, "User does not exist")
        }
    }

    // Build aggregation pipeline stages
    const pipeline = []

    // Stage 1: Match stage for filtering
    const matchStage = {}

    if (userId) {
        matchStage.owner = new mongoose.Types.ObjectId(userId)
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

const publishAVideo = asyncHandler(async (req, res) => {

    // get video details from frontend
    // validation by required property - not empty
    // check for video file and thumbnail
    // upload them to cloudinary
    // create video object - create entry in db
    // return response

    const { title, description } = req.body

    // TODO: get video, upload to cloudinary, create video

    if (
        [title, description].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "Both fields are required")
    }

    if (!req.user) {
        throw new ApiError(404, "User Authentication required")
    }

    // if (!title) {
    //     throw new ApiError(400, "Title is required")
    // }

    // if (!description) {
    //     throw new ApiError(400, "Description is required")
    // }

    // Check for thumbnail
    let thumbnailLocalPath;
    if (req.files &&
        req.files.thumbnail &&
        Array.isArray(req.files.thumbnail) &&
        req.files.thumbnail.length > 0){
        thumbnailLocalPath = req.files.thumbnail[0].path;        
    } else {
        throw new ApiError(400, "Thumbnail file is required")
    }

    // Check for video file
    let videoFileLocalPath;
    if (req.files &&
        req.files.videoFile &&
        Array.isArray(req.files.videoFile) &&
        req.files.videoFile.length > 0) {
        videoFileLocalPath = req.files.videoFile[0].path;
    } else {
        throw new ApiError(400, "Media file is required")
    }

    const thumbnail = await uploadCloudinary(thumbnailLocalPath);
    const videoFile = await uploadCloudinary(videoFileLocalPath);

    if (!thumbnail) {
        throw new ApiError(400, "Thumbnail file is mandatory")
    }

    if (!videoFile) {
        throw new ApiError(400, "Media file is mandatory")
    }

    const video = await Video.create({
        owner: req.user._id,
        thumbnail: thumbnail.url,
        videoFile: videoFile.url,
        title: title.trim(),
        description: description.trim(),
        duration: videoFile.duration || 0
    })

    const uploadedVideo = await Video.findById(video._id)
    .populate(
        "owner",
        "username fullname avatar"
    )

    console.log("Media has been uploaded", uploadedVideo);

    if (!uploadedVideo) {
        throw new ApiError(500, "Something went wrong while uploading the video");
    }

    return res
    .status(201)
    .json(
        new ApiResponse(200, uploadedVideo, "Video Uploaded successfully")
    )
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    //TODO: get video by id

    /*
    -- Validate videoId
    -- Find video by ID and populate owner details
    -- Check if video exists
    -- Increment view count
    -- Return response
    */

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video Id")
    }

    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
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
                    // $first is an aggregation operator that returns the first element of an array.
                    $first: "$owner"
                }
            }
        }
    ])

    if (!video || video.length === 0) {
        throw new ApiError(404, "Video not found")
    }

    // Increment view count
    await Video.findByIdAndUpdate(
        videoId, 
        {
            $inc: { views: 1 }
        }
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200, video[0], "Video Fetched Successfully")
    )
})

const updateVideo = asyncHandler(async (req, res) => {

    // get video id from params and video details from body
    // validation - check if video exists and user is owner
    // update video details
    // return updated video

    const { videoId } = req.params
    const { title, description } = req.body

    //TODO: update video details like title, description, thumbnail
    
    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video Id")
    }

    if (!title && !description) {
        throw new ApiError(404, "Atleast one field is required")
    }

    // Find the existing video first
    const existingVideo = await Video.findById(videoId)
    if (!existingVideo) {
        throw new ApiError(404, "Video does not exist")
    }

    if (existingVideo.owner.toString() !== req.user._id.toString()){
        throw new ApiError(404, "User does not match")
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title,
                description
            }
        },
        {new: true}
    ).populate("owner", "username fullname avatar")

    return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Video details updated successfully"))
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    //TODO: delete video

    if (!mongoose.isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video Id")
    }
    
    // Check for video existence
    const existingVideo = await Video.findById(videoId)

    if (!existingVideo) {
        throw new ApiError(404, "Video doesn't exist")
    }

    if (!existingVideo.owner) {
        throw new ApiError(404, "wtf, owner is not here?")
    }

    if (existingVideo.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(404, "User doesn't match")
    }

    const deletedVideo = await Video.findByIdAndDelete(
        videoId
    )

    return res
    .status(200)
    .json(new ApiResponse(200, deletedVideo, "Video deleted successfully"))
})

// "Toggle publish status" typically refers to switching a piece of content between two states. (Here, keeping video public or private)
const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video ID")
    }

    const existingVideo = await Video.findById(videoId)
    if (!existingVideo) {
        throw new ApiError(404, "Video doesn't exist")
    }

    if(existingVideo.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(404, "User doesn't match")
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                isPublished: !existingVideo.isPublished
            }
        },
        { new: true }
    ).populate("owner", "username fullname avatar")

    return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, `Video ${updatedVideo.isPublished ? 'published' : 'unpublished'} successfully`))
})


export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}