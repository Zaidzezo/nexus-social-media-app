const express = require('express');
const userRouter = express.Router();
const {
    getUserProfile,
    getFollowers,
    getFollowing,
    updateProfile,
    toggleFollow,
    searchUsers,
    getMe,
    getFollowSuggestions,
    getPopularUsers
} = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

userRouter.put('/update', authMiddleware, updateProfile);
userRouter.put('/toggleFollow/:id', authMiddleware, toggleFollow);
userRouter.get('/search', authMiddleware, searchUsers);
userRouter.get('/suggestions', authMiddleware, getFollowSuggestions);
userRouter.get('/popular', authMiddleware, getPopularUsers);
userRouter.get('/me', authMiddleware, getMe);
userRouter.get('/:id', authMiddleware, getUserProfile);
userRouter.get('/:id/followers', authMiddleware, getFollowers);
userRouter.get('/:id/following', authMiddleware, getFollowing);

module.exports = userRouter;