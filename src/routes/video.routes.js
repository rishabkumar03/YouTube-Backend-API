import { Router } from "express";
import {
    getAllVideos
} from "../controllers/video.controller.js"
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router
.route("/all-videos")
.get(
    verifyJWT,
    getAllVideos
)

export default router