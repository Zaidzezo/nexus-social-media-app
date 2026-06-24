const mongoose = require('mongoose');
const Post = require('../models/Post');
const User = require('../models/User');
const Comment = require('../models/Comment');
const cloudinary = require('../config/cloudinary');

const createPost = async (req, res) => {
    try {
        const { content, image } = req.body;
        const userId = req.user?.id || req.user?._id;

        const hasContent = content && content.trim().length > 0;
        const hasImage = image && image.length > 0;

        if (!hasContent && !hasImage) {
            return res.status(400).json({ message: 'Content or image required' });
        }

        let imageUrl = null;

        if (hasImage && typeof image === 'string') {
            if (!image.startsWith('data:image/')) {
                return res.status(400).json({ message: 'Invalid image format' });
            }
            
            const approximateSizeBytes = image.length * 0.75;
            if (approximateSizeBytes > 4 * 1024 * 1024) {
                return res.status(400).json({ message: 'Image too large. Maximum size is 4MB.' });
            }
            
            try {
                const uploadResponse = await cloudinary.uploader.upload(image, {
                    folder: 'taskflow_posts',
                });
                imageUrl = uploadResponse.secure_url;
            } catch (uploadError) {
                console.error('Cloudinary Upload Failure:', uploadError);
                return res.status(500).json({ message: 'Image upload failed on cloud server' });
            }
        }

        const newPost = new Post({
            content: hasContent ? content.trim() : "",
            image: imageUrl,
            author: userId || null
        });

        await newPost.save();
        await newPost.populate('author', 'username fullName profilePic');

        return res.status(201).json({ message: 'Post created successfully', post: newPost });
    } catch (error) {
        console.error('Create post error:', error.message);
        return res.status(400).json({ message: error.message });
    }
};

const getPosts = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit, 10) || 10;
        const cursor = req.query.cursor;

        let query = {};
        if (cursor && cursor !== 'undefined' && cursor !== 'null') {
            if (mongoose.Types.ObjectId.isValid(cursor)) {
                query._id = { $lt: new mongoose.Types.ObjectId(cursor) };
            } else {
                return res.status(400).json({ message: 'Malformed cursor format provided.' });
            }
        }

        const posts = await Post.find(query)
            .sort({ _id: -1 }) 
            .limit(limit + 1)
            .populate('author', 'fullName username profilePic')
            .lean();

        const hasNextPage = posts.length > limit;
        if (hasNextPage) posts.pop();

        const nextCursor = posts.length > 0 ? posts[posts.length - 1]._id : null;

        return res.status(200).json({
            posts,
            meta: { nextCursor, hasNextPage }
        });
    } catch (error) {
        console.error("Error fetching posts:", error);
        return res.status(500).json({ message: "Server error fetching posts" });
    }
};

const getFollowingPosts = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const limit = parseInt(req.query.limit, 10) || 10;
        const cursor = req.query.cursor;

        if (cursor && cursor !== 'undefined' && cursor !== 'null') {
            if (!mongoose.Types.ObjectId.isValid(cursor)) {
                return res.status(400).json({ message: 'Malformed cursor format provided.' });
            }
        }

        const user = await User.findById(userId).select('following').lean();
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (!user.following || user.following.length === 0) {
            return res.status(200).json({
                posts: [],
                meta: { nextCursor: null, hasNextPage: false }
            });
        }

        let query = { author: { $in: user.following } };
        if (cursor && cursor !== 'undefined' && cursor !== 'null') {
            query._id = { $lt: new mongoose.Types.ObjectId(cursor) };
        }

        const posts = await Post.find(query)
            .sort({ _id: -1 })
            .limit(limit + 1)
            .populate('author', 'username fullName profilePic')
            .lean();

        const hasNextPage = posts.length > limit;
        if (hasNextPage) posts.pop();

        const nextCursor = posts.length > 0 ? posts[posts.length - 1]._id : null;

        return res.status(200).json({
            posts,
            meta: { nextCursor, hasNextPage }
        });
    } catch (error) {
        console.error("Error fetching following posts:", error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const deletePost = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;
        const postToDelete = await Post.findById(req.params.id).lean();
        if (!postToDelete) return res.status(404).json({ message: 'Post not found' });

        if (postToDelete.author && userId && postToDelete.author.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete' });
        }

        if (postToDelete.image && postToDelete.image.includes('res.cloudinary.com')) {
            try {
                const urlParts = postToDelete.image.split('/');
                const folderName = 'taskflow_posts';
                const folderIndex = urlParts.indexOf(folderName);
                if (folderIndex !== -1) {
                    const fileWithExtension = urlParts.slice(folderIndex).join('/');
                    const publicId = fileWithExtension.split('.')[0];
                    await cloudinary.uploader.destroy(publicId);
                }
            } catch (cloudDeleteError) {
                console.error('Cloudinary cleanup failed:', cloudDeleteError.message);
            }
        }

        await Post.findByIdAndDelete(req.params.id);
        await Comment.deleteMany({ postId: req.params.id });

        return res.status(200).json({ message: 'Post and associated media deleted' });
    } catch (error) {
        console.error('Delete post error:', error.message);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid ID format' });
        }
        return res.status(500).json({ message: 'Server error deleting post' });
    }
};

const updatePost = async (req, res) => {
    try {
        const { content } = req.body;
        const userId = req.user?.id || req.user?._id;

        if (!content || !content.trim()) {
            return res.status(400).json({ message: 'Content required' });
        }

        const postToUpdate = await Post.findById(req.params.id).select('author').lean();
        if (!postToUpdate) return res.status(404).json({ message: 'Post not found' });

        if (postToUpdate.author && userId && postToUpdate.author.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const updated = await Post.findByIdAndUpdate(
            req.params.id,
            { content: content.trim() },
            { new: true }
        )
        .populate('author', 'username fullName profilePic')
        .lean();

        return res.status(200).json({ message: 'Post updated', post: updated });
    } catch (error) {
        console.error('Update post error:', error.message);
        return res.status(400).json({ message: 'Update failed' });
    }
};

const toggleLike = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id || req.user?._id;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const targetPost = await Post.findById(id).select('likes').lean();
        if (!targetPost) return res.status(404).json({ message: 'Post not found' });

        const isLiked = targetPost.likes.some(uid => uid.toString() === userId.toString());
        const updateOperator = isLiked 
            ? { $pull: { likes: new mongoose.Types.ObjectId(userId) } }
            : { $addToSet: { likes: new mongoose.Types.ObjectId(userId) } };

        const updated = await Post.findByIdAndUpdate(
            id,
            updateOperator,
            { new: true, select: 'likes' }
        ).lean();

        return res.status(200).json({ likes: updated.likes });
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    createPost,
    getPosts,
    deletePost,
    updatePost,
    toggleLike,
    getFollowingPosts
};