const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { sendResponse } = require('../utils/responseHandler');
const { ApiError } = require('../middleware/errorMiddleware');
const { getPaginatedRes } = require('../utils/paginate');
const logger = require('../utils/logger');

const SALT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 8;

exports.getProfile = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId || req.user.id, 10);

    if (isNaN(userId)) throw ApiError.badRequest('Invalid user ID.');

    if (req.user.id !== userId && req.user.role !== 'admin') {
      throw ApiError.forbidden('You can only view your own profile.');
    }

    const [users] = await db.query(
      `SELECT id, full_name, email, phone, role, gender, address, status,
              profile_image, is_verified, approval_status, created_at
       FROM users WHERE id = ? AND is_deleted = 0`,
      [userId]
    );

    if (users.length === 0) throw ApiError.notFound('User not found.');

    const user = users[0];
    let roleData = null;

    const roleTableMap = {
      student: 'students',
      teacher: 'teachers',
      parent: 'parents',
      admin: 'admins',
    };

    const table = roleTableMap[user.role];
    if (table) {
      const [rows] = await db.query(`SELECT * FROM ${table} WHERE user_id = ?`, [userId]);
      roleData = rows[0] || null;
    }

    sendResponse(res, 200, {
      id: user.id,
      name: user.full_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      gender: user.gender,
      address: user.address,
      status: user.status,
      approvalStatus: user.approval_status,
      isVerified: !!user.is_verified,
      profileImage: user.profile_image,
      createdAt: user.created_at,
      roleDetails: roleData,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId || req.user.id, 10);

    if (isNaN(userId)) throw ApiError.badRequest('Invalid user ID.');

    if (req.user.id !== userId && req.user.role !== 'admin') {
      throw ApiError.forbidden('You can only update your own profile.');
    }

    const { fullName, phone, gender, address } = req.body;
    const updates = [];
    const values = [];

    if (fullName && fullName.trim()) { updates.push('full_name = ?'); values.push(fullName.trim()); }
    if (phone !== undefined) { updates.push('phone = ?'); values.push(phone || null); }
    if (gender) { updates.push('gender = ?'); values.push(gender); }
    if (address !== undefined) { updates.push('address = ?'); values.push(address || null); }

    if (updates.length > 0) {
      values.push(userId);
      await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ? AND is_deleted = 0`, values);
    }

    const [users] = await db.query('SELECT role FROM users WHERE id = ?', [userId]);
    if (users.length === 0) throw ApiError.notFound('User not found.');
    const role = users[0].role;

    if (role === 'student') {
      const { course, level } = req.body;
      const sUpdates = [];
      const sValues = [];
      if (course !== undefined) { sUpdates.push('course = ?'); sValues.push(course || null); }
      if (level) { sUpdates.push('level = ?'); sValues.push(level); }
      if (sUpdates.length > 0) {
        sValues.push(userId);
        await db.query(`UPDATE students SET ${sUpdates.join(', ')} WHERE user_id = ?`, sValues);
      }
    } else if (role === 'teacher') {
      const { qualification, subject, yearsOfExperience, expertise, availability, languages } = req.body;
      const tUpdates = [];
      const tValues = [];
      if (qualification !== undefined) { tUpdates.push('qualification = ?'); tValues.push(qualification); }
      if (subject !== undefined) { tUpdates.push('subject = ?'); tValues.push(subject); }
      if (yearsOfExperience !== undefined) { tUpdates.push('years_experience = ?'); tValues.push(yearsOfExperience); }
      if (expertise !== undefined) { tUpdates.push('expertise = ?'); tValues.push(expertise); }
      if (availability !== undefined) { tUpdates.push('availability = ?'); tValues.push(availability); }
      if (languages !== undefined) { tUpdates.push('languages = ?'); tValues.push(languages); }
      if (tUpdates.length > 0) {
        tValues.push(userId);
        await db.query(`UPDATE teachers SET ${tUpdates.join(', ')} WHERE user_id = ?`, tValues);
      }
    } else if (role === 'parent') {
      const { occupation, childName, relationship, childClass } = req.body;
      const pUpdates = [];
      const pValues = [];
      if (occupation !== undefined) { pUpdates.push('occupation = ?'); pValues.push(occupation); }
      if (childName !== undefined) { pUpdates.push('child_name = ?'); pValues.push(childName); }
      if (relationship) { pUpdates.push('relationship = ?'); pValues.push(relationship); }
      if (childClass !== undefined) { pUpdates.push('child_class = ?'); pValues.push(childClass); }
      if (pUpdates.length > 0) {
        pValues.push(userId);
        await db.query(`UPDATE parents SET ${pUpdates.join(', ')} WHERE user_id = ?`, pValues);
      }
    }

    logger.info(`Profile updated: user ${userId}`);
    sendResponse(res, 200, {}, 'Profile updated successfully.');
  } catch (error) {
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw ApiError.badRequest('Current password and new password are required.');
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      throw ApiError.badRequest(`New password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    }

    if (currentPassword === newPassword) {
      throw ApiError.badRequest('New password must be different from current password.');
    }

    const [users] = await db.query('SELECT password_hash FROM users WHERE id = ?', [userId]);
    if (users.length === 0) throw ApiError.notFound('User not found.');

    if (users[0].password_hash === 'google_oauth' || users[0].password_hash === 'PREDEFINED_ADMIN') {
      throw ApiError.badRequest('Cannot change password for Google OAuth accounts. Use password reset instead.');
    }

    const isMatch = await bcrypt.compare(currentPassword, users[0].password_hash);
    if (!isMatch) throw new ApiError(401, 'Current password is incorrect.', 'WRONG_PASSWORD');

    const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, userId]);

    logger.info(`Password changed: user ${userId}`);
    sendResponse(res, 200, {}, 'Password updated successfully.');
  } catch (error) {
    next(error);
  }
};

exports.searchUsers = async (req, res, next) => {
  try {
    const { q, role, page, limit } = req.query;
    const currentUserId = req.user.id;

    let query = `
      SELECT id, full_name, email, phone, role, profile_image, status, created_at
      FROM users
      WHERE is_deleted = 0 AND is_verified = 1 AND status = 'active'
      AND id != ?
    `;
    const params = [currentUserId];

    if (q && q.trim()) {
      query += ` AND (full_name LIKE ? OR email LIKE ?)`;
      const searchTerm = `%${q.trim()}%`;
      params.push(searchTerm, searchTerm);
    }

    if (role && ['student', 'teacher', 'parent', 'admin'].includes(role)) {
      query += ` AND role = ?`;
      params.push(role);
    }

    query += ` ORDER BY full_name ASC`;

    const result = await getPaginatedRes(query, params, page, limit);
    sendResponse(res, 200, result);
  } catch (error) {
    next(error);
  }
};

exports.getAllUsers = async (req, res, next) => {
  try {
    const { page, limit, role } = req.query;

    let query = `
      SELECT id, full_name, email, phone, role, profile_image, status, is_verified, approval_status, created_at
      FROM users
      WHERE is_deleted = 0
    `;
    const params = [];

    if (role && ['student', 'teacher', 'parent', 'admin'].includes(role)) {
      query += ` AND role = ?`;
      params.push(role);
    }

    query += ` ORDER BY created_at DESC`;

    const result = await getPaginatedRes(query, params, page, limit);
    sendResponse(res, 200, result);
  } catch (error) {
    next(error);
  }
};
