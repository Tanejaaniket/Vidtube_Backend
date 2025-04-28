//addVideoComment
//getVideoComments
//deleteVideoComment
//updateVideoComment

import { asyncHandler } from "../utils/asyncHandler.js";
import { Comment } from "../models/comment.models.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import mongoose,{ Mongoose } from "mongoose";

const addVideoComment = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { videoId } = req.params;
  const { comment } = req.body;
  if (!comment) throw new ApiError(400, "Comment is required");
  if (!userId) throw new ApiError(400, "User not found");

  try {
    const newComment = await Comment.create({
      video: videoId,
      owner: userId,
      content: comment,
    });

    const createdComment = await Comment.findById(newComment._id);
    if (!createdComment)
      throw new ApiError(500, "Something went wrong while adding a comment");

    return res
      .status(200)
      .json(new ApiResponse(200, "Comment added successfully", newComment));
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while adding a comment",
      error
    );
  }
});

const getVideoComments = asyncHandler(async (req, res) => {
  try {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const pipeline = [
      {
        $match: {
          video: new mongoose.Types.ObjectId(videoId),
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
        $unwind: "$ownerDetails",
      },
      {
        $project: {
          owner: 0
        }
      }
    ]
    let paginatedVideoComments = [];
    paginatedVideoComments = await Comment.aggregatePaginate(Comment.aggregate(pipeline), {
      page,
      limit,
    });
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "Comments fetched successfully",
          paginatedVideoComments
        )
      );
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while fetching comments",
      error
    );
  }
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { comment } = req.body;
  if (!commentId) throw new ApiError(400, "Comment id is required");
  if (!comment) throw new ApiError(400, "New comment is required");
  const newComment = await Comment.findByIdAndUpdate(
    commentId,
    {
      $set: { content: comment },
    },
    {
      new: true,
    }
  );
  res
    .status(200)
    .json(new ApiResponse(200, "Comment updated successfully", newComment));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!commentId) throw new ApiError(400, "Comment id is required");
  const deletedComment = await Comment.findByIdAndDelete(commentId);
  if (!deletedComment) throw new ApiError(404, "Comment not found");
  res
    .status(200)
    .json(new ApiResponse(200, "Comment deleted successfully", deletedComment));
});

export { addVideoComment, getVideoComments, updateComment, deleteComment };
