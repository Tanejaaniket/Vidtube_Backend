import { Router } from "express";
import { verifyToken } from "../middleware/auth.middlewares.js";
import { upload } from "../middleware/multer.middleware.js";
import { deleteVideo, getAllVideos,  getVideoById, publishAVideo, searchVideos, togglePublishStatus, updateVideo } from "../controllers/video.controller.js";

const router = Router();

//*Automatically applies this middleware to all the routes of this file
router.use(verifyToken);

router.route("/")
  .get(getAllVideos)
  .post(upload.fields(
    [
      {
        name: "thumbnail",
        maxCount: 1
      }, {
        name: "video",
        maxCount: 1
      }
    ]
  ), publishAVideo)
  
router.route("/:videoId")
  .get(getVideoById)
  .delete(deleteVideo)
  .patch(upload.single("thumbnail"), updateVideo)


router.route("/toggle/v/:videoId").post(togglePublishStatus);
router.route("/v/search").get(searchVideos);

export default router;
