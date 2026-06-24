const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;

const authMiddleware = require('../middleware/authMiddleware');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

router.get('/sign', authMiddleware, (req, res) => {
    try {
        const timestamp = Math.round(new Date().getTime() / 1000);

        const signature = cloudinary.utils.api_sign_request(
            {
                timestamp: timestamp,
                folder: 'posts',
            },
            process.env.CLOUDINARY_API_SECRET
        );

        res.status(200).json({
            signature,
            timestamp,
            apiKey: process.env.CLOUDINARY_API_KEY,
            cloudName: process.env.CLOUDINARY_CLOUD_NAME
        });
    } catch (err) {
        console.error("Signing generation failed:", err);
        res.status(500).json({ message: "Failed to generate upload signature" });
    }
});

module.exports = router;