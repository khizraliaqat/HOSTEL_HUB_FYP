const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Show pages
router.get('/login', authController.showLogin);
router.get('/register', authController.showRegister);
router.get('/forgot_password', authController.showForgotPassword);
router.get('/reset_password/:token', authController.showResetPassword);

// Auth actions
router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/forgot_password', authController.requestPasswordReset);
router.post('/reset_password/:token', authController.resetPassword);
router.get('/logout', authController.logout);

module.exports = router;
