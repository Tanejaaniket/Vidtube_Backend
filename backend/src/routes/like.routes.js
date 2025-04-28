import { Router } from "express";
import { verifyToken } from "../middleware/auth.middlewares.js";
import { getLikedVideos, getVideoLikes, isVideoLiked, toggleCommentLike, toggleTweetLike, toggleVideoLike } from "../controllers/like.controller.js";

const router = Router();

//*Automatically applies this middleware to all the routes of this file
router.use(verifyToken);

router.route("/v/:videoId").get(getVideoLikes);
router.route("/u/v/:videoId").get(isVideoLiked);
router.route("/toggle/v/:videoId").post(toggleVideoLike);
router.route("/toggle/c/:commentId").post(toggleCommentLike);
router.route("/toggle/v/:tweetId").post(toggleTweetLike);
router.route("/videos").get(getLikedVideos);

export default router;
