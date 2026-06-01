const Booking = require('../models/Booking');
const Hostel = require('../models/Hostel');
const Room = require('../models/Room');
const RentPayment = require('../models/RentPayment');
const Complaint = require('../models/Complaint');
const Wishlist = require('../models/Wishlist');

const ISSUE_TYPE_MAP = {
    electricity: 'Maintenance',
    wifi: 'Maintenance',
    water: 'Maintenance',
    plumbing: 'Maintenance',
    maintenance: 'Maintenance',
    cleaning: 'Cleanliness',
    cleanliness: 'Cleanliness',
    'food quality': 'Food Quality',
    food: 'Food Quality',
    staff: 'Staff Behavior',
    'staff behavior': 'Staff Behavior',
    security: 'Safety',
    safety: 'Safety',
    other: 'Other'
};

function getReturnPath(req, fallbackPath) {
    const referer = req.get('referer');
    if (!referer) return fallbackPath;

    try {
        const parsed = new URL(referer);
        return `${parsed.pathname}${parsed.search || ''}`;
    } catch (error) {
        return fallbackPath;
    }
}

function withMsg(path, code) {
    const separator = path.includes('?') ? '&' : '?';
    return `${path}${separator}msg=${code}`;
}

function normalizeIssueType(rawIssueType) {
    if (!rawIssueType) return null;
    const normalized = String(rawIssueType).trim().toLowerCase();
    return ISSUE_TYPE_MAP[normalized] || null;
}

// @desc    Book hostel
// @route   POST /book_hostel
exports.bookHostel = async (req, res) => {
    try {
        const { hostel_id, with_mess } = req.body;

        const hostel = await Hostel.findById(hostel_id);
        if (!hostel) {
            return res.status(404).send('Hostel not found');
        }

        let finalRent = parseFloat(hostel.price);
        let includesMess = false;

        if (with_mess === 'on') {
            finalRent += parseFloat(hostel.mess_fee || 0);
            includesMess = true;
        }

        await Booking.create({
            hostel: hostel_id,
            student: req.session.user.id,
            message: 'Interested in booking.',
            includes_mess: includesMess,
            final_rent: finalRent
        });

        res.redirect('/student_dashboard?msg=booking_requested');
    } catch (error) {
        console.error('Book Hostel Error:', error);
        res.status(500).send('Error booking hostel');
    }
};

// @desc    Book room seat
// @route   POST /book_seat
exports.bookSeat = async (req, res) => {
    try {
        const { room_id, with_mess } = req.body;
        const studentId = req.session.user.id;

        const room = await Room.findById(room_id).populate('hostel');
        if (!room) {
            return res.status(404).send('Room not found');
        }

        // Check availability
        if (room.occupied_seats >= room.total_seats) {
            return res.send('Room Full');
        }

        // Check if already booked
        const existingBooking = await Booking.findOne({
            room: room_id,
            student: studentId,
            status: { $in: ['Pending', 'Approved'] }
        });

        if (existingBooking) {
            return res.send('Already booked this room');
        }

        let finalRent = parseFloat(room.price_per_seat);
        let includesMess = false;

        if (with_mess === 'on') {
            finalRent += parseFloat(room.hostel.mess_fee || 0);
            includesMess = true;
        }

        const msg = `Seat in Room: ${room.name} (${room.hostel.name})`;

        await Booking.create({
            hostel: room.hostel._id,
            student: studentId,
            room: room_id,
            message: msg,
            includes_mess: includesMess,
            final_rent: finalRent
        });

        // Increment occupied seats
        room.occupied_seats += 1;
        await room.save();

        res.redirect('/student_dashboard?msg=seat_booked_successfully');
    } catch (error) {
        console.error('Book Seat Error:', error);
        res.status(500).send('Error booking seat');
    }
};

// @desc    Cancel booking
// @route   GET /cancel_booking/:id
exports.cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findOne({
            _id: req.params.id,
            student: req.session.user.id,
            status: { $in: ['Pending', 'Rejected'] }
        });

        if (booking) {
            // If it was a room booking, decrease occupied seats
            if (booking.room) {
                await Room.findByIdAndUpdate(booking.room, {
                    $inc: { occupied_seats: -1 }
                });
            }
            await booking.deleteOne();
        }

        res.redirect('/student_dashboard?msg=deleted');
    } catch (error) {
        console.error('Cancel Booking Error:', error);
        res.status(500).send('Error canceling booking');
    }
};

