const User = require('../models/User');
const Post = require('../models/Post');
const mongoose = require('mongoose');

const getUserProfile = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid user ID format' });
        }

        const [userData, posts] = await Promise.all([
            User.findById(req.params.id)
                .select('-password')
                .lean(),
            Post.find({ author: req.params.id })
                .sort({ _id: -1 })
                .limit(20)
                .populate('author', 'username fullName profilePic')
                .lean()
        ]);

        if (!userData) return res.status(404).json({ message: 'User not found' });

        const response = {
            ...userData,
            followingCount: userData.following?.length ?? 0,
            following: undefined,
        };

        return res.status(200).json({ user: response, posts });
    } catch (error) {
        console.error("Error in getUserProfile:", error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const getFollowers = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }
        const user = await User.findById(req.params.id)
            .select('followers')
            .populate('followers', 'username fullName profilePic')
            .lean();
        if (!user) return res.status(404).json({ message: 'User not found' });
        return res.status(200).json(user.followers);
    } catch (error) {
        console.error("Error in getFollowers:", error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const getFollowing = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }
        const user = await User.findById(req.params.id)
            .select('following')
            .populate('following', 'username fullName profilePic')
            .lean();
        if (!user) return res.status(404).json({ message: 'User not found' });
        return res.status(200).json(user.following);
    } catch (error) {
        console.error("Error in getFollowing:", error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { fullName, username, bio, profilePic } = req.body;
        const userId = req.user?.id || req.user?._id;

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        if (bio) {
            const lines = bio.split('\n');
            if (lines.length > 6 || bio.length > 200) {
                return res.status(400).json({ message: "Bio limits exceeded" });
            }
        }

        if (username) {
            const existingUser = await User.findOne(
                { username, _id: { $ne: userId } }
            ).select('_id').lean();
            if (existingUser) return res.status(400).json({ message: "Username taken" });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { fullName, username, bio, profilePic },
            { new: true }
        )
        .select('-password')
        .lean();

        return res.status(200).json(updatedUser);
    } catch (error) {
        console.error("Error in updateProfile:", error);
        return res.status(500).json({ message: "Update failed" });
    }
};

const toggleFollow = async (req, res) => {
    try {
        const targetUserId = req.params.id;
        const currentUserId = req.user?.id || req.user?._id;

        if (!currentUserId) return res.status(401).json({ message: 'Unauthorized' });

        if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
            return res.status(400).json({ message: 'Invalid target user ID' });
        }

        if (targetUserId === currentUserId.toString()) {
            return res.status(400).json({ message: "Cannot follow yourself" });
        }

        const isFollowing = await User.exists({
            _id: targetUserId,
            followers: currentUserId
        });

        const targetUpdate = isFollowing
            ? { $pull:    { followers: new mongoose.Types.ObjectId(currentUserId) } }
            : { $addToSet: { followers: new mongoose.Types.ObjectId(currentUserId) } };

        const currentUpdate = isFollowing
            ? { $pull:    { following: new mongoose.Types.ObjectId(targetUserId) } }
            : { $addToSet: { following: new mongoose.Types.ObjectId(targetUserId) } };

        await Promise.all([
            User.findByIdAndUpdate(targetUserId, targetUpdate),
            User.findByIdAndUpdate(currentUserId, currentUpdate)
        ]);

        return res.status(200).json({ message: isFollowing ? "Unfollowed" : "Followed" });
    } catch (error) {
        console.error("Error in toggleFollow:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const searchUsers = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.status(200).json([]);

        const searchRegex = new RegExp(q, 'i');

        const users = await User.find({
            $or: [
                { username: searchRegex },
                { fullName: searchRegex }
            ]
        })
        .select('username fullName profilePic')
        .limit(10)
        .lean();

        return res.status(200).json(users);
    } catch (error) {
        console.error("Error in searchUsers:", error);
        return res.status(500).json({ message: "Search failed", error: error.message });
    }
};

const getMe = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized: Missing verification payload' });
        }

        const user = await User.findById(userId)
            .select('username fullName profilePic following')
            .lean();

        if (!user) return res.status(404).json({ message: 'User not found' });
        return res.status(200).json(user);
    } catch (error) {
        console.error("Error in getMe:", error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const getFollowSuggestions = async (req, res) => {
    try {
        const currentUserId = req.user?.id || req.user?._id;
        if (!currentUserId) return res.status(401).json({ message: 'Unauthorized' });

        const user = await User.findById(currentUserId).select('following').lean();
        const followingIds = user?.following || [];

        const suggestions = await User.aggregate([
            {
                $match: {
                    _id: {
                        $ne: new mongoose.Types.ObjectId(currentUserId),
                        $nin: followingIds.map(id => new mongoose.Types.ObjectId(id))
                    }
                }
            },
            {
                $lookup: {
                    from: 'posts',
                    localField: '_id',
                    foreignField: 'author',
                    as: 'activePosts'
                }
            },
            {
                $match: {
                    'activePosts.0': { $exists: true }
                }
            },
            {
                $sample: { size: 5 }
            },
            {
                $project: {
                    username: 1,
                    fullName: 1,
                    profilePic: 1
                }
            }
        ]);

        return res.status(200).json(suggestions);
    } catch (error) {
        console.error("Error in getFollowSuggestions:", error);
        return res.status(500).json({ message: 'Server error' });
    }
};

const getPopularUsers = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit, 10) || 5;
        const currentUserId = req.user?.id || req.user?._id;

        const popularUsers = await User.aggregate([
            {
                $match: currentUserId 
                    ? { _id: { $ne: new mongoose.Types.ObjectId(currentUserId) } } 
                    : {}
            },
            {
                $addFields: {
                    followersCount: { $size: { $ifNull: ["$followers", []] } }
                }
            },
            { $sort: { followersCount: -1, _id: 1 } },
            { $limit: limit },
            {
                $project: {
                    username: 1,
                    fullName: 1,
                    profilePic: 1,
                    followersCount: 1
                }
            }
        ]);

        return res.status(200).json(popularUsers);
    } catch (error) {
        console.error("Error in getPopularUsers:", error);
        return res.status(500).json({ message: 'Server error fetching popular directory' });
    }
};

module.exports = { 
    getUserProfile, 
    getFollowers, 
    getFollowing, 
    updateProfile, 
    toggleFollow, 
    searchUsers, 
    getMe, 
    getFollowSuggestions,
    getPopularUsers
};