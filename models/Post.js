const mongoose = require('mongoose');
const PostSchema = new mongoose.Schema({
    content: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    likes: { type: Number, default: 0 },
    comments: [{ content: String, author: String }]
});
module.exports = mongoose.model('Post', PostSchema);
