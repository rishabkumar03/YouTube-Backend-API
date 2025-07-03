import { Router } from 'express';
import { 
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos
} from "../controllers/like.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router
.route("/toggle/v/:videoId")
.post(
    verifyJWT,
    toggleVideoLike
);

router
.route("/toggle/c/:commentId")
.post(
    verifyJWT,
    toggleCommentLike
);

router
.route("/toggle/t/:tweetId")
.post(
    verifyJWT,
    toggleTweetLike
);

router
.route("/videos/u/:userId")
.get(
    verifyJWT,
    getLikedVideos
);

export default router