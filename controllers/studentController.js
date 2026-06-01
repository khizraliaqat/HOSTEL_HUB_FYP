const Booking = require('../models/Booking');
const RentPayment = require('../models/RentPayment');
const Complaint = require('../models/Complaint');
const Wishlist = require('../models/Wishlist');
const PaymentSettings = require('../models/PaymentSettings');

function getCurrentCycleRange(joinDate) {
    const today = new Date();

    let monthsPassed = (today.getFullYear() - joinDate.getFullYear()) * 12 + (today.getMonth() - joinDate.getMonth());
    if (today.getDate() < joinDate.getDate()) monthsPassed--;

    const cycleStart = new Date(joinDate);
    cycleStart.setMonth(joinDate.getMonth() + monthsPassed);

    const cycleEnd = new Date(cycleStart);
    cycleEnd.setMonth(cycleStart.getMonth() + 1);

    const monthYear = `${cycleStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${cycleEnd.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;

    return { cycleStart, cycleEnd, monthYear };
}

async function ensureCurrentCyclePayment(booking, studentId) {
    if (!booking || booking.status !== 'Approved') return null;

    const joinDate = new Date(booking.createdAt);
    const { monthYear } = getCurrentCycleRange(joinDate);

    let bill = await RentPayment.findOne({
        booking: booking._id,
        month_year: monthYear,
        student: studentId
    }).lean();

    if (!bill) {
        const amount = Number(booking.final_rent || booking.hostel?.price || 0);
        const created = await RentPayment.create({
            student: studentId,
            booking: booking._id,
            month_year: monthYear,
            amount,
            status: 'Pending'
        });
        bill = created.toObject();
    }

    return bill;
}

// @desc    Get student dashboard
// @route   GET /student_dashboard
exports.getStudentDashboard = async (req, res) => {
    try {
        const uid = req.session.user.id;

        const bookings = await Booking.find({ student: uid })
            .populate('hostel', 'name price announcement_text owner area image')
            .populate('room', 'name')
            .sort({ createdAt: -1 })
            .lean();

        const complaints = await Complaint.find({ student: uid })
            .populate('hostel', 'name')
            .sort({ createdAt: -1 })
            .lean();

        const wishlist = await Wishlist.find({ student: uid })
            .populate('hostel')
            .lean();

        const approvedBookings = bookings.filter((b) => b.status === 'Approved');
        const activeBooking = approvedBookings.find((b) => b.hostel && b.hostel.announcement_text)
            || approvedBookings[0];
        let stayRecord = null;

        if (activeBooking && activeBooking.hostel) {
            const joinDate = new Date(activeBooking.createdAt);
            const today = new Date();
            const { cycleEnd } = getCurrentCycleRange(joinDate);

            await ensureCurrentCyclePayment(activeBooking, uid);

            stayRecord = {
                joinDate: joinDate.toLocaleDateString(),
                nextDue: cycleEnd.toLocaleDateString(),
                amount: Number(activeBooking.final_rent || activeBooking.hostel.price || 0),
                daysStayed: Math.ceil(Math.abs(today - joinDate) / (1000 * 60 * 60 * 24)),
                status: activeBooking.status,
                announcement: activeBooking.hostel.announcement_text,
                owner_id: activeBooking.hostel.owner,
                hostel_name: activeBooking.hostel.name,
                hostel_id: activeBooking.hostel._id
            };
        }

        const payments = await RentPayment.find({ student: uid })
            .sort({ _id: -1 })
            .lean();

        res.render('student_dashboard', {
            user: req.session.user,
            bookings,
            complaints,
            wishlist: wishlist.map((w) => w.hostel).filter(Boolean),
            payments,
            stay: stayRecord,
            activeBooking,
            msg: req.query.msg
        });
    } catch (error) {
        console.error('Student Dashboard Error:', error);
        res.status(500).send('Error loading dashboard');
    }
};

// @desc    Get active stay announcement
// @route   GET /api/announcement
exports.getAnnouncement = async (req, res) => {
    try {
        if (!req.session || !req.session.user) {
            return res.json({ announcement: null });
        }
        const uid = req.session.user.id;
        const activeBooking = await Booking.findOne({ student: uid, status: 'Approved' })
            .populate('hostel', 'announcement_text')
            .sort({ createdAt: -1 })
            .lean();

        if (activeBooking && activeBooking.hostel && activeBooking.hostel.announcement_text) {
            return res.json({ announcement: activeBooking.hostel.announcement_text });
        }
        res.json({ announcement: null });
    } catch (error) {
        console.error('Get Announcement Error:', error);
        res.status(500).json({ announcement: null });
    }
};

// @desc    Get student bookings page
// @route   GET /my_bookings
exports.getMyBookings = async (req, res) => {
    try {
        const uid = req.session.user.id;

        const bookings = await Booking.find({ student: uid })
            .populate('hostel', 'name area image owner price')
            .sort({ createdAt: -1 })
            .lean();

        const paymentsByBooking = new Map();

        for (const booking of bookings) {
            if (booking.status === 'Approved') {
                const payment = await ensureCurrentCyclePayment(booking, uid);
                if (payment) {
                    paymentsByBooking.set(String(booking._id), payment);
                }
            }
        }

        const ownerIds = [...new Set(bookings
            .map((b) => b.hostel?.owner)
            .filter(Boolean)
            .map((ownerId) => String(ownerId)))];

        const ownerSettings = await PaymentSettings.find({
            owner: { $in: ownerIds }
        }).lean();

        const settingsByOwner = new Map(
            ownerSettings.map((setting) => [String(setting.owner), setting])
        );

        const bookingRows = bookings.map((booking) => {
            const hostel = booking.hostel || {};
            const ownerId = hostel.owner ? String(hostel.owner) : null;
            const ownerPayment = ownerId ? settingsByOwner.get(ownerId) : null;
            const payment = paymentsByBooking.get(String(booking._id));

            return {
                id: booking._id,
                hostel_id: hostel._id,
                name: hostel.name || 'Listing unavailable',
                area: hostel.area || 'Area not available',
                image: hostel.image || '',
                status: booking.status,
                price: Number(booking.final_rent || hostel.price || 0),
                payment_id: payment ? payment._id : '',
                payment_proof: payment ? payment.proof_image : '',
                jazzcash_name: ownerPayment?.jazzcash_name || '',
                jazzcash_no: ownerPayment?.jazzcash_no || '',
                easypaisa_name: ownerPayment?.easypaisa_name || '',
                easypaisa_no: ownerPayment?.easypaisa_no || '',
                bank_name: ownerPayment?.bank_name || '',
                bank_acc_title: ownerPayment?.bank_acc_title || '',
                bank_iban: ownerPayment?.bank_iban || ''
            };
        });

        const complaints = await Complaint.find({ student: uid })
            .sort({ createdAt: -1 })
            .lean();

        const complaintRows = complaints.map((complaint) => ({
            issue_type: complaint.issue_type,
            description: complaint.description,
            status: complaint.status,
            created_at: complaint.createdAt
        }));

        res.render('my_bookings', {
            bookings: bookingRows,
            complaints: complaintRows,
            msg: req.query.msg
        });
    } catch (error) {
        console.error('Get My Bookings Error:', error);
        res.status(500).send('Error loading bookings');
    }
};

// @desc    Get student wishlist page
// @route   GET /my_wishlist
exports.getMyWishlist = async (req, res) => {
    try {
        const uid = req.session.user.id;

        const wishlist = await Wishlist.find({ student: uid })
            .populate('hostel')
            .lean();

        const hostels = wishlist
            .map((entry) => entry.hostel)
            .filter(Boolean);

        res.render('my_wishlist', { hostels });
    } catch (error) {
        console.error('Get My Wishlist Error:', error);
        res.status(500).send('Error loading wishlist');
    }
};

// @desc    Get booking receipt
// @route   GET /receipt/:id
exports.getReceipt = async (req, res) => {
    try {
        const booking = await Booking.findOne({
            _id: req.params.id,
            student: req.session.user.id
        })
            .populate('hostel', 'name area price')
            .populate('student', 'name email phone')
            .lean();

        if (!booking || !booking.hostel) {
            return res.status(404).send('Receipt not found');
        }

        const receiptId = String(booking._id).slice(-8).toUpperCase();
        const student = booking.student || req.session.user;
        const amount = Number(booking.final_rent || booking.hostel.price || 0);

        const data = {
            id: receiptId,
            created_at: booking.createdAt,
            student_name: student.name || 'Student',
            email: student.email || '',
            phone: student.phone || '-',
            status: booking.status,
            hostel_name: booking.hostel.name,
            area: booking.hostel.area,
            price: amount
        };

        res.render('receipt', { data });
    } catch (error) {
        console.error('Get Receipt Error:', error);
        res.status(500).send('Error loading receipt');
    }
};
