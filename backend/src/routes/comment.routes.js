import { Router } from "express";
import { verifyToken } from "../middleware/auth.middlewares.js";
import { addVideoComment, deleteComment, getVideoComments, updateComment } from "../controllers/comments.controller.js";

const router = Router();

//*Automatically applies this middleware to all the routes of this file
router.use(verifyToken)

router.route("/:videoId").get(getVideoComments).post(addVideoComment)
router.route("/c/:commentId").delete(deleteComment).patch(updateComment)

export default router