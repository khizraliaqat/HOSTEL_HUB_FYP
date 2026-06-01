const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');

router.get('/room_details/:room_id', roomController.getRoomDetails);

module.exports = router;
