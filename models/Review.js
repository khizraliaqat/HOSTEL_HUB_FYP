const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    hostel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hostel',
        required: true
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: [true, 'Rating is required'],
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Prevent duplicate reviews from same user for same hostel
reviewSchema.index({ hostel: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
