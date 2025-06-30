import { Router } from 'express';
import { 
    getVideoComments,
    addComment
} from "../controllers/comment.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router
.route("/:videoId")
.get(
    verifyJWT,
    getVideoComments
)

router
.route("/add/:videoId")
.post(
    verifyJWT,
    addComment
);

// router.route("/c/:commentId").delete(deleteComment).patch(updateComment);

export default router