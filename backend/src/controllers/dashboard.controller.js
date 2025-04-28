//getChannelStats(for eg total video views, total videos, total likes, total subscriber etc)
//getChannelVideos (get all videos uploaded by channel)

import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.models.js";
import { Like } from "../models/like.models.js";
import { Subscription } from "../models/subscription.models.js";
import mongoose, { Mongoose } from "mongoose";

const getChannelVideos = asyncHandler(async (req, res) => { 
  const {channelId} = req.params;
  if (!channelId) throw new ApiError(404, "User must login first");
  const videos = await Video.find({ owner: new mongoose.Types.ObjectId(channelId) });
  if (!videos) throw new ApiError(404, "No videos found");
  return res.status(200).json(
    new ApiResponse(200, "Videos found successfully", videos)
  );
})

const getChannelStats = asyncHandler(async (req, res) => { 
  const {channelId} = req.params;
  if (!channelId) throw new ApiError(404, "User must login first");
  const videoStats = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $group:{
        _id: null,
        totalViews: { $sum: "$views" },
        totalVideos: { $sum: 1 }
      }
    }
  ])

  if (!videoStats.length) throw new ApiError(404, "No videos found");
  const likes = await Like.aggregate([
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "likedVideo",
        pipeline: [
          {
            $match: {
              owner: new mongoose.Types.ObjectId(channelId),
            },
          },
        ],
      }
    },
    {
      $group: {
        _id: null,
        totalLikes: { $sum: 1 }
      }
    }
  ])
  if (!likes) throw new ApiError(500, "Something went wrong while fetching likes");

  const subscriptions = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $group: {
        _id: null,
        totalSubscribers: { $sum: 1 }
      }
    }
  ])
  if (!subscriptions) throw new ApiError(500, "Something went wrong while fetching subscriptions");

  return res.status(200)
    .json(new ApiResponse(200, "Stats found successfully", {
      totalViews: videoStats[0]?.totalViews,
      totalVideos: videoStats[0]?.totalVideos,
      totalLikes: likes[0]?.totalLikes,
      totalSubscribers: subscriptions[0]?.totalSubscribers
    }))
})

export {
  getChannelVideos,
  getChannelStats
}