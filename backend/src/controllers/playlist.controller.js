//createPlaylist
//getUserPlaylist
//getPlaylistById
//addVideoToPlaylist
//removeVideoFromPlaylist
//deletePlayist
//updatePlaylist(name or description)

import { asyncHandler } from "../utils/asyncHandler.js";
import { Playlist } from "../models/playlist.models.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import mongoose, { Mongoose } from "mongoose";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const userId = req.user?._id;
  if (!userId)
    throw new ApiError(400, "User must login first to create a playlist");
  if (!name || !description)
    throw new ApiError(404, "Name and description are required");
  const playlist = await Playlist.create({
    name,
    description,
    owner: userId,
  });
  if (!playlist)
    throw new ApiError(500, "Something went wrong while creating a playlist");
  res
    .status(200)
    .json(new ApiResponse(200, "Playlist created successfully", playlist));
});

const getUserPlaylist = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!userId) throw new ApiError(404, "User id is required");
  const playlist = await Playlist.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "playlistVideos",
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
        ],
      },
    },
  ]);
  if (!playlist.length) throw new ApiError(404, "Playlist not found");
  res
    .status(200)
    .json(new ApiResponse(200, "Playlist found successfully", playlist));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!playlistId) throw new ApiError(400, "Playlist id is required");
  const playlist = await Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "playlistVideos",
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
        ],
      },
    },
  ]);
  if (!playlist.length) throw new ApiError(404, "Playlist not found");
  res
    .status(200)
    .json(new ApiResponse(200, "Playlist found successfully", playlist));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { videoId, playlistId } = req.params;
  if (!videoId || !playlistId)
    throw new ApiError(400, "Video and playlist Ids are required");
  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $push: { videos: videoId },
    },
    {
      new: true,
    }
  ).populate("videos");
  if (!updatedPlaylist)
    throw new ApiError(
      500,
      "Something went wrong while adding video to playlist"
    );
  res
    .status(200)
    .json(new ApiResponse(200, "Video added successfully", updatedPlaylist));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { videoId, playlistId } = req.params;
  if (!videoId || !playlistId)
    throw new ApiError(400, "Video and playlist Ids are required");
  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: { videos: videoId },
    },
    {
      new: true,
    }
  ).populate("videos");
  if (!updatedPlaylist)
    throw new ApiError(
      500,
      "Something went wrong while removing video from playlist"
    );
  res
    .status(200)
    .json(new ApiResponse(200, "Video removed successfully", updatedPlaylist));
});

const deletePlayist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!playlistId) throw new ApiError(400, "Playlist Id is required");
  const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);
  if (!deletedPlaylist)
    throw new ApiError(500, "Something went wrong while deleting playlist");
  res
    .status(200)
    .json(new ApiResponse(200, "Playlist deleted successfully", deletedPlaylist));
});

const updatePlayist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  if (!playlistId) throw new ApiError(400, "Playlist id is required");
  if (!name && !description)
    throw new ApiError(400, "Either playlist name or description is required");
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) throw new ApiError(404, "Playlist not found");
  if (name) playlist.name = name;
  if (description) playlist.description = description;
  const updatedPlaylist = await playlist.save({ validateBeforeSave: false });
  if (!updatedPlaylist)
    throw new ApiError(500, "Something went wrong while updating the playlist");
  res
    .status(200)
    .json(
      new ApiResponse(200, "Playlist updated successfully", updatedPlaylist)
    );
});

export {
  createPlaylist,
  getUserPlaylist,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlayist,
  updatePlayist,
};
