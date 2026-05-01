const db = require('../config/db');
const logger = require('../utils/logger');

const createNotification = async (app, userId, title, message, type = 'info') => {
  try {
    if (!userId || !title) {
      logger.warn('Notification skipped: missing userId or title');
      return false;
    }

    const [result] = await db.query(
      'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
      [userId, title, message || '', type]
    );

    const notificationId = result.insertId;

    const io = app.get('io');
    if (io) {
      io.to(`user_${userId}`).emit('notification', {
        id: notificationId,
        title,
        message,
        type,
        is_read: 0,
        created_at: new Date().toISOString(),
      });
    }

    logger.debug(`Notification sent to user ${userId}: ${title}`);
    return true;
  } catch (error) {
    logger.error('Notification creation failed:', error.message);
    return false;
  }
};

module.exports = { createNotification };
