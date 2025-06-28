import mongoose from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


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

export {
    createPlaylist
}