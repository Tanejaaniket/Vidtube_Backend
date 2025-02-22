//getAllVideos(for home page or after search)
//getVideoById
//updateVideo
//deleteVideo
//publishAVideo
//togglePublishStatus

import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.models.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import mongoose, { Mongoose } from "mongoose";
import {uploadOnCloudinary} from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType = 1, userId } = req.query;
  const filter = {};
  if (query) {
    filter.title = { $regex: query, $options: "i" };
  }
  if (userId) {
    filter.owner = new mongoose.Types.ObjectId(userId);
  }
  const pipeline = [
    {
      $match: {...filter, isPublished: true},
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
      $sort: {
        [sortBy || "createdAt"]: sortType,
      },
    },
  ]
  console.log(pipeline)
  let paginatedVideos = [];
  try {
    paginatedVideos = await Video.aggregatePaginate(Video.aggregate(pipeline), {
      page,
      limit,
    });
    if(!paginatedVideos?.docs?.length) throw new ApiError(404, "Videos not found")
    return res
      .status(200)
      .json(
        new ApiResponse(200, "Videos fetched successfully", paginatedVideos)
      );
    } catch (error) {
      throw new ApiError(
        500,
        "Something went wrong while fetching videos",
        error
      );
    }
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  let video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
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

    //! this method wont work because it makes changes to local document
    //* This will only work when used with merge operator but will not return any document
    {
      $set: {
        views: { $add: ["$views", 1] },
      },
    },
    // {
    //   $merge: {
    //     into: "videos",
    //     whenMatched: "merge",
    //     whenNotMatched: "discard",
    //   },
    // },
  ]);
  try {
    //Updating views on video
    await Video.findOneAndUpdate({
        _id: videoId,
        isPublished: true
      },
      {
        $inc: { views: 1 }
      }
    );
  }catch (error) {
    console.log(`Unable to increment video view`,error)
  }
  if (!video) throw new ApiError(500, "Something went wrong while fetching video");
  if(!video?.length) throw new ApiError(404, "Video not found")
  return res
    .status(200)
    .json(new ApiResponse(200, "Video fetched successfully", video));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const video = await Video.findByIdAndDelete(videoId);
  if (!video) throw new ApiError(404, "Video not found");
  return res
    .status(200)
    .json(new ApiResponse(200, "Video deleted successfully", video));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;
  const thumbnail = req.file?.path;
  if (!title && !description && !thumbnail)
    throw new ApiError(400, "At least one field is required");
  const video = await Video.findOne({ _id: videoId, owner: req.user?._id });
  console.log(video)
  if (!video) throw new ApiError(404, "Video not found");
  try {
    let uploadedThumbnail = "";
    if (title) video.title = title;
    if (description) video.description = description;
    if (thumbnail) {
      uploadedThumbnail = await uploadOnCloudinary(thumbnail)
      if (!uploadedThumbnail) throw new ApiError(500, "Something went wrong while uploading thumbnail")
      video.thumbnail = uploadedThumbnail?.secure_url;
    }
    const updatedVideo = await video.save({ validateBeforeSave: false });
    return res
      .status(200)
      .json(new ApiResponse(200, "Video updated successfully", updatedVideo));
  } catch (error) {
    throw new ApiError(500, "Something went wrong while updating video",error);
  }
});

const publishAVideo = asyncHandler(async (req, res) => { 
  const { title, description } = req.body;
  const video = req.files?.video?.[0]?.path;
  const thumbnail = req.files?.thumbnail?.[0]?.path;
  if (!title || !description || !video || !thumbnail) throw new ApiError(400, "All fields are required")
  let uploadedVideo = "";
  let uploadedThumbnail = "";
  try {
    uploadedVideo = await uploadOnCloudinary(video);
    uploadedThumbnail = await uploadOnCloudinary(thumbnail);
  } catch (error) {
    throw new ApiError(500, "Something went wrong while uploading video");
  }
  const newVideo = await Video.create({
    title,
    description,
    videoFile: uploadedVideo?.secure_url,
    thumbnail: uploadedThumbnail?.secure_url,
    owner: req.user._id,
    views: uploadedVideo?.views || 0,
    duration: uploadedVideo?.duration,
    isPublished: true,
  });
  return res
    .status(200)
    .json(new ApiResponse(200, "Video published successfully", newVideo));
})

const togglePublishStatus = asyncHandler(async (req, res) => { 
  const { videoId } = req.params;
  const video = await Video.findById(videoId);
  if(!video) throw new ApiError(404, "Video not found");
  video.isPublished = !video.isPublished;
  const updatedVideo = await video.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, "Video updated successfully", updatedVideo));
})

export {updateVideo,publishAVideo,togglePublishStatus,getAllVideos,getVideoById,deleteVideo}