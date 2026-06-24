const express = require('express');
const authRouter = express.Router();
const { register, login, refresh, logout } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');

authRouter.post('/register', register);
authRouter.post('/login',    login);
authRouter.post('/refresh',  refresh); 
authRouter.post('/logout',   logout);  

authRouter.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = authRouter;