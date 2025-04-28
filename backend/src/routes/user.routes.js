import { Router } from "express";
import { changeCurrentPassword, getCurrentUser, getUserChannelProfile, getWatchHistory, isUsernameUnique, loginUser, logoutUser, refreshAcessToken, registerUser, updateUserAccount, updateUserAvatar, updateUserCoverImage } from "../controllers/user.controllers.js";
import { upload } from "../middleware/multer.middleware.js";
import { verifyToken } from "../middleware/auth.middlewares.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);
router.route("/login").post(loginUser)
router.route("/isUsernameUnique/:username").get(isUsernameUnique)
router.route("/refershToken").post(refreshAcessToken);
router.route("/logout").post(verifyToken, logoutUser);
router.route("/changePassword").patch(verifyToken, changeCurrentPassword);
router.route("/user").get(verifyToken, getCurrentUser);
router.route("/updateUserAccount").patch(verifyToken, updateUserAccount);
router.route("/updateUserCoverImage").patch(
  verifyToken,
  upload.single("coverImage"),
  updateUserCoverImage
);
router.route("/updateUserAvatar").patch(
  verifyToken,
  upload.single("avatar"),
  updateUserAvatar
);
router.route("/channelProfile/:username").get(
  verifyToken,
  getUserChannelProfile
);
router.route("/watchHistory").get(
  verifyToken,
  getWatchHistory
);

export default router;
