import { Router } from "express";
import { verifyToken } from "../middleware/auth.middlewares.js";
import { addVideoToPlaylist, createPlaylist, deletePlayist, getPlaylistById, getUserPlaylist, removeVideoFromPlaylist, updatePlayist } from "../controllers/playlist.controller.js";

const router = Router();

//*Automatically applies this middleware to all the routes of this file
router.use(verifyToken);

router.route("/").post(createPlaylist);
router
  .route("/:playlistId")
  .get(getPlaylistById)
  .patch(updatePlayist)
  .delete(deletePlayist)

router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist);
router.route("/remove/:videoId/:playlistId").patch(removeVideoFromPlaylist);
router.route("/user/:userId").get(getUserPlaylist);

export default router;
