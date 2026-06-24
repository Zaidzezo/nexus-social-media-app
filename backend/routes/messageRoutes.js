const express = require('express');
const router = express.Router();

const {
    getOrCreateConversation,
    getInbox,
    getConversation,
    getMessages,
    markAsRead,
    editMessage,
    deleteMessage,
    uploadAttachment
} = require('../controllers/messageController');

const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/conversations', getOrCreateConversation);
router.get('/conversations', getInbox);
router.get('/conversations/:conversationId', getConversation);
router.get('/conversations/:conversationId/messages', getMessages);
router.put('/conversations/:conversationId/read', markAsRead);
router.put('/conversations/:conversationId/messages/:messageId', editMessage);
router.delete('/conversations/:conversationId/messages/:messageId', deleteMessage);
router.post('/upload-attachment', uploadAttachment);

module.exports = router;