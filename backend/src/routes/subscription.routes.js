import { Router } from "express";
import { verifyToken } from "../middleware/auth.middlewares.js";
import { getSubscribedChannels, getUserChannelSubcribers, toggleSubscription } from "../controllers/subsciption.controller.js";


const router = Router();

//*Automatically applies this middleware to all the routes of this file
router.use(verifyToken);

router
  .route("/c/:channelId")
  .get(getUserChannelSubcribers)
  .post(toggleSubscription)
  
router.route("/u/:subscriberId").get(getSubscribedChannels)
export default router;
