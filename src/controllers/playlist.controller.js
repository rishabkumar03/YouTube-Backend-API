import mongoose from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"


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
            throw new ApiError(400, "User doesn't exist")
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
        new ApiResponse(200, playlist, "Playlists fetched successfully")
    )
})

export {
    createPlaylist,
    getUserPlaylists
}