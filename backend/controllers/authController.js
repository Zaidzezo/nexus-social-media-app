const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateAccessToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
};

const generateRefreshToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' });
};

const register = async (req, res) => {
    try {
        const { username, email, password, fullName } = req.body;

        if (await User.findOne({ email })) {
            return res.status(400).json({ message: 'Email already exists, try logging in' });
        }
        if (await User.findOne({ username })) {
            return res.status(400).json({ message: 'Username is already taken' });
        }

        const newUser = new User({ username, email, password, fullName });
        await newUser.save();

        return res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Error during registration:', error);
        return res.status(500).json({ message: 'Server error during registration' });
    }
};

const login = async (req, res) => {
    try {
        const { identifier, password } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({ message: 'Identifier and password required' });
        }

        const query = identifier.includes('@')
            ? { email: identifier.toLowerCase() }
            : { username: identifier };

        const user = await User.findOne(query);
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const accessToken  = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
            message: 'Login successful',
            token: accessToken,
            userId: user._id,
        });
    } catch (error) {
        console.error('Error during login:', error);
        return res.status(500).json({ message: 'Server error during login' });
    }
};

const refresh = async (req, res) => {
    try {
        const token = req.cookies.refreshToken;

        if (!token) {
            return res.status(401).json({ message: 'No refresh token' });
        }

        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        const accessToken = generateAccessToken(decoded.id);

        return res.status(200).json({ token: accessToken });
    } catch (error) {
        res.clearCookie('refreshToken');
        return res.status(401).json({ message: 'Session expired, please log in again' });
    }
};

const logout = async (req, res) => {
    res.clearCookie('refreshToken');
    return res.status(200).json({ message: 'Logged out successfully' });
};

module.exports = { register, login, refresh, logout };