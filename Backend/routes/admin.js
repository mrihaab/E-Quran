const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');

// ==================== GET ALL USERS (admin only) ====================
router.get('/users', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { search, role, status } = req.query;

    let query = 'SELECT id, full_name, email, phone, role, status, profile_image, created_at, updated_at FROM users WHERE 1=1';
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

    const [users] = await db.query(query, params);

    const formatted = users.map(u => ({
      id: u.id,
      name: u.full_name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      status: u.status,
      avatar: u.profile_image,
      joinDate: u.created_at,
      lastActive: u.updated_at
    }));

    res.json({ users: formatted, total: formatted.length });
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

// ==================== UPDATE USER STATUS (admin only) ====================
router.put('/users/:userId', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { status, role } = req.body;
    const userId = req.params.userId;

    const updates = [];
    const values = [];

    if (status) { updates.push('status = ?'); values.push(status); }
    if (role) { updates.push('role = ?'); values.push(role); }

    if (updates.length > 0) {
      values.push(userId);
      await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    res.json({ message: 'User updated successfully.' });
  } catch (error) {
    console.error('Admin update user error:', error);
    res.status(500).json({ error: 'Failed to update user.' });
  }
});

// ==================== DELETE USER (admin only) ====================
router.delete('/users/:userId', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const userId = req.params.userId;

    // Don't allow deleting yourself
    if (req.user.id === parseInt(userId)) {
      return res.status(400).json({ error: 'You cannot delete your own account.' });
    }

    await db.query('DELETE FROM users WHERE id = ?', [userId]);
    res.json({ message: 'User deleted successfully.' });
  } catch (error) {
    console.error('Admin delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user.' });
  }
});

// ==================== GET DASHBOARD STATS (admin only) ====================
router.get('/stats', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const [totalUsers] = await db.query('SELECT COUNT(*) as count FROM users');
    const [totalStudents] = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'student'");
    const [totalTeachers] = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'teacher'");
    const [totalParents] = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'parent'");
    const [totalClasses] = await db.query('SELECT COUNT(*) as count FROM classes');
    const [activeClasses] = await db.query("SELECT COUNT(*) as count FROM classes WHERE status = 'Active'");
    const [totalRevenue] = await db.query("SELECT IFNULL(SUM(amount), 0) as total FROM payments WHERE status = 'completed'");
    const [totalEnrollments] = await db.query('SELECT COUNT(*) as count FROM enrollments');
    const [totalMessages] = await db.query('SELECT COUNT(*) as count FROM messages');
    const [totalContacts] = await db.query('SELECT COUNT(*) as count FROM contact_messages');

    // Monthly new users (last 6 months)
    const [monthlyUsers] = await db.query(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count
       FROM users
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY month
       ORDER BY month ASC`
    );

    // Role distribution
    const [roleDistribution] = await db.query(
      `SELECT role, COUNT(*) as count FROM users GROUP BY role`
    );

    res.json({
      totalUsers: totalUsers[0].count,
      totalStudents: totalStudents[0].count,
      totalTeachers: totalTeachers[0].count,
      totalParents: totalParents[0].count,
      totalClasses: totalClasses[0].count,
      activeClasses: activeClasses[0].count,
      totalRevenue: totalRevenue[0].total,
      totalEnrollments: totalEnrollments[0].count,
      totalMessages: totalMessages[0].count,
      totalContacts: totalContacts[0].count,
      monthlyUsers,
      roleDistribution
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
});

module.exports = router;
