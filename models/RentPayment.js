const mongoose = require('mongoose');

const rentPaymentSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true
    },
    month_year: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['Pending', 'Submitted', 'Paid'],
        default: 'Pending'
    },
    proof_image: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('RentPayment', rentPaymentSchema);
