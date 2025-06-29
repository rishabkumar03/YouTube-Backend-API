import mongoose from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"

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


export {
    toggleVideoLike
}