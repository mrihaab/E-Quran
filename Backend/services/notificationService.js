const db = require('../config/db');
const logger = require('../utils/logger');

/**
 * Trigger Notification
 * @param {object} app - Express app instance to get 'io'
 * @param {number} userId - ID of the user to notify
 * @param {string} title - Notification title
 * @param {string} message - Notification content
 * @param {string} type - 'info', 'success', 'warning', 'error'
 */
const createNotification = async (app, userId, title, message, type = 'info') => {
  try {
    const [result] = await db.query(
      'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
      [userId, title, message, type]
    );

    const notificationId = result.insertId;
    
    // Real-time delivery via Socket.io
    const io = app.get('io');
    if (io) {
      io.to(`user_${userId}`).emit('notification', {
        id: notificationId,
        title,
        message,
        type,
        created_at: new Date()
      });
    }

    logger.info(`🔔 Notification Push: User ${userId} | ${title}`);
    return true;
  } catch (error) {
    logger.error('Notification trigger error:', error);
    return false;
  }
};

module.exports = { createNotification };
