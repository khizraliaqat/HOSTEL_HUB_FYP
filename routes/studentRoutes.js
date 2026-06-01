const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { requireStudent } = require('../middleware/auth');

router.get('/student_dashboard', requireStudent, studentController.getStudentDashboard);
router.get('/my_bookings', requireStudent, studentController.getMyBookings);
router.get('/my_wishlist', requireStudent, studentController.getMyWishlist);
router.get('/receipt/:id', requireStudent, studentController.getReceipt);
router.get('/api/announcement', requireStudent, studentController.getAnnouncement);

module.exports = router;
