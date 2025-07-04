import { Router } from 'express';
import { 
    getChannelStats,
    getChannelVideos
} from "../controllers/dashboard.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router
.route("/stats/c/:channelId")
.get(
    verifyJWT,
    getChannelStats
);

router
.route("/videos/c/:channelId")
.get(
    verifyJWT,
    getChannelVideos
);

export default router