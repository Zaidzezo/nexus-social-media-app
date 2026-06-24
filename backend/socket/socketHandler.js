const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

const socketHandler = (io) => {

    // ── AUTH MIDDLEWARE ──────────────────────────────────────────────────────────
    io.use(async (socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) return next(new Error('Authentication required'));
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.id;
            const user = await User.findById(decoded.id).select('fullName').lean();
            socket.userFullName = user?.fullName || 'Someone';
            next();
        } catch {
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        const userId = socket.userId;
        socket.join(userId);
        console.log(`Socket connected: ${userId}`);

        // ── JOIN / LEAVE CONVERSATION ROOM ───────────────────────────────────────
        socket.on('join_chat', ({ conversationId }) => {
            socket.join(`chat:${conversationId}`);
        });

        socket.on('leave_chat', ({ conversationId }) => {
            socket.leave(`chat:${conversationId}`);
        });

        // ── TYPING INDICATORS ────────────────────────────────────────────────────
        socket.on('typing', ({ conversationId }) => {
            socket.to(`chat:${conversationId}`).emit('user_typing', {
                userId,
                fullName: socket.userFullName,
                conversationId
            });
        });

        socket.on('stop_typing', ({ conversationId }) => {
            socket.to(`chat:${conversationId}`).emit('user_stop_typing', {
                userId,
                conversationId
            });
        });

        // ── SEND MESSAGE ─────────────────────────────────────────────────────────
        socket.on('send_message', async ({ conversationId, content, attachments = [], replyTo = null }, callback) => {
            try {
                const hasContent     = content?.trim().length > 0;
                const hasAttachments = attachments.length > 0;
                if (!hasContent && !hasAttachments)
                    return callback?.({ error: 'Message cannot be empty' });

                const conversation = await Conversation.findOne({
                    _id: conversationId,
                    participants: userId
                });
                if (!conversation)
                    return callback?.({ error: 'Not authorized' });

                const message = await Message.create({
                    conversationId,
                    sender: userId,
                    content:    content?.trim() || '',
                    attachments: attachments.filter(u => typeof u === 'string' && u.startsWith('http')),
                    replyTo:    replyTo || null,
                    readBy:     [userId]
                });

                await message.populate('sender', 'username fullName profilePic');
                if (replyTo) {
                    await message.populate({
                        path: 'replyTo',
                        select: 'content sender attachments isDeleted',
                        populate: { path: 'sender', select: 'username fullName profilePic' }
                    });
                }

                const recipientIds = conversation.participants
                    .map(id => id.toString())
                    .filter(id => id !== userId);

                const unreadUpdate = {};
                recipientIds.forEach(id => {
                    unreadUpdate[`unreadCount.${id}`] = (conversation.unreadCount?.get(id) || 0) + 1;
                });

                await Conversation.findByIdAndUpdate(conversationId, {
                    lastMessage: message._id,
                    updatedAt:   new Date(),
                    ...unreadUpdate
                });

                socket.to(`chat:${conversationId}`).emit('new_message', { conversationId, message });

                recipientIds.forEach(recipientId => {
                    io.to(recipientId).emit('new_message_notification', { conversationId, senderId: userId });
                });

                callback?.({ success: true, message });
            } catch (error) {
                console.error('Socket send_message error:', error);
                callback?.({ error: 'Server error' });
            }
        });

        // ── EDIT MESSAGE ─────────────────────────────────────────────────────────
        socket.on('edit_message', async ({ messageId, content }, callback) => {
            try {
                if (!content?.trim())
                    return callback?.({ error: 'Content required' });

                const message = await Message.findOne({ _id: messageId, isDeleted: false });
                if (!message)
                    return callback?.({ error: 'Message not found' });
                if (message.sender.toString() !== userId)
                    return callback?.({ error: 'Not authorized' });

                message.content  = content.trim();
                message.isEdited = true;
                await message.save();
                
                await message.populate('sender', 'username fullName profilePic');
                if (message.replyTo) {
                    await message.populate({
                        path: 'replyTo',
                        select: 'content sender attachments isDeleted',
                        populate: { path: 'sender', select: 'username fullName profilePic' }
                    });
                }

                io.to(`chat:${message.conversationId}`).emit('message_updated', { message });

                callback?.({ success: true, message });
            } catch (error) {
                console.error('Socket edit_message error:', error);
                callback?.({ error: 'Server error' });
            }
        });

        // ── DELETE MESSAGE ────────────────────────────────────────────────
        socket.on('delete_message', async ({ messageId }, callback) => {
            try {
                const message = await Message.findById(messageId);
                if (!message)
                    return callback?.({ error: 'Message not found' });
                if (message.sender.toString() !== userId)
                    return callback?.({ error: 'Not authorized' });

                const conversationId = message.conversationId.toString();

                message.isDeleted   = true;
                message.content     = 'This message was deleted';
                message.attachments = [];
                await message.save();

                io.to(`chat:${conversationId}`).emit('message_deleted', { messageId });

                callback?.({ success: true, messageId });
            } catch (error) {
                console.error('Socket delete_message error:', error);
                callback?.({ error: 'Server error' });
            }
        });

        // ── MARK AS READ ─────────────────────────────────────────────────────────
socket.on('mark_read', async ({ conversationId }) => {
    try {
        const conversation = await Conversation.findOneAndUpdate(
            { _id: conversationId, participants: userId },
            { [`unreadCount.${userId}`]: 0 }
        );

        if (!conversation) return;

        await Message.updateMany(
            {
                conversationId,
                sender:  { $ne: userId },
                readBy:  { $nin: [userId] }
            },
            { $addToSet: { readBy: userId } }
        );

        const otherParticipantIds = conversation.participants
            .map(p => p.toString())
            .filter(p => p !== userId);

        otherParticipantIds.forEach(participantId => {
            io.to(participantId).emit('messages_read', {
                conversationId,
                readBy: userId
            });
        });

    } catch (error) {
        console.error('Socket mark_read error:', error);
    }
});

        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${userId}`);
        });
    });
};

module.exports = socketHandler;