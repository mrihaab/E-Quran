const db = require('../config/db');
const { getPaginatedRes } = require('../utils/paginate');
const { sendResponse } = require('../utils/responseHandler');
const { ApiError } = require('../middleware/errorMiddleware');

/**
 * GET ALL NOTIFICATIONS FOR USER (Paginated)
 */
exports.getNotifications = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const userId = req.user.id;

    const query = 'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC';
    const result = await getPaginatedRes(query, [userId], page, limit);
    
    sendResponse(res, 200, result);
  } catch (error) {
    next(error);
  }
};

/**
 * MARK NOTIFICATION AS READ
 */
exports.markAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    await db.query(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );

    sendResponse(res, 200, {}, 'Notification marked as read.');
  } catch (error) {
    next(error);
  }
};

/**
 * MARK ALL AS READ
 */
exports.markAllRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await db.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [userId]);
    sendResponse(res, 200, {}, 'All notifications marked as read.');
  } catch (error) {
    next(error);
  }
};
