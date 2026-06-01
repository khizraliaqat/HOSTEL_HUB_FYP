const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    hostel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hostel',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Room name is required'],
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    price_per_seat: {
        type: Number,
        required: [true, 'Price per seat is required'],
        min: 0
    },
    total_seats: {
        type: Number,
        required: [true, 'Total seats is required'],
        min: 1
    },
    occupied_seats: {
        type: Number,
        default: 0,
        min: 0
    },
    images: [{
        type: String
    }],
    is_active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Virtual for available seats
roomSchema.virtual('available_seats').get(function() {
    return Math.max(0, this.total_seats - this.occupied_seats);
});

// Ensure occupied_seats doesn't exceed total_seats
roomSchema.pre('save', function(next) {
    if (this.occupied_seats > this.total_seats) {
        return next(new Error('Occupied seats cannot exceed total seats'));
    }
    next();
});

module.exports = mongoose.model('Room', roomSchema);
