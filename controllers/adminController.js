const User = require('../models/User');
const Hostel = require('../models/Hostel');
const Booking = require('../models/Booking');
const Message = require('../models/Message');

const getHostelVerificationField = () => {
    if (Hostel.schema.path('is_verified')) {
        return 'is_verified';
    }

    if (Hostel.schema.path('isVerified')) {
        return 'isVerified';
    }

    throw new Error('Hostel model must contain is_verified or isVerified');
};

exports.getAdminDashboard = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect('/login');
        }

        const adminId = req.session.user.id || req.session.user._id;
        const verificationField = getHostelVerificationField();

        const [
            totalUsers,
            totalHostels,
            totalBookings,
            unreadMessages,
            hostels,
            users
        ] = await Promise.all([
            User.countDocuments(),
            Hostel.countDocuments({ is_active: true }),
            Booking.countDocuments(),
            Message.countDocuments({
                receiver: adminId,
                is_read: false
            }),
            Hostel.find({ is_active: true })
                .populate('owner', 'name email')
                .sort({ createdAt: -1 })
                .lean(),
            User.find({ _id: { $ne: adminId } })
                .select('name email role is_active')
                .sort({ createdAt: -1 })
                .lean()
        ]);

        const hostelRows = hostels.map((hostel) => ({
            ...hostel,
            owner_name:
                hostel.owner && hostel.owner.name
                    ? hostel.owner.name
                    : 'Unknown owner',
            is_verified: Boolean(hostel[verificationField])
        }));

        return res.render('admin_dashboard', {
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
        return res.status(500).send('Error loading admin dashboard');
    }
};

exports.verifyHostel = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect('/login');
        }

        const verificationField = getHostelVerificationField();

        const updatedHostel = await Hostel.findByIdAndUpdate(
            req.params.id,
            {
                $set: {
                    [verificationField]: true
                }
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!updatedHostel) {
            return res.redirect('/admin_dashboard?msg=hostel_not_found');
        }

        return res.redirect('/admin_dashboard?msg=hostel_verified');
    } catch (error) {
        console.error('Verify Hostel Error:', error);
        return res.redirect('/admin_dashboard?msg=verify_failed');
    }
};

exports.deleteUser = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect('/login');
        }

        const adminId = req.session.user.id || req.session.user._id;

        if (String(req.params.id) === String(adminId)) {
            return res.redirect('/admin_dashboard?msg=cannot_delete_self');
        }

        await User.findByIdAndDelete(req.params.id);
        return res.redirect('/admin_dashboard?msg=user_deleted');
    } catch (error) {
        console.error('Delete User Error:', error);
        return res.redirect('/admin_dashboard?msg=delete_failed');
    }
};
