const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { requireAuth, requireOwner } = require('../middleware/auth');
const { uploadSingle, uploadFields } = require('../middleware/upload');

// Student routes
router.post('/book_hostel', requireAuth, bookingController.bookHostel);
router.post('/book_seat', requireAuth, bookingController.bookSeat);
router.get('/cancel_booking/:id', requireAuth, bookingController.cancelBooking);
router.post('/submit_complaint', requireAuth, bookingController.submitComplaint);
router.post('/pay_rent', requireAuth, uploadSingle('proof'), bookingController.payRent);
router.post('/upload_payment', requireAuth, uploadFields([
	{ name: 'proof', maxCount: 1 },
	{ name: 'proof_image', maxCount: 1 }
]), bookingController.payRent);
router.post('/toggle_wishlist', requireAuth, bookingController.toggleWishlist);

// Owner routes
router.get('/update_booking/:id/:status', requireOwner, bookingController.updateBooking);
router.get('/approve_rent/:id', requireOwner, bookingController.approveRent);

module.exports = router;
