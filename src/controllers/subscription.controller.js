import mongoose from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    // TODO: toggle subscription

    if (!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid Channel Id")
    }

    const channel = await User.findById(channelId)
    if (!channel) {
        throw new ApiError(404, "Channel does not exist")
    }

    if(channelId === req.user._id.toString()) {
        throw new ApiError(404, "You can not subscribe to your own channel")
    }

    // Check if subscription already exists
    const existingSubscription = await Subscription.findOne({
        subscriber: req.user._id,
        channel: channelId
    })

    if (existingSubscription) {
        // Unsubscribe
        await Subscription.findByIdAndDelete(existingSubscription._id) 

        return res
        .status(200)
        .json(
            new ApiResponse(200, { subscribed : false }, "Unsubscibed Successfully") 
        )
    }

    else {
        const newSubscription = await Subscription.create({
            subscriber: req.user._id,
            channel: channelId
        })

        return res
        .status(200)
        .json(
            new ApiResponse(200, { subscribed : true }, newSubscription, "Subscribed Successfully")
        )
    }
})


export {
    toggleSubscription,
    getSubscribedChannels,
    getUserChannelSubscribers
}