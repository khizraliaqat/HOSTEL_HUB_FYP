const mongoose = require('mongoose');

const communityMessageSchema = new mongoose.Schema({
    area_name: {
        type: String,
        required: true,
        trim: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    message: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

// Index for area queries
communityMessageSchema.index({ area_name: 1, createdAt: -1 });

module.exports = mongoose.model('CommunityMessage', communityMessageSchema);
