const db = require('../config/db');
const { getPaginatedRes } = require('../utils/paginate');
const { sendResponse } = require('../utils/responseHandler');
const { ApiError } = require('../middleware/errorMiddleware');
const logger = require('../utils/logger');

/**
 * GET ALL USERS (Paginated, Searchable, Filterable)
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const { search, role, status, page, limit } = req.query;

    let query = `
      SELECT 
        u.id, u.full_name, u.email, u.phone, u.role, u.status,
        u.profile_image, u.is_verified, u.is_approved, u.created_at,
        CASE
          WHEN u.role = 'student' THEN s.student_id
          WHEN u.role = 'teacher' THEN t.teacher_id
          WHEN u.role = 'parent' THEN p.parent_id
          ELSE NULL
        END as role_id
      FROM users u
      LEFT JOIN students s ON u.id = s.user_id AND u.role = 'student'
      LEFT JOIN teachers t ON u.id = t.user_id AND u.role = 'teacher'
      LEFT JOIN parents p ON u.id = p.user_id AND u.role = 'parent'
      WHERE u.is_deleted = 0
    `;
    const params = [];

    if (search) {
      query += ' AND (u.full_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (role && role !== 'all') {
      query += ' AND u.role = ?';
      params.push(role);
    }
    if (status && status !== 'all') {
      query += ' AND u.status = ?';
      params.push(status);
    }

    query += ' ORDER BY u.created_at DESC';

    const result = await getPaginatedRes(query, params, page, limit);
    sendResponse(res, 200, result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET SINGLE USER (Admin)
 */
exports.getUser = async (req, res, next) => {
  try {
    const userId = req.params.userId;

    const [users] = await db.query(
      `SELECT id, full_name, email, phone, role, status, profile_image,
              is_verified, is_approved, gender, address, created_at
       FROM users WHERE id = ? AND is_deleted = 0`,
      [userId]
    );

    if (users.length === 0) throw new ApiError(404, 'User not found.');

    sendResponse(res, 200, users[0]);
  } catch (error) {
    next(error);
  }
};

/**
 * UPDATE USER (Admin - can change status, role, approval)
 */
