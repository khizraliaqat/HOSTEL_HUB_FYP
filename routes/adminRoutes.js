const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Accept both dashboard URLs
router.get(
['/admin-panel', '/admin_dashboard'],
adminController.getAdminDashboard
);

// Verify hostel
router.get(
'/admin/verify_hostel/:id',
adminController.verifyHostel
);

// Delete user
router.get(
'/admin/delete_user/:id',
adminController.deleteUser
);

module.exports = router;
