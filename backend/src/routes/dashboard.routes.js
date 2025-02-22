import { Router } from "express";
import { verifyToken } from "../middleware/auth.middlewares.js";
import { getChannelStats, getChannelVideos } from "../controllers/dashboard.controller.js";


const router = Router();

//*Automatically applies this middleware to all the routes of this file
router.use(verifyToken);

router.route("/stats").get(getChannelStats);
router.route("/videos").get(getChannelVideos)

export default router;
