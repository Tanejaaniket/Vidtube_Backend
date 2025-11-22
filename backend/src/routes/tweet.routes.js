import { Router } from "express";
import { verifyToken } from "../middleware/auth.middlewares.js";
import { createTweet, deleteTweet, getUserTweet, updateTweet } from "../controllers/tweet.controller.js";

const router = Router();

//*Automatically applies this middleware to all the routes of this file
router.use(verifyToken);

router.route("/").post(createTweet);
router.route("/user/:userId").get(getUserTweet);
router.route("/:tweetId").patch(updateTweet).delete(deleteTweet);

export default router;
