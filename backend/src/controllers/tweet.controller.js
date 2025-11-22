//createTweet
//updateTweet
//deleteTweet
//getUserTweet

import ApiResponse from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Tweet } from "../models/tweet.models.js";
import ApiError from "../utils/ApiError.js";
import mongoose,{ Mongoose } from "mongoose";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const userId = req.user?._id;
  if (!content) throw new ApiError(400, "Content is required");
  const newTweet = await Tweet.create({
    owner: userId,
    content: content,
  });
  if (!newTweet)
    throw new ApiError(500, "Something went wrong while creating a tweet");
  return res
    .status(200)
    .json(new ApiResponse(200, "Tweet created successfully", newTweet));
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  if (!tweetId) throw new ApiError(400, "Tweet id is required");
  const tweet = await Tweet.findByIdAndDelete(tweetId);
  if (!tweet)
    throw new ApiError(500, "Something went wrong while deleting the tweet");
  res
    .status(200)
    .json(new ApiResponse(200, "Tweet deleted successfully", tweet));
});

const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { content } = req.body;
  if (!tweetId) throw new ApiError(400, "Tweet id is required");
  if (!content) throw new ApiError(400, "Content is required");
  const tweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      $set: { content },
    },
    { new: true }
  );
  if (!tweet)
    throw new ApiError(500, "Something went wrong while deleting the tweet");
  res
    .status(200)
    .json(new ApiResponse(200, "Tweet deleted successfully", tweet));
});

const getUserTweet = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!userId) throw new ApiError(400, "User id is required");
  const pipeline = [
    { 
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      }
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
  ]

  //*To use aggregate paginate v2 you cannot directly use pipeline first and then aggregatePaginate the result you have to aggregate inside the aggregatePaginate function itself because aggregatePaginate aslo add pipelines to exsisting pipeline
  const paginatedTweets = await Tweet.aggregatePaginate(Tweet.aggregate(pipeline), {
    page: 1,
    limit: 10,
  });
  if(!paginatedTweets?.docs?.length) throw new ApiError(404, "User tweets not found");
  if (!paginatedTweets)
    throw new ApiError(500, "Something went wrong while fetching the tweets");
  res
    .status(200)
    .json(
      new ApiResponse(200, "User tweets fetched successfully", paginatedTweets)
    );
});

export {
  createTweet,
  deleteTweet,
  updateTweet,
  getUserTweet,
};