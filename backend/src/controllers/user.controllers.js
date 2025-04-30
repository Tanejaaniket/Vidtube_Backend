import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { User } from "../models/user.models.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import mongoose, { Mongoose } from "mongoose";
import {
  changeAccountDetailsMail,
  changePasswordMail,
  loginMail,
  signupMail,
} from "../utils/mailer.js";

const registerUser = asyncHandler(async (req, res) => {
  const { fullname, email, password, username } = req.body;

  //* Checks if all fields are filled
  if ([fullname, username, email, password].includes("")) {
    throw new ApiError(400, "All fields are required");
  }

  //*Finds if user already exists by using either username or email
  const exsistingUserWithUsername = await User.findOne({ username });

  if (exsistingUserWithUsername) {
    throw new ApiError(409, "User already exists");
  }

  const exsistingUserWithEmail = await User.findOne({ email });

  if (exsistingUserWithEmail) {
    throw new ApiError(410, "User already exists");
  }

  //* This fetches images uploaded as avatar
  //* Req.files is available due to multer middleware
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }
  let avatar = "";
  let coverImage = "";
  try {
    // console.log(avatarLocalPath,coverLocalPath);
    avatar = await uploadOnCloudinary(avatarLocalPath);
    if (coverLocalPath) {
      coverImage = await uploadOnCloudinary(coverLocalPath);
    }
  } catch (error) {
    throw new ApiError(500, "Image could not be uploaded", error);
  }

  try {
    const user = await User.create({
      fullname,
      username: username.toLowerCase(),
      email,
      password,
      avatar: avatar?.secure_url,
      coverImage: coverImage?.secure_url || "",
    });

    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );
    if (!createdUser) {
      throw new ApiError(500, "User could not be created");
    }
    const { accessToken, refreshToken } =
      await generateAccessTokenAndRefreshToken(user._id);

    const options = {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: 10 * 24 * 60 * 60 * 1000,
      expires: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    };

    await signupMail(user.username, user.email).catch((error) => {
      console.log(error);
    });

    res
      .status(201)
      .cookie("refreshToken", refreshToken, options)
      .cookie("accessToken", accessToken, options)
      .json(
        new ApiResponse(
          201,
          "User created successfully",
          createdUser,
          accessToken,
          refreshToken
        )
      );
  } catch (error) {
    console.log("User creation failed", error);
    if (avatar) {
      deleteFromCloudinary(avatar.public_id);
    }
    if (coverImage) {
      deleteFromCloudinary(coverImage.public_id);
    }
    throw new ApiError(500, "User could not be created", error);
  }
});

const generateAccessTokenAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found");
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Token could not be generated", error);
  }
};

const loginUser = asyncHandler(async (req, res) => {
  //* Gets username, email and password
  const { username, email, password } = req.body;

  //*Validation of user
  if (!username && !email)
    throw new ApiError(400, "Username or email is required");
  if (!password) throw new ApiError(400, "Password is required");

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) throw new ApiError(404, "User not found");

  //* Password validation
  const isPasswordCorrect = await user.isPasswordCorrect(password);
  if (!isPasswordCorrect) throw new ApiError(401, "Password is incorrect");

  //* Generate access token and refresh token(it also updates refresh token in database)
  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshToken(user._id);

  //*Fetching latest updated user
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  //*Options for cookie secure false allows them on http path / ensure cookie is accessible on all paths
  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    maxAge: 10 * 24 * 60 * 60 * 1000,
    expires: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
  };

  await loginMail(loggedInUser.username, loggedInUser.email).catch((error) => {
    console.log(error);
  });
  res
    .status(200)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(
      new ApiResponse(200, "User logged in successfully", {
        user: loggedInUser,
        refreshToken,
        accessToken,
      })
    );
});

const refreshAcessToken = asyncHandler(async (req, res) => {
  //* Gets refresh token from cookies
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

  //* Check if refresh token is present
  if (!refreshToken) throw new ApiError(401, "Refresh token is required");

  //* Decoding and validation of refresh token
  try {
    const decodedToken = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken?._id);
    if (!user) throw new ApiError(404, "Invalid refresh token");

    //*Check if refresh token is not expired
    if (refreshToken !== user?.refreshToken)
      throw new ApiError(401, "Invalid refresh token");

    //* Generate access token and refresh token
    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessTokenAndRefreshToken(user._id);

    const options = {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: 10 * 24 * 60 * 60 * 1000,
      expires: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    };
    res
      .status(200)
      .cookie("refreshToken", newRefreshToken, options)
      .cookie("accessToken", accessToken, options)
      .json(
        new ApiResponse(200, "Token refreshed successfully", {
          accessToken,
          refreshToken: newRefreshToken,
        })
      );
  } catch (error) {
    throw new ApiError(500, "Token could not be refreshed", error);
  }
});

const logoutUser = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) throw new ApiError(404, "User not found");
  //*Set refresh token to null clearly implying that user logged out
  User.findByIdAndUpdate(user?._id, {
    $set: { refreshToken: null },
  });
  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
  };
  res
    .status(200)
    .clearCookie("refreshToken", options)
    .clearCookie("accessToken", options)
    .json(new ApiResponse(200, "User logged out successfully"));
});

