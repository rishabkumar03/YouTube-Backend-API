import { Router } from 'express';
import {
    createPlaylist,
    getUserPlaylists
} from "../controllers/playlist.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router
.route("/createPlaylist")
.post(
    verifyJWT,
    createPlaylist
)

router
.route("/user/:userId")
.get(
    verifyJWT,
    getUserPlaylists
);

// router
//     .route("/:playlistId")
//     .get(getPlaylistById)
//     .patch(updatePlaylist)
//     .delete(deletePlaylist);

// router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist);
// router.route("/remove/:videoId/:playlistId").patch(removeVideoFromPlaylist);


export default router