const mongoose = require('mongoose');
const schema = mongoose.Schema;

const commentSchema = new schema({
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    }
}, { timestamps: true });

commentSchema.index({ postId: 1});

module.exports = mongoose.model('Comment', commentSchema);