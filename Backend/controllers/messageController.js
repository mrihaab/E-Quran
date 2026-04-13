const db = require('../config/db');
const { createNotification } = require('../services/notificationService');
const { getPaginatedRes } = require('../utils/paginate');
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

    if (!receiverId || !content) {
      throw new ApiError(400, 'Receiver and content are required.');
    }

    const [receivers] = await db.query('SELECT id, full_name FROM users WHERE id = ? AND is_deleted = 0', [receiverId]);
    if (receivers.length === 0) throw new ApiError(404, 'Receiver not found.');

    const [result] = await db.query(
      'INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
      [senderId, receiverId, content]
    );

    const messageData = {
      id: result.insertId,
      sender_id: senderId,
      receiver_id: receiverId,
      content,
      created_at: new Date(),
      sender_name: req.user.name
    };

    // Real-time Delivery via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${receiverId}`).emit('new_message', messageData);
    }

    // Persistent Notification
    await createNotification(
      req.app,
      receiverId,
      'New Message',
      `You have a new message from ${req.user.name}`,
      'info'
    );

    sendResponse(res, 201, messageData, 'Message sent.');
  } catch (error) {
    next(error);
  }
};

/**
 * GET CONVERSATION WITH USER (Paginated)
 */
exports.getMessages = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const userId = req.user.id;
    const partnerId = req.params.userId;

    const query = `
      SELECT m.*, 
             s.full_name as sender_name, s.profile_image as sender_image,
             r.full_name as receiver_name, r.profile_image as receiver_image
      FROM messages m
      JOIN users s ON m.sender_id = s.id
      JOIN users r ON m.receiver_id = r.id
      WHERE m.is_deleted = 0 AND (
        (m.sender_id = ? AND m.receiver_id = ?) OR 
        (m.sender_id = ? AND m.receiver_id = ?)
      )
      ORDER BY m.created_at DESC
    `;

    const result = await getPaginatedRes(query, [userId, partnerId, partnerId, userId], page, limit);
    // Reverse data for UI chat order (newest at bottom)
    result.data = result.data.reverse();
    
    sendResponse(res, 200, result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET ALL CONVERSATIONS (Paginated)
 */
exports.getConversations = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const userId = req.user.id;

    const query = `
      SELECT 
        u.id as partner_id, u.full_name as partner_name, u.profile_image as partner_image, u.role as partner_role,
        m.content as last_message, m.created_at as last_message_time,
        (SELECT COUNT(*) FROM messages m2 WHERE m2.sender_id = u.id AND m2.receiver_id = ? AND m2.is_read = 0 AND m2.is_deleted = 0) as unread_count
      FROM messages m
      JOIN users u ON (CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END) = u.id
      WHERE m.is_deleted = 0 AND m.id IN (
        SELECT MAX(id) FROM messages WHERE (sender_id = ? OR receiver_id = ?) AND is_deleted = 0 
        GROUP BY CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END
      )
      ORDER BY m.created_at DESC
    `;

    const result = await getPaginatedRes(query, [userId, userId, userId, userId, userId], page, limit);
    sendResponse(res, 200, result);
  } catch (error) {
    next(error);
  }
};

/**
 * MARK READ
 */
exports.markRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const partnerId = req.params.userId;

    await db.query(
      'UPDATE messages SET is_read = 1 WHERE receiver_id = ? AND sender_id = ? AND is_deleted = 0',
      [userId, partnerId]
    );

    sendResponse(res, 200, {}, 'Messages marked as read.');
  } catch (error) {
    next(error);
  }
};
