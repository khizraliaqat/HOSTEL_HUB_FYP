const Booking = require('../models/Booking');
const Hostel = require('../models/Hostel');
const RentPayment = require('../models/RentPayment');
const Complaint = require('../models/Complaint');
const Room = require('../models/Room');
const PaymentSettings = require('../models/PaymentSettings');

// @desc    Get owner dashboard
// @route   GET /owner_dashboard
exports.getOwnerDashboard = async (req, res) => {
    try {
        const ownerId = req.session.user.id;
        const { hostel_id, date, status } = req.query;

        // Get owner's hostels
        const hostels = await Hostel.find({ owner: ownerId }).lean();
        const hostelIds = hostels.map(h => h._id);

        // Build booking query
        let bookingQuery = { hostel: { $in: hostelIds } };
        if (hostel_id) bookingQuery.hostel = hostel_id;
        if (status) bookingQuery.status = status;
        if (date) {
            const startDate = new Date(date);
            const endDate = new Date(date);
            endDate.setDate(endDate.getDate() + 1);
            bookingQuery.createdAt = { $gte: startDate, $lt: endDate };
        }

        // Get bookings
        const bookings = await Booking.find(bookingQuery)
            .populate('student', 'name email')
            .populate('hostel', 'name')
            .populate('room', 'name')
            .sort({ createdAt: -1 })
            .lean();

        // Format bookings for template
        const formattedBookings = bookings.map(b => ({
            booking_id: b._id,
            message: b.message,
            status: b.status,
            created_at: b.createdAt,
            includes_mess: b.includes_mess,
            final_rent: b.final_rent,
            student_name: b.student.name,
            email: b.student.email,
            hostel_name: b.hostel.name,
            room_name: b.room ? b.room.name : null
        }));

        // Get rent requests
        const rent_requests = await RentPayment.find({ status: 'Submitted' })
            .populate({
                path: 'booking',
                populate: [
                    { path: 'hostel', match: { owner: ownerId }, select: 'name' },
                    { path: 'student', select: 'name' }
                ]
            })
            .sort({ createdAt: -1 })
            .lean();

        // Filter rent requests where hostel belongs to owner
        const filteredRentRequests = rent_requests
            .filter(r => r.booking && r.booking.hostel)
            .map(r => ({
                ...r,
                student_name: r.booking.student.name,
                hostel_name: r.booking.hostel.name
            }));

        // Get chart data (bookings per month)
        const currentYear = new Date().getFullYear();
        const chartData = await Booking.aggregate([
            {
                $match: {
                    hostel: { $in: hostelIds },
                    createdAt: {
                        $gte: new Date(`${currentYear}-01-01`),
                        $lt: new Date(`${currentYear + 1}-01-01`)
                    }
                }
            },
            {
                $group: {
                    _id: { $month: '$createdAt' },
                    count: { $sum: 1 }
                }
            }
        ]);

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        let counts = new Array(12).fill(0);
        chartData.forEach(d => {
            if (d._id) counts[d._id - 1] = d.count;
        });

        // Calculate stats
        const stats = {
            totalViews: hostels.reduce((acc, h) => acc + h.views, 0),
            pending: bookings.filter(b => b.status === 'Pending').length,
            approved: bookings.filter(b => b.status === 'Approved').length,
            rejected: bookings.filter(b => b.status === 'Rejected').length
        };

        res.render('owner_dashboard', {
            my_hostels: hostels,
            bookings: formattedBookings,
            rent_requests: filteredRentRequests,
            stats,
            months,
            counts,
            query: req.query
        });
    } catch (error) {
        console.error('Owner Dashboard Error:', error);
        res.status(500).send('Error loading dashboard');
    }
};

// @desc    Redirect owner to a manageable hostel announcement page
// @route   GET /manage_hostel
exports.redirectManageHostel = async (req, res) => {
    try {
        const firstHostel = await Hostel.findOne({ owner: req.session.user.id })
            .sort({ createdAt: -1 })
            .select('_id')
            .lean();

        if (!firstHostel) {
            return res.redirect('/owner_dashboard?msg=no_hostels_to_manage');
        }

        return res.redirect(`/manage_hostel/${firstHostel._id}`);
    } catch (error) {
        console.error('Redirect Manage Hostel Error:', error);
        return res.redirect('/owner_dashboard?msg=manage_redirect_error');
    }
};

