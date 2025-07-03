import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const healthcheck = asyncHandler(async (req, res) => {
    //TODO: build a healthcheck response that simply returns the OK status as json with a message

    return res
    .status(200)
    .json(
        new ApiResponse(
            200, {
                status: "OK",

                // toISOString() is a JavaScript Date method that converts a Date object to a string in ISO 8601 format. Example: "2025-07-04T10:30:45.123Z". "T" separates date and time portions
                timestamp : new Date().toISOString(),
                
                // process.uptime() is a Node.js method that returns how long the current Node.js process has been running. Example: 3847.234 (meaning 3847.234 seconds)
                uptime: process.uptime(),
                service: "API is running successfully"
            }, "Healthcheck passed successfully"
        )
    )
})

export {
    healthcheck
}