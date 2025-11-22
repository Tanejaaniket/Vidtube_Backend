//toggleSubscription
//getUserChannelSubcribers
//getSubscribedChannels

import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Subscription } from "../models/subscription.models.js";
import mongoose, { Mongoose } from "mongoose";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const userId = req.user?._id;
  if (!userId) throw new ApiError(404, "User must logged in first");
  if (!channelId) throw new ApiError(404, "Channel id is required");
  const isSubscribed = await Subscription.find({
    channel: channelId,
    subscriber: userId,
  });

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
          {subscribe,isSubscribed:true},
        )
      );
  } else {
    const unSubscribe = await Subscription.findByIdAndDelete(
      isSubscribed[0]?._id
    );
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "User unsubscribed successfully to the channel",
          {unSubscribe,isSubscribed:false},
          
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

const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  if (!subscriberId) throw new ApiError(400, "Subscriber id is required");
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
        as: "subscribedTo",
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
      $unwind: "$subscribedTo",
    },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: ["$subscribedTo", "$$ROOT"],
        },
      },
    }, {
      $project: {
        subscribedTo: 0,
      },
    }
  ]);
  if (!channels.length)
    return res
      .status(200)
      .json(new ApiResponse(200, "No subscriptions found", channels));
  res
    .status(200)
    .json(new ApiResponse(200, "Subscriptions fetched successfully", channels));
});

const isChannelSubscribed = asyncHandler(async (req, res) => { 
  const { channelId } = req.params;
  const userId = req.user?._id;
  if (!userId) throw new ApiError(404, "User must logged in first");
  if (!channelId) throw new ApiError(404, "Channel id is required");
  const isSubscribed = await Subscription.findOne({
    channel:channelId,
    subscriber:userId,
  })
  if (!isSubscribed) return res.status(200).json(new ApiResponse(200, "User is not subscribed to the channel", { isSubscribed: false }))
  return res.status(200).json(new ApiResponse(200, "User is subscribed to the channel", { isSubscribed: true }))
})

export { getSubscribedChannels, getUserChannelSubcribers, toggleSubscription, isChannelSubscribed };
