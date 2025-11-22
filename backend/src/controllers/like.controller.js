//toggleVideoLike
//toggleCommentLike
//toggleTweetLike
//getLikedVideos
import { asyncHandler } from "../utils/asyncHandler.js";
import { Like } from "../models/like.models.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import mongoose, { Mongoose } from "mongoose";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user?._id;
  const likedVideo = await Like.findOne({
    video: videoId,
    likedBy: userId,
  });
  if (!likedVideo) {
    const newLike = await Like.create({
      video: videoId,
      likedBy: userId,
      comment: null,
      tweet: null,
    });
    if (!newLike)
      throw new ApiError(500, "Something went wrong while liking a video");
    return res
      .status(200)
      .json(
        new ApiResponse(200, "Video liked successfully", {
          newLike,
          isLiked: true,
        })
      );
  } else {
    const deletedLike = await Like.findByIdAndDelete(likedVideo._id);
    if (!deletedLike)
      throw new ApiError(500, "Something went wrong while unliking a video");
    return res.status(200).json(
      new ApiResponse(200, "Video unliked successfully", {
        deletedLike,
        isLiked: false,
      })
    );
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user?._id;
  const likedComment = await Like.findOne({
    comment: commentId,
    likedBy: userId,
  });
  if (!likedComment) {
    const newLike = await Like.create({
      comment: commentId,
      likedBy: userId,
      video: null,
      tweet: null,
    });
    if (!newLike)
      throw new ApiError(500, "Something went wrong while liking a comment");
    return res.status(200).json(
      new ApiResponse(200, "Comment liked successfully", {
        isLiked: true,
        newLike,
      })
    );
  } else {
    const deletedLike = await Like.findByIdAndDelete(likedComment._id);
    if (!deletedLike)
      throw new ApiError(500, "Something went wrong while unliking a comment");
    return res.status(200).json(
      new ApiResponse(200, "Comment unliked successfully", {
        isLiked: false,
        deletedLike,
      })
    );
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const userId = req.user?._id;
  const likedTweet = await Like.findOne({
    tweet: tweetId,
    likedBy: userId,
  });
  if (!likedTweet) {
    const newLike = await Like.create({
      comment: null,
      likedBy: userId,
      video: null,
      tweet: tweetId,
    });
    if (!newLike)
      throw new ApiError(500, "Something went wrong while liking a Tweet");
    return res.status(200).json(
      new ApiResponse(200, "Tweet liked successfully", {
        isLiked: true,
        newLike,
      })
    );
  } else {
    const deletedLike = await Like.findByIdAndDelete(likedTweet._id);
    if (!deletedLike)
      throw new ApiError(500, "Something went wrong while unliking a tweet");
    return res.status(200).json(
      new ApiResponse(200, "Tweet unliked successfully", {
        isLiked: false,
        deletedLike,
      })
    );
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //Get only those videos whose isPublished is still true in video model
  const userId = req.user?._id;
  if (!userId) throw new ApiError(404, "Please login to get your liked videos");
  const likedVideos = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(userId),
        comment: null,
        tweet: null,
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "likedVideo",
        pipeline: [
          {
            $match: {
              isPublished: true,
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "ownerDetails",
              pipeline: [
                {
                  $project: {
                    username: 1,
                    fullname: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $unwind: {
              path: "$ownerDetails",
            },
          },
        ],
      },
    },
    {
      //It will return plain object instead of whole video
      $unwind: {
        path: "$likedVideo",
      },
    },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: [ "$$ROOT","$likedVideo",],
        }
      },
    },
    {
      $project: {
        likedVideo: 0,
      },
    }
  ]);
  if (!likedVideos)
    throw new ApiError(500, "Error while fetching liked videos");
  if (!likedVideos.length)
    return res
      .status(200)
      .json(new ApiResponse(200, "No liked videos found", likedVideos));
  res
    .status(200)
    .json(
      new ApiResponse(200, "Liked videos fetched successfully", likedVideos)
    );
});

const getVideoLikes = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const videoLikes = await Like.find({ video: videoId });
  console.log("Here is the video likes", videoLikes);
  if (!videoLikes) throw new ApiError(500, "Error while fetching video likes");
  res
    .status(200)
    .json(new ApiResponse(200, "Video likes fetched successfully", videoLikes));
});

const isVideoLiked = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user?._id;
  if (!userId) throw new ApiError(404, "User must logged in first");
  if (!videoId) throw new ApiError(404, "Channel id is required");
  const isLiked = await Like.findOne({
    video: videoId,
    likedBy: userId,
  });
  if (!isLiked)
    return res
      .status(200)
      .json(
        new ApiResponse(200, "User is not subscribed to the channel", {
          isLiked: false,
        })
      );
  return res
    .status(200)
    .json(
      new ApiResponse(200, "User is subscribed to the channel", {
        isLiked: true,
      })
    );
});

export {
  toggleVideoLike,
  toggleCommentLike,
  toggleTweetLike,
  getLikedVideos,
  getVideoLikes,
  isVideoLiked,
};
