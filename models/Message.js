const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    message: {
        type: String,
        required: true
    },
    is_read: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for chat queries
messageSchema.index({ sender: 1, receiver: 1 });
messageSchema.index({ receiver: 1, is_read: 1 });

module.exports = mongoose.model('Message', messageSchema);
