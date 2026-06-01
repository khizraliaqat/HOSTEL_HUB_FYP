const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { requireAuth } = require('../middleware/auth');
const { uploadFields } = require('../middleware/upload');

router.get('/profile', requireAuth, profileController.getProfile);
router.post('/update_profile', requireAuth, uploadFields([
    { name: 'profile_pic', maxCount: 1 },
    { name: 'cnic_front', maxCount: 1 }
]), profileController.updateProfile);
router.post('/upload_cnic', requireAuth, uploadFields([
    { name: 'cnic_front', maxCount: 1 },
    { name: 'cnic', maxCount: 1 }
]), profileController.updateProfile);
router.post('/change_password', requireAuth, profileController.changePassword);

module.exports = router;
