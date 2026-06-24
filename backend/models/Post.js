const mongoose = require('mongoose');
const schema = mongoose.Schema;

const postSchema = new schema({
    content: {
        type: String,
        required: false,
        default: ""
    },
    image: {
        type: String,
        default: null
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    commentCount: {
        type: Number,
        default: 0,
        min: 0
    }
}, { timestamps: true });

postSchema.index({ author: 1, _id: -1 });


module.exports = mongoose.model('Post', postSchema);