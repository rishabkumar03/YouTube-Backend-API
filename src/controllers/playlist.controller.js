import mongoose from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"
import { Video } from "../models/video.model.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    //TODO: create playlist

    if (!name && !description) {
        throw new ApiError(400, "Name and desription are required for creating playlist")
    }

    const playlist = await Playlist.create({
        owner: req.user._id,
        name: name.trim(),
        description: description.trim()
    })

    const createdPlaylist = await Playlist.findById(playlist._id)
    .populate(
        "owner",
        "username fullname avatar"
    )

    console.log("Playlist has been created", createdPlaylist)

    if (!createdPlaylist) {
        throw new ApiError(500, "Something went wrong")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, createdPlaylist, "Playlist created successfully")
    )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists

    if (userId && !mongoose.isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid User Id")
    }

    if (userId) {
        const existedUser = await User.findById(userId)
        if (!existedUser) {
            throw new ApiError(404, "User doesn't exist")
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
                        username : 1,
                        fullname : 1,
                        avatar : 1
                    } 
                }
            ]
        }
    })

    pipeline.push[{
        $addFields: {
            owner: {
                $first: "$ownerDetails"
            }
        }
    }]

    pipeline.push[{
        $project: {
            name : 1,
            description : 1,
            owner : 1
        }
    }]

    const playlist = await Playlist.aggregate(pipeline)

    return res
    .status(200)
    .json(
        new ApiResponse(200, playlist, "Users playlist fetched successfully")
    )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params

    //TODO: get playlist by id

    if (!mongoose.isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid Playlist Id")
    }

    const playlist = await Playlist.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [{
                    $project: {
                        username: 1,
                        fullname: 1,
                        avatar: 1
                    }
                }]
            }
        },
        {
            $addFields: {
                owner: {
                    $first: "$owner"
                }
            }
        }
    ])

    if (!playlist || playlist.length === 0) {
        throw new ApiError(404, "Playlist not found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, playlist, "Playlist fetched successfully")
    )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    // Validation
    if (!mongoose.isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid Playlist Id")
    }

    const existedPlaylist = await Playlist.findById(playlistId)
    if (!existedPlaylist) {
        throw new ApiError(404, "Playlist doesn't exist")
    }
    

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video Id")
    }

    const existedVideo = await Video.findById(videoId)
    if (!existedVideo) {
        throw new ApiError(404, "Video doesn't exist")
    }
    

    // Verify Ownership
    if (existedPlaylist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You dont have permission to modify this playlist")
    }

    // If video already in playlist
    const isVideoAlreadyExistInPlaylist = existedPlaylist.videos.includes(videoId) 
    if (isVideoAlreadyExistInPlaylist) {
        throw new ApiError(409, "Video already exists in playlist")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $addToSet: { videos : videoId }, // $addToSet prevents duplication
            $inc: { totalVideos : 1 } // $inc is increment operator
        },
        { new : true }
    ).populate("videos", "title thumbnail duration views createdAt owner")

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedPlaylist, "video added successfully to playlist")
    )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist

    if (!mongoose.isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid Playlist Id")
    }

    const existedPlaylist = await Playlist.findById(playlistId)
    if (!existedPlaylist) {
        throw new ApiError(404, "Playlist doesnt exist")
    }

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video Id")  
    }

    const existedVideo = await Video.findById(videoId)
    if (!existedVideo) {
        throw new ApiError(404, "Video doesnt exist")
    }

    if (existedPlaylist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You dont have permission to modify this playlist")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: { videos : videoId }, // we can simply say $pull is the opposite of $addToSet, it is used in specific removal
            $inc: { totalVideos : -1 } // here, it behaves like decrement operator
        }, 
        { new : true }
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedPlaylist, "Video removed successfully from playlist")
    )
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist

    if (!mongoose.isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid Playlist Id")
    }

    const existingPlaylist = await Playlist.findById(playlistId)
    if (!existingPlaylist) {
        throw new ApiError(404, "Playlist doesnt exist")
    }

    if (existingPlaylist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(400, "You can not modify this playlist")
    }

    const deletedPlaylist = await Playlist.findByIdAndDelete(
        playlistId
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200, deletedPlaylist, "Playlist deleted successfully")
    )
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist

    if (!mongoose.isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid Playlist Id")
    }

    const existingPlaylist = await Playlist.findById(playlistId)
    if (!existingPlaylist) {
        throw new ApiError(404, "Playlist doesn't exist")
    }

    if (!name && !description) {
        throw new ApiError(400, "Atleast one of them is required")
    }

    if (existingPlaylist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(400, "You cannot modify this playlist")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: { 
                name,
                description
            }
        },
        { new : true }
    ).populate("owner", "username fullname avatar")

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedPlaylist, "Playlist updated successfully")
    )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}