const isUsernameUnique = asyncHandler(async (req, res) => {
  const { username } = req.params;

  //*Finds if user already exists by using either username or email
  const exsistingUserWithUsername = await User.findOne({ username });

  if (exsistingUserWithUsername) {
    throw new ApiError(410, "User already exists");
  }

  res.status(201).json(
    new ApiResponse(201, "Username is unique", {
      isUsernameUnique: true,
    })
  );
});
//TODO: Implement the following
//changeCurrentPassword
//getCurrentUser
//updateAccountUser
//updateUserAvatar
//updateUserCoverImage

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword) throw new ApiError(400, "Old password is required");
  if (!newPassword) throw new ApiError(400, "New password is required");
  const userId = req.user?._id;

  //?Dont disselect pasword field as it is required for checking in the is password correct method

  const user = await User.findById(userId).select("-refreshToken");
  if (!user) throw new ApiError(404, "User not found");
  const IsPasswordValid = await user.isPasswordCorrect(oldPassword);
  if (!IsPasswordValid) throw new ApiError(401, "Old password is incorrect");
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  await changePasswordMail(user.username, user.email).catch((err) => {
    console.log(err);
  });
  res
    .status(200)
    .json(new ApiResponse(200, "Password changed successfully", {}));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, "Success", req.user));
});

const updateUserAccount = asyncHandler(async (req, res) => {
  const { fullname, username, email } = req.body;
  if (!fullname || !username || !email)
    throw new ApiError(400, "All fields are required");
  const userId = req.user?._id;
  const exsistingUser = await User.findOne({ username, fullname, email });

  if (exsistingUser) {
    throw new ApiError(409, "User already exists");
  }

  const user = await User.findByIdAndUpdate(
    userId,
    {
      $set: { fullname, email, username },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");
  await changeAccountDetailsMail(user.username, user.email);
  res.status(200).json(new ApiResponse(200, "User updated successfully", user));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarPath = req.file?.path;
  if (!avatarPath) throw new ApiError(400, "Avatar is required");
  let avatar = "";
  try {
    avatar = await uploadOnCloudinary(avatarPath);
  } catch (error) {
    throw new ApiError(500, "Something went wrong while uploading avatar");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: { avatar: avatar?.secure_url },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");
  res
    .status(200)
    .json(new ApiResponse(200, "User avatar updated successfully", user));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverPath = req.file?.path;
  if (!coverPath) throw new ApiError(400, "Cover image is required");
  let coverImage = "";
  try {
    coverImage = await uploadOnCloudinary(coverPath);
  } catch (error) {
    throw new ApiError(500, "Something went wrong while uploading cover image");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: { coverImage: coverImage?.secure_url },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");
  res
    .status(200)
    .json(new ApiResponse(200, "User cover image updated successfully", user));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username.trim()) throw new ApiError(400, "Username is required");
  const channel = await User.aggregate([
    {
      $match: {
        username: username.toLowerCase(),
      },
    },
    {
      //*Gives a lot of new documents in the Subscibers field
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "Subscibers",
      },
    },
    {
      //*Gives a lot of new documents in the SubsciberedTo field
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "SubscribedTo",
      },
    },
    {
      $addFields: {
        isSubscribed: {
          $cond: {
            //*If id of current user in present in the subscriber field of Subcribers documents
            if: {
              //* In requires second argument as array of fields in document
              $in: [
                new mongoose.Types.ObjectId(req.user?.id),
                "$Subscibers.subscriber",
              ],
            },
            then: true,
            else: false,
          },
        },
        subscribersCount: {
          //*This $ sign is required when we name something manually using as if it is already a mongoDb document you dont need to use $ sign
          $size: "$Subscibers",
        },
        channelsSubscribed: {
          $size: "$SubscribedTo",
        },
      },
    },
    {
      $project: {
        fullname: 1,
        username: 1,
        email: 1,
        avatar: 1,
        coverImage: 1,
        subscribersCount: 1,
        channelsSubscribed: 1,
        isSubscribed: 1,
      },
    },
  ]);
  if (!channel.length) throw new ApiError(404, "Channel not found");
  res
    .status(200)
    .json(
      new ApiResponse(200, "Channel profile fetched successfully", channel[0])
    );
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        //* You cannot pass the id in the form of string you have to pass it after transforming it into mongoose object
        _id: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "ownerDetails",
              pipeline: [
                {
                  $project: {
                    fullname: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              ownerDetails: {
                $first: "$ownerDetails",
              },
            },
          },
        ],
      },
    },
  ]);
  if (!user.length) throw new ApiError(404, "User not found");

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Watch history fetched successfully",
        user[0]?.watchHistory
      )
    );
});

export {
  registerUser,
  loginUser,
  refreshAcessToken,
  logoutUser,
  changeCurrentPassword,
  getCurrentUser,
  updateUserAccount,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
  isUsernameUnique,
};
