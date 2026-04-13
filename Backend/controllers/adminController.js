const db = require('../config/db');
const { getPaginatedRes } = require('../utils/paginate');
const { sendResponse } = require('../utils/responseHandler');
const { ApiError } = require('../middleware/errorMiddleware');

/**
 * GET ALL USERS (Paginated)
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const { search, role, status, page, limit } = req.query;

    let query = 'SELECT id, full_name, email, phone, role, status, profile_image, is_verified, created_at FROM users WHERE is_deleted = 0';
    const params = [];

    if (search) {
      query += ' AND (full_name LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (role && role !== 'all') {
      query += ' AND role = ?';
      params.push(role);
    }
    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const result = await getPaginatedRes(query, params, page, limit);
    sendResponse(res, 200, result);
  } catch (error) {
    next(error);
  }
};

/**
 * UPDATE USER
 */
exports.updateUser = async (req, res, next) => {
  try {
    const { status, role } = req.body;
    const userId = req.params.userId;

    const updates = [];
    const values = [];
    if (status) { updates.push('status = ?'); values.push(status); }
    if (role) { updates.push('role = ?'); values.push(role); }

    if (updates.length === 0) throw new ApiError(400, 'No updates provided.');

    values.push(userId);
    await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);

    sendResponse(res, 200, {}, 'User updated successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * GET DASHBOARD ANALYTICS
 */
exports.getStats = async (req, res, next) => {
  try {
    const [[totalUsers]] = await db.query('SELECT COUNT(*) as count FROM users WHERE is_deleted = 0');
    const [[totalRevenue]] = await db.query("SELECT IFNULL(SUM(amount), 0) as total FROM payments WHERE status = 'completed'");
    const [[totalClasses]] = await db.query('SELECT COUNT(*) as count FROM classes WHERE is_deleted = 0');
    const [[pendingEnrollments]] = await db.query("SELECT COUNT(*) as count FROM enrollments WHERE status = 'pending' AND is_deleted = 0");

    const [monthlyStats] = await db.query(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count
       FROM users WHERE is_deleted = 0
       GROUP BY month ORDER BY month DESC LIMIT 6`
    );

    sendResponse(res, 200, {
      overview: {
        totalUsers: totalUsers.count,
        totalRevenue: totalRevenue.total,
        totalClasses: totalClasses.count,
        pendingEnrollments: pendingEnrollments.count
      },
      monthlyStats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GENERATE SYSTEM REPORT
 */
exports.generateReport = async (req, res, next) => {
  try {
    const [[userStats]] = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN role = 'student' THEN 1 ELSE 0 END) as students,
        SUM(CASE WHEN role = 'teacher' THEN 1 ELSE 0 END) as teachers,
        SUM(CASE WHEN is_verified = 1 THEN 1 ELSE 0 END) as verified
      FROM users WHERE is_deleted = 0
    `);

    const [[financialStats]] = await db.query(`
      SELECT 
        IFNULL(SUM(amount), 0) as totalRevenue,
        COUNT(*) as totalTransactions
      FROM payments WHERE status = 'completed'
    `);

    const [topTeachers] = await db.query(`
      SELECT u.full_name, t.rating, t.subject
      FROM teachers t
      JOIN users u ON t.user_id = u.id
      WHERE u.is_deleted = 0
      ORDER BY t.rating DESC LIMIT 5
    `);

    sendResponse(res, 200, {
      generatedAt: new Date(),
      summary: {
        users: userStats,
        finance: financialStats,
        topTeachers
      }
    });
  } catch (error) {
    next(error);
  }
};
