import { Router } from 'express';
import {
    toggleSubscription,
    getSubscribedChannels
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

// router
// .route("/u/:subscriberId")
// .get(
//     verifyJWT,
//     getUserChannelSubscribers
// );

router
.route("/subscribed-channels/:subscriberId")
.get(
    verifyJWT,
    getSubscribedChannels
)


export default router