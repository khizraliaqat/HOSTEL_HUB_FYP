const express = require('express');
const router = express.Router();
const hostelController = require('../controllers/hostelController');
const { requireAuth, requireOwner } = require('../middleware/auth');
const { uploadMultiple } = require('../middleware/upload');

// Public routes
router.get('/', hostelController.getHostels);
router.get('/details/:id', hostelController.getHostelDetails);
router.get('/compare', hostelController.compareHostels);

// Protected routes - require authentication
router.post('/submit_review', requireAuth, hostelController.submitReview);

// Owner routes - require owner role
router.get('/add_hostel', requireOwner, hostelController.showAddHostel);
router.post('/add_hostel', requireOwner, uploadMultiple('images', 5), hostelController.addHostel);
router.get('/edit_hostel/:id', requireOwner, hostelController.showEditHostel);
router.post('/edit_hostel/:id', requireOwner, uploadMultiple('images', 5), hostelController.updateHostel);
router.get('/delete_image/:id', requireOwner, hostelController.deleteImage);
router.get('/delete_hostel/:id', requireOwner, hostelController.deleteHostel);

module.exports = router;
