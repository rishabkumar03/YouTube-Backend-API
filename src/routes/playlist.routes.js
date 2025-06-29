import { Router } from 'express';
import {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist
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

router
.route("/:playlistId")
.get(
    verifyJWT,
    getPlaylistById
)

router
.route("/add/:videoId/:playlistId")
.patch(
    verifyJWT,
    addVideoToPlaylist
);

router
.route("/remove/:videoId/:playlistId")
.patch(
    verifyJWT,
    removeVideoFromPlaylist
);

//     .patch(updatePlaylist)
//     .delete(deletePlaylist);



export default router