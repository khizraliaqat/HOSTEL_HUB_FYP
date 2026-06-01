const User = require('../models/User');
const { isStrongPassword } = require('../utils/passwordPolicy');

function buildRedirectWithMsg(req, fallbackPath, msgCode) {
    const referer = req.get('referer');

    let path = fallbackPath;
    if (referer) {
        try {
            const parsed = new URL(referer);
            path = `${parsed.pathname}${parsed.search || ''}`;
        } catch (error) {
            path = fallbackPath;
        }
    }

    const sep = path.includes('?') ? '&' : '?';
    return `${path}${sep}msg=${msgCode}`;
}

function profileMessage(code) {
    const messages = {
        profile_updated: 'Profile updated successfully.',
        profile_update_error: 'Could not update profile. Please try again.',
        password_fields_required: 'Please fill all password fields.',
        password_mismatch: 'New password and confirm password do not match.',
        weak_password: 'Password must be at least 8 characters and include upper, lower, number, and special character.',
        current_password_incorrect: 'Current password is incorrect.',
        password_updated: 'Password updated successfully.',
        password_update_error: 'Could not update password. Please try again.'
    };

    return messages[code] || null;
}

// @desc    Get user profile
// @route   GET /profile
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.session.user.id).lean();
        const msg = profileMessage(req.query.msg);
        res.render('profile', { user, msg, msgCode: req.query.msg || '' });
    } catch (error) {
        console.error('Get Profile Error:', error);
        res.status(500).send('Error loading profile');
    }
};

// @desc    Update user profile
// @route   POST /update_profile
exports.updateProfile = async (req, res) => {
    try {
        const { name, phone, city, about } = req.body;

        const updateData = {};

        if (typeof name !== 'undefined') updateData.name = String(name || '').trim();
        if (typeof phone !== 'undefined') updateData.phone = String(phone || '').trim();
        if (typeof city !== 'undefined') updateData.city = String(city || '').trim();
        if (typeof about !== 'undefined') updateData.about = String(about || '').trim();

        // Handle profile picture
        if (req.files && req.files.profile_pic) {
            updateData.profile_pic = req.files.profile_pic[0].filename;
        }

        // Handle CNIC verification
        if (req.files && req.files.cnic_front) {
            updateData.cnic_front = req.files.cnic_front[0].filename;
            updateData.is_id_verified = true;
        }

        // Backward compatibility for older form field name.
        if (req.files && req.files.cnic && req.files.cnic[0]) {
            updateData.cnic_front = req.files.cnic[0].filename;
            updateData.is_id_verified = true;
        }

        if (Object.keys(updateData).length > 0) {
            await User.findByIdAndUpdate(req.session.user.id, updateData);
        }

        // Update session
        if (updateData.profile_pic) {
            req.session.user.profile_pic = updateData.profile_pic;
        }
        if (updateData.name) {
            req.session.user.name = updateData.name;
        }

        res.redirect(buildRedirectWithMsg(req, '/profile', 'profile_updated'));
    } catch (error) {
        console.error('Update Profile Error:', error);
        res.redirect(buildRedirectWithMsg(req, '/profile', 'profile_update_error'));
    }
};

// @desc    Change user password
// @route   POST /change_password
exports.changePassword = async (req, res) => {
    try {
        const currentPass = req.body.current_password || req.body.current_pass;
        const newPass = req.body.new_password || req.body.new_pass;
        const confirmPass = req.body.confirm_password || req.body.confirm_pass;

        if (!currentPass || !newPass || !confirmPass) {
            return res.redirect(buildRedirectWithMsg(req, '/profile', 'password_fields_required'));
        }

        if (newPass !== confirmPass) {
            return res.redirect(buildRedirectWithMsg(req, '/profile', 'password_mismatch'));
        }

        if (!isStrongPassword(newPass)) {
            return res.redirect(buildRedirectWithMsg(req, '/profile', 'weak_password'));
        }

        const user = await User.findById(req.session.user.id);
        if (!user) {
            return res.redirect('/login?session_expired=true');
        }

        const isValidCurrentPassword = await user.comparePassword(currentPass);
        if (!isValidCurrentPassword) {
            return res.redirect(buildRedirectWithMsg(req, '/profile', 'current_password_incorrect'));
        }

        user.password = newPass;
        user.reset_password_token = '';
        user.reset_password_expires = null;
        await user.save();

        return res.redirect(buildRedirectWithMsg(req, '/profile', 'password_updated'));
    } catch (error) {
        console.error('Change Password Error:', error);
        return res.redirect(buildRedirectWithMsg(req, '/profile', 'password_update_error'));
    }
};
