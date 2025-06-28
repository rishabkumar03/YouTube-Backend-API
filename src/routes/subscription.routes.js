import { Router } from 'express';
import {
    toggleSubscription,
    getSubscribedChannels,
    getUserChannelSubscribers
} from "../controllers/subscription.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router
.route("/c/:channelId")
.post(
    verifyJWT,
    toggleSubscription
);

router
.route("/subscribed-channels/:subscriberId")
.get(
    verifyJWT,
    getSubscribedChannels
)

router
.route("/u/:channelId")
.get(
    verifyJWT,
    getUserChannelSubscribers
);

export default router