exports.updateUser = async (req, res, next) => {
  try {
    const { status, role, is_approved, full_name, phone } = req.body;
    const userId = req.params.userId;

    // Prevent admin from modifying themselves
    if (parseInt(userId) === req.user.id) {
      throw new ApiError(403, 'You cannot modify your own admin account through this endpoint.');
    }

    const updates = [];
    const values = [];

    if (status !== undefined) { updates.push('status = ?'); values.push(status); }
    if (role !== undefined) { updates.push('role = ?'); values.push(role); }
    if (is_approved !== undefined) { updates.push('is_approved = ?'); values.push(is_approved ? 1 : 0); }
    if (full_name) { updates.push('full_name = ?'); values.push(full_name); }
    if (phone) { updates.push('phone = ?'); values.push(phone); }

    if (updates.length === 0) throw new ApiError(400, 'No updates provided.');

    values.push(userId);
    await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);

    logger.info(`Admin ${req.user.id} updated user ${userId}: ${JSON.stringify(req.body)}`);
    sendResponse(res, 200, {}, 'User updated successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE USER (Soft Delete)
 */
exports.deleteUser = async (req, res, next) => {
  try {
    const userId = req.params.userId;

    // Prevent admin from deleting themselves
    if (parseInt(userId) === req.user.id) {
      throw new ApiError(403, 'You cannot delete your own account.');
    }

    const [users] = await db.query(
      'SELECT id, role, email FROM users WHERE id = ? AND is_deleted = 0',
      [userId]
    );

    if (users.length === 0) throw new ApiError(404, 'User not found.');

    // Soft delete
    await db.query(
      'UPDATE users SET is_deleted = 1, status = ?, email = ? WHERE id = ?',
      ['suspended', `deleted_${Date.now()}_${users[0].email}`, userId]
    );

    logger.info(`Admin ${req.user.id} deleted user ${userId} (${users[0].email})`);
    sendResponse(res, 200, {}, 'User deleted successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * GET DASHBOARD ANALYTICS / STATS
 */
exports.getStats = async (req, res, next) => {
  try {
    const [[totalUsers]] = await db.query(
      "SELECT COUNT(*) as count FROM users WHERE is_deleted = 0"
    );
    const [[totalStudents]] = await db.query(
      "SELECT COUNT(*) as count FROM users WHERE is_deleted = 0 AND role = 'student'"
    );
    const [[totalTeachers]] = await db.query(
      "SELECT COUNT(*) as count FROM users WHERE is_deleted = 0 AND role = 'teacher'"
    );
    const [[totalRevenue]] = await db.query(
      "SELECT IFNULL(SUM(amount), 0) as total FROM payments WHERE status = 'completed'"
    );
    const [[totalClasses]] = await db.query(
      'SELECT COUNT(*) as count FROM classes WHERE is_deleted = 0'
    );
    const [[activeClasses]] = await db.query(
      "SELECT COUNT(*) as count FROM classes WHERE is_deleted = 0 AND status = 'Active'"
    );
    const [[pendingEnrollments]] = await db.query(
      "SELECT COUNT(*) as count FROM enrollments WHERE status = 'pending' AND is_deleted = 0"
    );
    const [[totalEnrollments]] = await db.query(
      "SELECT COUNT(*) as count FROM enrollments WHERE is_deleted = 0"
    );
    const [[unreadMessages]] = await db.query(
      "SELECT COUNT(*) as count FROM messages WHERE is_read = 0 AND is_deleted = 0"
    );

    // Monthly user signups (last 6 months)
    const [monthlySignups] = await db.query(
      `SELECT DATE_FORMAT(created_at, '%b %Y') as month,
              COUNT(*) as users,
              SUM(CASE WHEN role='student' THEN 1 ELSE 0 END) as students,
              SUM(CASE WHEN role='teacher' THEN 1 ELSE 0 END) as teachers
       FROM users
       WHERE is_deleted = 0 AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY DATE_FORMAT(created_at, '%Y-%m'), DATE_FORMAT(created_at, '%b %Y')
       ORDER BY DATE_FORMAT(created_at, '%Y-%m') ASC`
    );

    // Monthly revenue (last 6 months)
    const [monthlyRevenue] = await db.query(
      `SELECT DATE_FORMAT(payment_date, '%b %Y') as month,
              IFNULL(SUM(amount), 0) as revenue
       FROM payments
       WHERE status = 'completed' AND payment_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY DATE_FORMAT(payment_date, '%Y-%m'), DATE_FORMAT(payment_date, '%b %Y')
       ORDER BY DATE_FORMAT(payment_date, '%Y-%m') ASC`
    );

    // User role distribution
    const [roleDistribution] = await db.query(
      `SELECT role as name, COUNT(*) as value
       FROM users WHERE is_deleted = 0
       GROUP BY role`
    );

    // Recent users
    const [recentUsers] = await db.query(
      `SELECT id, full_name, email, role, status, profile_image, created_at
       FROM users WHERE is_deleted = 0
       ORDER BY created_at DESC LIMIT 10`
    );

    sendResponse(res, 200, {
      overview: {
        totalUsers: totalUsers.count,
        totalStudents: totalStudents.count,
        totalTeachers: totalTeachers.count,
        totalRevenue: parseFloat(totalRevenue.total),
        totalClasses: totalClasses.count,
        activeClasses: activeClasses.count,
        pendingEnrollments: pendingEnrollments.count,
        totalEnrollments: totalEnrollments.count,
        unreadMessages: unreadMessages.count
      },
      monthlySignups,
      monthlyRevenue,
      roleDistribution,
      recentUsers
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
        SUM(CASE WHEN role = 'parent' THEN 1 ELSE 0 END) as parents,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins,
        SUM(CASE WHEN is_verified = 1 THEN 1 ELSE 0 END) as verified,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active
      FROM users WHERE is_deleted = 0
    `);

    const [[financialStats]] = await db.query(`
      SELECT
        IFNULL(SUM(amount), 0) as totalRevenue,
        COUNT(*) as totalTransactions,
        IFNULL(AVG(amount), 0) as avgTransaction
      FROM payments WHERE status = 'completed'
    `);

    const [topTeachers] = await db.query(`
      SELECT u.full_name as name, u.email,
             IFNULL(t.rating, 0) as rating,
             t.subject,
             COUNT(DISTINCT e.student_id) as students
      FROM teachers t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN classes c ON c.teacher_id = u.id AND c.is_deleted = 0
      LEFT JOIN enrollments e ON e.class_id = c.id AND e.is_deleted = 0
      WHERE u.is_deleted = 0
      GROUP BY u.id, u.full_name, u.email, t.rating, t.subject
      ORDER BY students DESC, t.rating DESC
      LIMIT 10
    `);

    const [classStats] = await db.query(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'Inactive' THEN 1 ELSE 0 END) as inactive,
        IFNULL(AVG(enrolled_count), 0) as avgEnrollments
      FROM classes WHERE is_deleted = 0
    `);

    sendResponse(res, 200, {
      generatedAt: new Date(),
      summary: {
        users: userStats,
        finance: financialStats,
        classes: classStats[0] || {},
        topTeachers
      }
    });
  } catch (error) {
    next(error);
  }
};
