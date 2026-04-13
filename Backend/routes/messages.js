const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { verifyToken } = require('../middleware/auth');

// ==================== MESSAGING ROUTES ====================
router.post('/', verifyToken, messageController.sendMessage);
router.get('/:userId', verifyToken, messageController.getMessages);
router.get('/:userId/conversations', verifyToken, messageController.getConversations);
router.put('/:userId/read', verifyToken, messageController.markRead);

module.exports = router;
