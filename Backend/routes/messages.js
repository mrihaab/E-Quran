const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { verifyToken } = require('../middleware/auth');

// ==================== MESSAGING ROUTES ====================
// Send a message
router.post('/', verifyToken, messageController.sendMessage);

// Get all conversations for the logged-in user (no param needed)
router.get('/conversations', verifyToken, messageController.getConversations);

// Get conversation with a specific partner
router.get('/:partnerId', verifyToken, messageController.getMessages);

// Mark all messages from a partner as read
router.put('/:partnerId/read', verifyToken, messageController.markRead);

// Delete a message
router.delete('/:messageId', verifyToken, messageController.deleteMessage);

module.exports = router;
