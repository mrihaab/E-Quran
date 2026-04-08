const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// ==================== SEND MESSAGE ====================
router.post('/', verifyToken, async (req, res) => {
  try {
    const { receiverId, content } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({ error: 'receiverId and content are required.' });
    }

    // Check receiver exists
    const [receivers] = await db.query('SELECT id FROM users WHERE id = ?', [receiverId]);
    if (receivers.length === 0) return res.status(404).json({ error: 'Receiver not found.' });

    const [result] = await db.query(
      'INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
      [req.user.id, receiverId, content]
    );

    res.status(201).json({
      message: 'Message sent.',
      data: {
        id: result.insertId,
        senderId: req.user.id,
        receiverId,
        content,
        isRead: false,
        createdAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message.' });
  }
});

// ==================== GET MESSAGES FOR USER (grouped by conversation) ====================
router.get('/:userId', verifyToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    const [messages] = await db.query(
      `SELECT m.*, 
              s.full_name as sender_name, s.profile_image as sender_image,
              r.full_name as receiver_name, r.profile_image as receiver_image
       FROM messages m
       JOIN users s ON m.sender_id = s.id
       JOIN users r ON m.receiver_id = r.id
       WHERE m.sender_id = ? OR m.receiver_id = ?
       ORDER BY m.created_at ASC`,
      [userId, userId]
    );

    res.json({ messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages.' });
  }
});

// ==================== GET CONVERSATIONS LIST ====================
router.get('/:userId/conversations', verifyToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    // Get all unique conversation partners with last message
    const [conversations] = await db.query(
      `SELECT 
        CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END as partner_id,
        u.full_name as partner_name,
        u.profile_image as partner_image,
        u.role as partner_role,
        (SELECT content FROM messages m2 
         WHERE (m2.sender_id = ? AND m2.receiver_id = u.id) OR (m2.sender_id = u.id AND m2.receiver_id = ?)
         ORDER BY m2.created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM messages m3
         WHERE (m3.sender_id = ? AND m3.receiver_id = u.id) OR (m3.sender_id = u.id AND m3.receiver_id = ?)
         ORDER BY m3.created_at DESC LIMIT 1) as last_message_time,
        (SELECT COUNT(*) FROM messages m4 WHERE m4.sender_id = u.id AND m4.receiver_id = ? AND m4.is_read = 0) as unread_count
       FROM messages m
       JOIN users u ON (CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END) = u.id
       WHERE m.sender_id = ? OR m.receiver_id = ?
       GROUP BY partner_id
       ORDER BY last_message_time DESC`,
      [userId, userId, userId, userId, userId, userId, userId, userId, userId]
    );

    res.json({ conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations.' });
  }
});

// ==================== MARK MESSAGE AS READ ====================
router.put('/:messageId/read', verifyToken, async (req, res) => {
  try {
    await db.query('UPDATE messages SET is_read = 1 WHERE id = ? AND receiver_id = ?', [req.params.messageId, req.user.id]);
    res.json({ message: 'Message marked as read.' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Failed to mark message as read.' });
  }
});

// ==================== GET UNREAD COUNT ====================
router.get('/:userId/unread', verifyToken, async (req, res) => {
  try {
    const [result] = await db.query(
      'SELECT COUNT(*) as unreadCount FROM messages WHERE receiver_id = ? AND is_read = 0',
      [req.params.userId]
    );
    res.json({ unreadCount: result[0].unreadCount });
  } catch (error) {
    console.error('Unread count error:', error);
    res.status(500).json({ error: 'Failed to fetch unread count.' });
  }
});

module.exports = router;
