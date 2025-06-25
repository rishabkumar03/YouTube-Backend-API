import { Router } from 'express';
import {
    createTweet,
    getUserTweets,
    updateTweet
} from "../controllers/tweet.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router
.route("/create-tweet")
.post(
    verifyJWT,
    createTweet
);

router
.route("/user-tweet/:userId")
.get(
    verifyJWT,
    getUserTweets
);

router
.route("/update-tweet/:tweetId")
.patch(
    verifyJWT,
    updateTweet
)

// .delete(deleteTweet);

export default router