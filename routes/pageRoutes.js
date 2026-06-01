const express = require('express');
const router = express.Router();
const pageController = require('../controllers/pageController');

router.get('/about', pageController.getAbout);
router.get('/contact', pageController.getContact);
router.post('/contact', pageController.submitContact);

module.exports = router;
