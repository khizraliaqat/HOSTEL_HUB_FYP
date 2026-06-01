const mongoose = require('mongoose');

const messMenuSchema = new mongoose.Schema({
    hostel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hostel',
        required: true
    },
    day_name: {
        type: String,
        required: true,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    breakfast: {
        type: String,
        default: ''
    },
    lunch: {
        type: String,
        default: ''
    },
    dinner: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('MessMenu', messMenuSchema);
