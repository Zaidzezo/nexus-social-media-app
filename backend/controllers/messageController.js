const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const cloudinary = require('../config/cloudinary');

// ── CONVERSATIONS

const getOrCreateConversation = async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const { targetUserId } = req.body;

        if (!targetUserId)
            return res.status(400).json({ message: 'Target user required' });
        if (targetUserId === currentUserId)
            return res.status(400).json({ message: 'Cannot message yourself' });

        let conversation = await Conversation.findOne({
            participants: { $all: [currentUserId, targetUserId], $size: 2 }
        })
        .populate('participants', 'username fullName profilePic')
        .populate('lastMessage');

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [currentUserId, targetUserId],
                unreadCount: { [currentUserId]: 0, [targetUserId]: 0 }
            });
            conversation = await Conversation.findById(conversation._id)
                .populate('participants', 'username fullName profilePic');
        }

        res.status(200).json(conversation);
    } catch (error) {
        console.error('getOrCreateConversation error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getInbox = async (req, res) => {
    try {
        const conversations = await Conversation.find({ participants: req.user.id })
            .sort({ updatedAt: -1 })
            .populate('participants', 'username fullName profilePic')
            .populate('lastMessage');

        res.status(200).json(conversations);
    } catch (error) {
        console.error('getInbox error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getConversation = async (req, res) => {
    try {
        const conversation = await Conversation.findOne({
            _id: req.params.conversationId,
            participants: req.user.id
        }).populate('participants', 'username fullName profilePic');

        if (!conversation)
            return res.status(403).json({ message: 'Not authorized' });

        res.status(200).json(conversation);
    } catch (error) {
        console.error('getConversation error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ── MESSAGES

const getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const limit  = parseInt(req.query.limit, 10) || 20;
        const cursor = req.query.cursor;

        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: req.user.id
        });
        if (!conversation)
            return res.status(403).json({ message: 'Not authorized' });

        const query = { conversationId };
        if (cursor && mongoose.Types.ObjectId.isValid(cursor)) {
            query._id = { $lt: new mongoose.Types.ObjectId(cursor) };
        }

        const messages = await Message.find(query)
            .sort({ _id: -1 })
            .limit(limit + 1)
            .populate('sender', 'username fullName profilePic')
            .populate({
                path: 'replyTo',
                select: 'content sender attachments isDeleted',
                populate: { path: 'sender', select: 'username fullName profilePic' }
            })
            .lean();

        const hasMore = messages.length > limit;
        if (hasMore) messages.pop();
        messages.reverse();

        const nextCursor = hasMore ? messages[0]._id : null;

        res.status(200).json({ messages, meta: { nextCursor, hasMore } });
    } catch (error) {
        console.error('getMessages error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const markAsRead = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user.id;

        await Conversation.findOneAndUpdate(
            { _id: conversationId, participants: userId },
            { [`unreadCount.${userId}`]: 0 }
        );


        req.io.to(conversationId).emit('messages_read', {
            conversationId,
            readBy: userId
        });

        res.status(200).json({ message: 'Marked as read' });
    } catch (error) {
        console.error('markAsRead error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ── EDIT MESSAGE

const editMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { content }   = req.body;
        const userId        = req.user.id;

        if (!content?.trim())
            return res.status(400).json({ message: 'Content required' });

        const message = await Message.findOne({ _id: messageId, isDeleted: false });
        if (!message)
            return res.status(404).json({ message: 'Message not found' });
        if (message.sender.toString() !== userId)
            return res.status(403).json({ message: 'Not authorized' });

        message.content  = content.trim();
        message.isEdited = true;
        await message.save();
        await message.populate('sender', 'username fullName profilePic');

        res.status(200).json(message);
    } catch (error) {
        console.error('editMessage error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ── SOFT DELETE MESSAGE

const deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId        = req.user.id;

        const message = await Message.findById(messageId);
        if (!message)
            return res.status(404).json({ message: 'Message not found' });
        if (message.sender.toString() !== userId)
            return res.status(403).json({ message: 'Not authorized' });

        message.isDeleted  = true;
        message.content    = 'This message was deleted';
        message.attachments = [];
        await message.save();

        res.status(200).json({ messageId, isDeleted: true });
    } catch (error) {
        console.error('deleteMessage error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ── UPLOAD ATTACHMENT

const uploadAttachment = async (req, res) => {
    try {
        const { image } = req.body;
        if (!image)
            return res.status(400).json({ message: 'Image required' });

        if (image.length * 0.75 > 10 * 1024 * 1024)
            return res.status(400).json({ message: 'Image too large (max 10MB)' });

        const result = await cloudinary.uploader.upload(image, {
            folder: 'dm_attachments'
        });

        res.status(200).json({ url: result.secure_url });
    } catch (error) {
        console.error('uploadAttachment error:', error);
        res.status(500).json({ message: 'Upload failed' });
    }
};

module.exports = {
    getOrCreateConversation,
    getInbox,
    getConversation,
    getMessages,
    markAsRead,
    editMessage,
    deleteMessage,
    uploadAttachment
};