// @desc    Redirect owner to a manageable mess menu page
// @route   GET /manage_mess
exports.redirectManageMess = async (req, res) => {
    try {
        const firstHostel = await Hostel.findOne({ owner: req.session.user.id })
            .sort({ createdAt: -1 })
            .select('_id')
            .lean();

        if (!firstHostel) {
            return res.redirect('/owner_dashboard?msg=no_hostels_to_manage');
        }

        return res.redirect(`/manage_mess/${firstHostel._id}`);
    } catch (error) {
        console.error('Redirect Manage Mess Error:', error);
        return res.redirect('/owner_dashboard?msg=manage_redirect_error');
    }
};

// @desc    Get owner complaints
// @route   GET /owner_complaints
exports.getOwnerComplaints = async (req, res) => {
    try {
        const ownerId = req.session.user.id;

        const complaints = await Complaint.find()
            .populate({
                path: 'hostel',
                match: { owner: ownerId },
                select: 'name'
            })
            .populate('student', 'name phone')
            .sort({ createdAt: -1 })
            .lean();

        // Filter complaints where hostel belongs to owner
        const filteredComplaints = complaints
            .filter(c => c.hostel)
            .map(c => ({
                ...c,
                hostel_name: c.hostel.name,
                student_name: c.student.name,
                phone: c.student.phone,
                created_at: c.createdAt
            }));

        res.render('owner_complaints', { complaints: filteredComplaints });
    } catch (error) {
        console.error('Owner Complaints Error:', error);
        res.status(500).send('Error loading complaints');
    }
};

// @desc    Resolve complaint
// @route   GET /resolve_complaint/:id
exports.resolveComplaint = async (req, res) => {
    try {
        await Complaint.findByIdAndUpdate(req.params.id, { status: 'Resolved' });
        res.redirect('/owner_complaints');
    } catch (error) {
        console.error('Resolve Complaint Error:', error);
        res.status(500).send('Error resolving complaint');
    }
};

// @desc    Show add room page
// @route   GET /add_room/:hostel_id
exports.showAddRoom = async (req, res) => {
    try {
        const hostel = await Hostel.findOne({
            _id: req.params.hostel_id,
            owner: req.session.user.id
        }).select('_id name').lean();

        if (!hostel) {
            return res.status(404).send('Hostel not found');
        }

        res.render('owner_add_room', { hostel });
    } catch (error) {
        console.error('Show Add Room Error:', error);
        res.status(500).send('Error loading page');
    }
};

// @desc    Add room
// @route   POST /add_room/:hostel_id
exports.addRoom = async (req, res) => {
    try {
        const { name, description, total_seats, occupied_seats, price_per_seat } = req.body;

        // Verify hostel ownership
        const hostel = await Hostel.findOne({
            _id: req.params.hostel_id,
            owner: req.session.user.id
        });

        if (!hostel) {
            return res.status(403).send('Unauthorized');
        }

        const room = await Room.create({
            hostel: req.params.hostel_id,
            name,
            description,
            price_per_seat,
            total_seats,
            occupied_seats: occupied_seats || 0
        });

        // Handle images
        if (req.files && req.files.length > 0) {
            room.images = req.files.map(file => file.filename);
            await room.save();
        }

        res.redirect('/owner_dashboard?msg=room_added');
    } catch (error) {
        console.error('Add Room Error:', error);
        res.status(500).send('Error adding room');
    }
};

// @desc    Show payment settings page
// @route   GET /payment_settings
exports.showPaymentSettings = async (req, res) => {
    try {
        const settings = await PaymentSettings.findOne({
            owner: req.session.user.id
        }).lean();

        res.render('payment_settings', { data: settings || {} });
    } catch (error) {
        console.error('Show Payment Settings Error:', error);
        res.status(500).send('Error loading payment settings');
    }
};

// @desc    Save payment settings
// @route   POST /save_payment_settings
exports.savePaymentSettings = async (req, res) => {
    try {
        const { jc_name, jc_no, ep_name, ep_no, bank_name, bank_title, bank_iban } = req.body;

        await PaymentSettings.findOneAndUpdate(
            { owner: req.session.user.id },
            {
                jazzcash_name: jc_name,
                jazzcash_no: jc_no,
                easypaisa_name: ep_name,
                easypaisa_no: ep_no,
                bank_name,
                bank_acc_title: bank_title,
                bank_iban
            },
            { upsert: true, new: true }
        );

        res.redirect('/owner_dashboard?msg=saved');
    } catch (error) {
        console.error('Save Payment Settings Error:', error);
        res.status(500).send('Error saving payment settings');
    }
};
