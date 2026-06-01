const User = require('../models/User');
const Hostel = require('../models/Hostel');
const Booking = require('../models/Booking');
const Message = require('../models/Message');

// @desc    Admin dashboard
// @route   GET /admin_dashboard
exports.getAdminDashboard = async (req, res) => {
    try {
        const [totalUsers, totalHostels, totalBookings, unreadMessages, hostels, users] = await Promise.all([
            User.countDocuments(),
            Hostel.countDocuments({ is_active: true }),
            Booking.countDocuments(),
            Message.countDocuments({ receiver: req.session.user.id, is_read: false }),
            Hostel.find({ is_active: true })
                .populate('owner', 'name email')
                .sort({ createdAt: -1 })
                .lean(),
            User.find({ _id: { $ne: req.session.user.id } })
                .select('name email role is_active')
                .sort({ createdAt: -1 })
                .lean()
        ]);

        const hostelRows = hostels.map((hostel) => ({
            ...hostel,
            owner_name: hostel.owner?.name || 'Unknown owner',
            is_verified: Boolean(hostel.is_verified)
        }));

        res.render('admin_dashboard', {
            stats: {
                totalUsers,
                totalHostels,
                totalBookings,
                unreadMessages
            },
            hostels: hostelRows,
            users
        });
    } catch (error) {
        console.error('Admin Dashboard Error:', error);
        res.status(500).send('Error loading admin dashboard');
    }
};

// @desc    Verify hostel
// @route   GET /admin/verify_hostel/:id
exports.verifyHostel = async (req, res) => {
    try {
        await Hostel.findByIdAndUpdate(req.params.id, { is_verified: true });
        res.redirect('/admin_dashboard?msg=hostel_verified');
    } catch (error) {
        console.error('Verify Hostel Error:', error);
        res.redirect('/admin_dashboard?msg=verify_failed');
    }
};

// @desc    Delete user
// @route   GET /admin/delete_user/:id
exports.deleteUser = async (req, res) => {
    try {
        if (String(req.params.id) === String(req.session.user.id)) {
            return res.redirect('/admin_dashboard?msg=cannot_delete_self');
        }

        await User.findByIdAndDelete(req.params.id);
        res.redirect('/admin_dashboard?msg=user_deleted');
    } catch (error) {
        console.error('Delete User Error:', error);
        res.redirect('/admin_dashboard?msg=delete_failed');
    }
};
