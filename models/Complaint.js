const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    hostel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hostel',
        required: true
    },
    issue_type: {
        type: String,
        required: [true, 'Issue type is required'],
        enum: ['Maintenance', 'Cleanliness', 'Food Quality', 'Staff Behavior', 'Safety', 'Other']
    },
    description: {
        type: String,
        required: [true, 'Description is required']
    },
    status: {
        type: String,
        enum: ['Pending', 'Resolved'],
        default: 'Pending'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Complaint', complaintSchema);
