const express = require('express');
const router = express.Router();
const { createComment, getComments, deleteComment, updateComment } = require('../controllers/commentController');
const protect = require('../middleware/authMiddleware');

router.post('/', protect, createComment);
router.get('/:postId', getComments);
router.put('/:commentId', protect, updateComment);
router.delete('/:commentId', protect, deleteComment);

module.exports = router;