// @desc    Update booking status (Owner)
// @route   GET /update_booking/:id/:status
exports.updateBooking = async (req, res) => {
    try {
        const { id, status } = req.params;

        // Find booking and verify ownership through hostel
        const booking = await Booking.findById(id).populate('hostel');
        if (!booking || booking.hostel.owner.toString() !== req.session.user.id) {
            return res.status(403).send('Unauthorized');
        }

        booking.status = status;
        await booking.save();

        res.redirect('/owner_dashboard?msg=booking_updated');
    } catch (error) {
        console.error('Update Booking Error:', error);
        res.status(500).send('Error updating booking');
    }
};

// @desc    Submit complaint
// @route   POST /submit_complaint
exports.submitComplaint = async (req, res) => {
    try {
        const returnPath = getReturnPath(req, '/student_dashboard');
        const { hostel_id } = req.body;
        const issue_type = req.body.issue_type || req.body.issue;
        const description = req.body.description || req.body.desc;

        const mappedIssueType = normalizeIssueType(issue_type);

        if (!hostel_id || !mappedIssueType || !description) {
            return res.redirect(withMsg(returnPath, 'complaint_error'));
        }

        await Complaint.create({
            student: req.session.user.id,
            hostel: hostel_id,
            issue_type: mappedIssueType,
            description: String(description).trim()
        });

        res.redirect(withMsg(returnPath, 'complaint_sent'));
    } catch (error) {
        console.error('Submit Complaint Error:', error);
        const returnPath = getReturnPath(req, '/student_dashboard');
        res.redirect(withMsg(returnPath, 'complaint_error'));
    }
};

// @desc    Pay rent (upload proof)
// @route   POST /pay_rent
exports.payRent = async (req, res) => {
    try {
        const returnPath = getReturnPath(req, '/student_dashboard');
        let { payment_id, booking_id } = req.body;

        const uploadedFile = req.file
            || (req.files && req.files.proof && req.files.proof[0])
            || (req.files && req.files.proof_image && req.files.proof_image[0]);

        if (!payment_id && booking_id) {
            const latestPayment = await RentPayment.findOne({
                booking: booking_id,
                student: req.session.user.id
            }).sort({ createdAt: -1 });

            if (latestPayment) {
                payment_id = latestPayment._id;
            }
        }

        if (!uploadedFile || !payment_id) {
            return res.redirect(withMsg(returnPath, 'rent_upload_error'));
        }

        const updatedPayment = await RentPayment.findOneAndUpdate(
            { _id: payment_id, student: req.session.user.id },
            { proof_image: uploadedFile.filename, status: 'Submitted' },
            { new: true }
        );

        if (!updatedPayment) {
            return res.redirect(withMsg(returnPath, 'rent_upload_error'));
        }

        res.redirect(withMsg(returnPath, 'rent_proof_uploaded'));
    } catch (error) {
        console.error('Pay Rent Error:', error);
        const returnPath = getReturnPath(req, '/student_dashboard');
        res.redirect(withMsg(returnPath, 'rent_upload_error'));
    }
};

// @desc    Toggle wishlist
// @route   POST /toggle_wishlist
exports.toggleWishlist = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.send('login_required');
        }

        const { hostel_id } = req.body;
        const studentId = req.session.user.id;

        const existing = await Wishlist.findOne({
            student: studentId,
            hostel: hostel_id
        });

        if (existing) {
            await existing.deleteOne();
            res.send('removed');
        } else {
            await Wishlist.create({
                student: studentId,
                hostel: hostel_id
            });
            res.send('added');
        }
    } catch (error) {
        console.error('Toggle Wishlist Error:', error);
        res.send('error');
    }
};

// @desc    Approve rent payment (Owner)
// @route   GET /approve_rent/:id
exports.approveRent = async (req, res) => {
    try {
        await RentPayment.findByIdAndUpdate(req.params.id, {
            status: 'Paid'
        });
        res.redirect('/owner_dashboard?msg=rent_approved');
    } catch (error) {
        console.error('Approve Rent Error:', error);
        res.status(500).send('Error approving rent');
    }
};
