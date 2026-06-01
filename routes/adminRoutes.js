const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAdmin } = require('../middleware/auth');

router.get('/admin_dashboard', requireAdmin, adminController.getAdminDashboard);
router.get('/admin/verify_hostel/:id', requireAdmin, adminController.verifyHostel);
router.get('/admin/delete_user/:id', requireAdmin, adminController.deleteUser);

module.exports = router;
