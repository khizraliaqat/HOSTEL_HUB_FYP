const express = require('express');
const router = express.Router();
const communityController = require('../controllers/communityController');

router.get('/community', communityController.getCommunity);
router.get('/area_chat', communityController.getAreaChat);
router.post('/api_community', communityController.communityAPI);

module.exports = router;
