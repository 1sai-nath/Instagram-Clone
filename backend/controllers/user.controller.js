import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(401).json({
        message: "something is missing, please try again",
        success: false,
      });
    }

    const user = await User.findOne({ email });
    if (user) {
      return res.status(401).json({
        message: "try different email",
        success: false,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({
      username,
      email,
      password: hashedPassword,
    });
    return res.status(201).json({
      message: "Account has been created successfully",
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(401).json({
        message: "something is missing, please try again",
        success: false,
      });
    }

    let user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        message: "Incorrect email",
        success: false,
      });
    }

    const passMatch = await bcrypt.compare(password, user.password);
    if (!passMatch) {
      return res.status(401).json({
        message: "Invalid password",
        success: false,
      });
    }

    user = {
      _id: user._id,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
      bio: user.bio,
      followers: user.followers,
      following: user.following,
      posts: user.posts,
    };
    const token = await jwt.sign({ userId: user._id }, process.env.SECRET_KEY, {
      expiresIn: "1d",
    });
    return res
      .cookie("token", token, {
        httpOnly: true,
        sameSite: "strict",
        maxAge: 1 * 24 * 60 * 60 * 1000,
      })
      .json({
        message: `welcome back ${user.username}`,
        success: true,
        user,
      });
  } catch (error) {
    console.log(error);
  }
};

export const logout = (_, res) => {
  try {
    return res.cookie("token", "", { maxAge: 0 }).json({
      message: "logout successfully",
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};

export const getProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).select("-password");
    return res.status(200).json({
      user,
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};

export const editProfile = async (req, res) => {
  try {
    const userId = req.id;
    const { bio, gender } = req.body;
    const profilePicture = req.file;
    let cloudResponse;

    if (profilePicture) {
      const fileUri = getDataUri(profilePicture);

      cloudResponse = await cloudinary.uploader.upload(fileUri);
    }

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }
    if (bio) user.bio = bio;
    if (gender) user.gender = gender;
    if (profilePicture) user.profilePicture = cloudResponse.secure_url;

    await user.save();

    return res.status(200).json({
      message: "profile updated successfully",
      success: true,
      user: user,
    });
  } catch (error) {
    console.log(error);
  }
};

export const getSuggestedUsers = async (req, res) => {
  try {
    const suggestedUsers = await User.find({ _id: { $ne: req.id } }).select(
      "-password"
    );

    if (!suggestedUsers) {
      return res.status(400).json({
        message: "currently do not have any users",
      });
    }

    return res.status(200).json({
      success: true,
      users: suggestedUsers,
    });
  } catch (error) {
    console.log(error);
  }
};

export const followOrUnfollow = async (req, res) => {
  try {
    const followKarneWala = req.id;
    const jiskoFollowKarunga = req.params.id;
    if (followKarneWala === jiskoFollowKarunga) {
      return res.status(400).json({
        message: "you cannot follow/unfollow yourself",
        success: false,
      });
    }

    const user = await User.findById(followKarneWala);
    const targetUser =await User.findById(jiskoFollowKarunga);

    if (!user || !targetUser) {
      return res.status(400).json({
        message: "user not found",
        success: false,
      });
    }

    const isFollowing = user.following.includes(jiskoFollowKarunga);
    if (isFollowing) {
      await Promise.all([
        User.updateOne(
          { _id: followKarneWala },
          { $pull: { following: jiskoFollowKarunga } }
        ),
        User.updateOne(
          { _id: jiskoFollowKarunga },
          { $pull: { followers: followKarneWala } }
        ),
      ]);
      return res.status(200).json({
        message: "unfollowed successfully",
        success: true,
      });
    } else {
      await Promise.all([
        User.updateOne(
          { _id: followKarneWala },
          { $push: { following: jiskoFollowKarunga } }
        ),
        User.updateOne(
          { _id: jiskoFollowKarunga },
          { $push: { followers: followKarneWala } }
        ),
      ]);
      return res.status(200).json({
        message: "followed successfully",
        success: true,
      });
    }
  } catch (error) {
    console.log(error);
  }
};
