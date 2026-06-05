const mongoose = require('mongoose');

const hostelSchema = new mongoose.Schema({
owner: {
type: mongoose.Schema.Types.ObjectId,
ref: 'User',
required: true
},
name: {
type: String,
required: [true, 'Hostel name is required'],
trim: true
},
category: {
type: String,
enum: ['Boys', 'Girls', 'Co-ed', 'Family'],
required: true
},
area: {
type: String,
required: true,
trim: true
},
price: {
type: Number,
required: [true, 'Price is required'],
min: 0
},
mess_fee: {
type: Number,
default: 0,
min: 0
},
description: {
type: String,
default: ''
},
facilities: {
type: [String],
default: []
},
map_embed: {
type: String,
default: ''
},
image: {
type: String,
default: ''
},
images: [{
type: String
}],
views: {
type: Number,
default: 0
},
announcement_text: {
type: String,
default: ''
},
is_active: {
type: Boolean,
default: true
},
is_verified: {
type: Boolean,
default: false
}
}, {
timestamps: true
});

// Index for search optimization
hostelSchema.index({ area: 'text', name: 'text' });
hostelSchema.index({ category: 1, price: 1 });

module.exports = mongoose.model('Hostel', hostelSchema);
