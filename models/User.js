const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 6
    },
    role: {
        type: String,
        enum: ['student', 'owner', 'admin'],
        default: 'student'
    },
    phone: {
        type: String,
        default: ''
    },
    city: {
        type: String,
        default: ''
    },
    about: {
        type: String,
        default: ''
    },
    profile_pic: {
        type: String,
        default: ''
    },
    cnic_front: {
        type: String,
        default: ''
    },
    is_id_verified: {
        type: Boolean,
        default: false
    },
    reset_password_token: {
        type: String,
        default: ''
    },
    reset_password_expires: {
        type: Date,
        default: null
    },
    is_active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON response
userSchema.methods.toJSON = function() {
    const user = this.toObject();
    delete user.password;
    return user;
};

module.exports = mongoose.model('User', userSchema);
