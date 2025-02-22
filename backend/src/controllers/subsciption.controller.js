//toggleSubscription
//getUserChannelSubcribers
//getSubscribedChannels

import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Subscription } from "../models/subscription.models.js";
import mongoose,{ Mongoose } from "mongoose";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const userId = req.user?._id;
  if (!userId) throw new ApiError(404, "User must logged in first");
  if (!channelId) throw new ApiError(404, "Channel id is required");
  const isSubscribed = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
        subscriber: new mongoose.Types.ObjectId(userId),
      },
    },
  ]);
  if (!isSubscribed.length) {
    const subscribe = await Subscription.create({
      channel: channelId,
      subscriber: userId,
    });
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "User subscribed successfully to the channel",
          subscribe
        )
      );
      
  } else {
    const unSubscribe = await Subscription.findByIdAndDelete(isSubscribed[0]?._id);
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "User unsubscribed successfully to the channel",
          unSubscribe
        )
      );
  }
});

const getUserChannelSubcribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!channelId) throw new ApiError(400, "Channel id is required");
  const subscribers = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscribers",
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
  ]);
  if (!subscribers.length) throw new ApiError(404, "No subscribers found");
  res
    .status(200)
    .json(
      new ApiResponse(200, "Subscribers fetched successfully", subscribers)
    );
});

const getSubscribedChannels  = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  if (!subscriberId) throw new ApiError(400, "Subscriber id is required") ;
  const channels = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscriberId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "subscriberedTo",
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
  ]);
  if (!channels.length) throw new ApiError(404, "No subscriptions found");
  res
    .status(200)
    .json(
      new ApiResponse(200, "Subscriptions fetched successfully", channels)
    );
});

export {getSubscribedChannels,getUserChannelSubcribers,toggleSubscription}