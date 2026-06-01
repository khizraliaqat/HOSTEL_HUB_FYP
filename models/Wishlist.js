const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    hostel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hostel',
        required: true
    }
}, {
    timestamps: true
});

// Prevent duplicate wishlist entries
wishlistSchema.index({ student: 1, hostel: 1 }, { unique: true });

module.exports = mongoose.model('Wishlist', wishlistSchema);
