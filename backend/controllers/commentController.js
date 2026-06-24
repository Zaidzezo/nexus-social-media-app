const Comment = require('../models/Comment');
const Post = require('../models/Post');

const createComment = async (req, res) => {
    try {
        const { postId, content } = req.body;
        const userId = req.user.id;

        if (!content) return res.status(400).json({ message: 'Content is required' });
        if (!postId)   return res.status(400).json({ message: 'Post ID is required' });

        const postExists = await Post.exists({ _id: postId });
        if (!postExists) return res.status(404).json({ message: 'Post not found or deleted' });

        const newComment = new Comment({ postId, userId, content });
        await newComment.save();

        await Post.findByIdAndUpdate(postId, { $inc: { commentCount: 1 } });
        await newComment.populate('userId', 'username fullName profilePic');

        return res.status(201).json({ message: 'Comment created successfully', comment: newComment });
    } catch (error) {
        console.error('Error creating comment:', error);
        return res.status(500).json({ message: 'Server error while creating comment' });
    }
};

const getComments = async (req, res) => {
    try {
        const { postId } = req.params;
        if (!postId) return res.status(400).json({ message: 'Post ID is required' });

        const comments = await Comment.find({ postId })
            .populate('userId', 'username fullName profilePic')
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();

        return res.status(200).json({ comments });
    } catch (error) {
        console.error('Error fetching comments:', error);
        return res.status(500).json({ message: 'Server error while fetching comments' });
    }
};

const deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user?.id || req.user?._id?.toString();

        if (!commentId) return res.status(400).json({ message: 'Comment ID is required' });

        const comment = await Comment.findById(commentId).select('userId postId').lean();
        if (!comment) return res.status(404).json({ message: 'Comment not found or already deleted' });

        const post = await Post.findById(comment.postId).select('author').lean();
        if (!post) return res.status(404).json({ message: 'Associated post not found or deleted' });

        const isAuthor    = comment.userId?.toString() === userId;
        const isPostOwner = post.author?.toString()    === userId;

        if (!isAuthor && !isPostOwner) {
            return res.status(403).json({ message: 'Unauthorized to delete this comment' });
        }

        await Comment.findByIdAndDelete(commentId);
        await Post.findByIdAndUpdate(comment.postId, {
            $inc: { commentCount: -1 }
        });

        return res.status(200).json({ message: 'Comment deleted successfully' });
    } catch (error) {
        console.error('Error deleting comment:', error);
        return res.status(500).json({ message: 'Server error while deleting comment' });
    }
};

const updateComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const { content } = req.body;
        const userId = req.user.id;

        if (!content)   return res.status(400).json({ message: 'Content is required' });
        if (!commentId) return res.status(400).json({ message: 'Comment ID is required' });

        const comment = await Comment.findById(commentId);
        if (!comment) return res.status(404).json({ message: 'Comment not found or already deleted' });

        if (comment.userId.toString() !== userId) {
            return res.status(403).json({ message: 'Unauthorized to update this comment' });
        }

        comment.content = content;
        await comment.save();
        await comment.populate('userId', 'username fullName profilePic');

        return res.status(200).json({ message: 'Comment updated successfully', comment });
    } catch (error) {
        console.error('Error updating comment:', error);
        return res.status(500).json({ message: 'Server error while updating comment' });
    }
};

module.exports = { createComment, getComments, deleteComment, updateComment };