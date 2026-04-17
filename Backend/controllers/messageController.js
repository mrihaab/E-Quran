const db = require('../config/db');
const { createNotification } = require('../services/notificationService');
const { sendResponse } = require('../utils/responseHandler');
const { ApiError } = require('../middleware/errorMiddleware');
const logger = require('../utils/logger');

/**
 * SEND MESSAGE (Real-time enabled)
 */
exports.sendMessage = async (req, res, next) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.user.id;

    if (!receiverId || !content || !content.trim()) {
      throw new ApiError(400, 'Receiver and content are required.');
    }

    const [receivers] = await db.query(
      'SELECT id, full_name FROM users WHERE id = ? AND is_deleted = 0',
      [receiverId]
    );
    if (receivers.length === 0) throw new ApiError(404, 'Receiver not found.');

    const [result] = await db.query(
      'INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
      [senderId, receiverId, content.trim()]
    );

    // Fetch the full message with user data
    const [rows] = await db.query(
      `SELECT m.*,
              s.full_name as sender_name, s.profile_image as sender_image,
              r.full_name as receiver_name, r.profile_image as receiver_image
       FROM messages m
       JOIN users s ON m.sender_id = s.id
       JOIN users r ON m.receiver_id = r.id
       WHERE m.id = ?`,
      [result.insertId]
    );

    const messageData = rows[0];

    // Real-time Delivery via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${receiverId}`).emit('new_message', messageData);
      io.to(`user_${senderId}`).emit('message_sent', messageData);
    }

    // Persistent Notification
    try {
      await createNotification(
        req.app,
        receiverId,
        'New Message',
        `You have a new message from ${req.user.name}`,
        'info'
      );
    } catch (notifErr) {
      logger.warn('Notification creation failed (non-critical):', notifErr.message);
    }

    sendResponse(res, 201, messageData, 'Message sent.');
  } catch (error) {
    next(error);
  }
};

/**
 * GET CONVERSATION WITH A SPECIFIC PARTNER (Paginated)
 */
exports.getMessages = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const partnerId = parseInt(req.params.partnerId);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    if (!partnerId || isNaN(partnerId)) {
      throw new ApiError(400, 'Valid partner ID is required.');
    }

    const [messages] = await db.query(
      `SELECT m.*,
              s.full_name as sender_name, s.profile_image as sender_image,
              r.full_name as receiver_name, r.profile_image as receiver_image
       FROM messages m
       JOIN users s ON m.sender_id = s.id
       JOIN users r ON m.receiver_id = r.id
       WHERE m.is_deleted = 0 AND (
         (m.sender_id = ? AND m.receiver_id = ?) OR
         (m.sender_id = ? AND m.receiver_id = ?)
       )
       ORDER BY m.created_at ASC
       LIMIT ? OFFSET ?`,
      [userId, partnerId, partnerId, userId, limit, offset]
    );

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) as total FROM messages
       WHERE is_deleted = 0 AND (
         (sender_id = ? AND receiver_id = ?) OR
         (sender_id = ? AND receiver_id = ?)
       )`,
      [userId, partnerId, partnerId, userId]
    );

    sendResponse(res, 200, {
      messages,
      total,
      page,
      limit,
      hasMore: page * limit < total
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET ALL CONVERSATIONS for logged-in user
 */
exports.getConversations = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get the latest message for each unique conversation partner
    const [conversations] = await db.query(
      `SELECT
         u.id as partner_id,
         u.full_name as partner_name,
         u.profile_image as partner_image,
         u.role as partner_role,
         latest.content as last_message,
         latest.created_at as last_message_time,
         (
           SELECT COUNT(*) FROM messages m2
           WHERE m2.sender_id = u.id AND m2.receiver_id = ? AND m2.is_read = 0 AND m2.is_deleted = 0
         ) as unread_count
       FROM (
         SELECT
           CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END as partner_id,
           content,
           created_at,
           MAX(id) as max_id
         FROM messages
         WHERE (sender_id = ? OR receiver_id = ?) AND is_deleted = 0
         GROUP BY CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END
       ) latest
       JOIN users u ON u.id = latest.partner_id
       WHERE u.is_deleted = 0
       ORDER BY latest.created_at DESC`,
      [userId, userId, userId, userId, userId]
    );

    sendResponse(res, 200, { conversations });
  } catch (error) {
    next(error);
  }
};

/**
 * MARK ALL MESSAGES FROM A PARTNER AS READ
 */
exports.markRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const partnerId = parseInt(req.params.partnerId);

    if (!partnerId || isNaN(partnerId)) {
      throw new ApiError(400, 'Valid partner ID is required.');
    }

    await db.query(
      'UPDATE messages SET is_read = 1 WHERE receiver_id = ? AND sender_id = ? AND is_deleted = 0',
      [userId, partnerId]
    );

    sendResponse(res, 200, {}, 'Messages marked as read.');
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE A MESSAGE (Soft Delete)
 */
exports.deleteMessage = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const messageId = parseInt(req.params.messageId);

    const [messages] = await db.query(
      'SELECT * FROM messages WHERE id = ? AND sender_id = ? AND is_deleted = 0',
      [messageId, userId]
    );

    if (messages.length === 0) {
      throw new ApiError(404, 'Message not found or you are not the sender.');
    }

    await db.query('UPDATE messages SET is_deleted = 1 WHERE id = ?', [messageId]);

    sendResponse(res, 200, {}, 'Message deleted.');
  } catch (error) {
    next(error);
  }
};
