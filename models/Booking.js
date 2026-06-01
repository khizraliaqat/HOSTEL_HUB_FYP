const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
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
    room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        default: null
    },
    message: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    includes_mess: {
        type: Boolean,
        default: false
    },
    final_rent: {
        type: Number,
        required: true,
        min: 0
    },
    start_date: {
        type: Date,
        default: Date.now
    },
    end_date: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Index for queries
bookingSchema.index({ student: 1, status: 1 });
bookingSchema.index({ hostel: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
