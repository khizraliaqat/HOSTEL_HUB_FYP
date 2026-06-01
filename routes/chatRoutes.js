const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { requireAuth } = require('../middleware/auth');

router.get('/chat', requireAuth, chatController.redirectChat);
router.get('/chat_list', requireAuth, chatController.getChatList);
router.get('/chat/:id', requireAuth, chatController.getChat);
router.post('/api_chat', requireAuth, chatController.chatAPI);
router.get('/api/unread_count', requireAuth, chatController.getUnreadCount);

module.exports = router;
