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
            new ApiResponse(200, { subscribed : false }, "Unsubscribed Successfully") 
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

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if (!mongoose.isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriberId")
    }

    const subscriber = await User.findById(subscriberId)
    if (!subscriber) {
        throw new ApiError(404, "Subscriber does not exist")
    }

    try {
        const subscribedChannel = await Subscription.aggregate([
            {
                $match: {
                    subscriber: new mongoose.Types.ObjectId(subscriberId)
                }
            },
            {
                $lookup:{
                    from: "users",
                    localField: "channel",
                    foreignField: "_id",
                    as: "channelDetails",
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
                    channel: {
                        $first: "$channelDetails"
                    }
                }
            },
            {
                $project: {
                    channel: 1,
                    createdAt: 1
                }
            }
        ])
    
        return res
        .status(200)
        .json(
            new ApiResponse(200, subscribedChannel, "Channel Details fetched successfully")
        )
    } catch (error) {
        throw new ApiError(500, "Something went wrong while fetching channel")
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    /*
    -- Validate channelId
    -- Check if channel exists
    -- Build aggregation pipeline to get subscribers
    -- Return subscribers list
    */

    if (!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channelId")
    }

    const channel = await User.findById(channelId)
    if (!channel) {
        throw new ApiError(404, "Channel doesn't exist")
    }
    

    const subscriber = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
                }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriberDetails",
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
                subscriber: {
                    $first: "$subscriberDetails"
                }
            }
        },
        {
            $project: {
                subscriber: 1,
                createdAt: 1
            }
        }
    ])
    
    return res
    .status(200)
    .json(
        new ApiResponse(200, subscriber,"Subscriber Details fetched successfully")
    )

})

export {
    toggleSubscription,
    getSubscribedChannels,
    getUserChannelSubscribers
}