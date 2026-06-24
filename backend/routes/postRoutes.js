const express = require('express');
const router = express.Router();
const { 
    createPost, 
    getPosts, 
    deletePost, 
    updatePost, 
    toggleLike, 
    getFollowingPosts 
} = require('../controllers/postController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, getPosts);
router.get("/following", authMiddleware, getFollowingPosts);

router.post('/', authMiddleware, createPost);

router.put('/:id/like', authMiddleware, toggleLike);
router.put('/:id', authMiddleware, updatePost);

router.delete('/:id', authMiddleware, deletePost);

module.exports = router;