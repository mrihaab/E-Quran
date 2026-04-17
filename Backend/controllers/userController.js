const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { sendResponse } = require('../utils/responseHandler');
const { ApiError } = require('../middleware/errorMiddleware');
const { getPaginatedRes } = require('../utils/paginate');
const logger = require('../utils/logger');

/**
 * GET USER PROFILE
 */
exports.getProfile = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId || req.user.id);

    const [users] = await db.query(
      'SELECT id, full_name, email, phone, role, gender, address, status, profile_image, is_verified, created_at FROM users WHERE id = ? AND is_deleted = 0',
      [userId]
    );

    if (users.length === 0) throw new ApiError(404, 'User not found.');

    const user = users[0];
    let roleData = null;

    if (user.role === 'student') {
      const [students] = await db.query('SELECT * FROM students WHERE user_id = ?', [userId]);
      roleData = students[0] || null;
    } else if (user.role === 'teacher') {
      const [teachers] = await db.query('SELECT * FROM teachers WHERE user_id = ?', [userId]);
      roleData = teachers[0] || null;
    } else if (user.role === 'parent') {
      const [parents] = await db.query('SELECT * FROM parents WHERE user_id = ?', [userId]);
      roleData = parents[0] || null;
    } else if (user.role === 'admin') {
      const [admins] = await db.query('SELECT * FROM admins WHERE user_id = ?', [userId]);
      roleData = admins[0] || null;
    }

    const response = {
      id: user.id,
      name: user.full_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      gender: user.gender,
      address: user.address,
      status: user.status,
      isVerified: !!user.is_verified,
      profileImage: user.profile_image,
      createdAt: user.created_at,
      roleDetails: roleData
    };

    sendResponse(res, 200, response);
  } catch (error) {
    next(error);
  }
};

/**
 * UPDATE USER PROFILE
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId || req.user.id);

    if (req.user.id !== userId && req.user.role !== 'admin') {
      throw new ApiError(403, 'Unauthorized access.');
    }

    const { fullName, phone, gender, address } = req.body;
    const updates = [];
    const values = [];

    if (fullName) { updates.push('full_name = ?'); values.push(fullName); }
    if (phone) { updates.push('phone = ?'); values.push(phone); }
    if (gender) { updates.push('gender = ?'); values.push(gender); }
    if (address) { updates.push('address = ?'); values.push(address); }

    if (updates.length > 0) {
      values.push(userId);
      await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    const [users] = await db.query('SELECT role FROM users WHERE id = ?', [userId]);
    const role = users[0].role;

    // Role-specific updates
    if (role === 'student') {
      const { course, level } = req.body;
      if (course || level) {
        const sUpdates = [];
        const sValues = [];
        if (course) { sUpdates.push('course = ?'); sValues.push(course); }
        if (level) { sUpdates.push('level = ?'); sValues.push(level); }
        sValues.push(userId);
        await db.query(`UPDATE students SET ${sUpdates.join(', ')} WHERE user_id = ?`, sValues);
      }
    } else if (role === 'teacher') {
      const { qualification, subject, yearsOfExperience, expertise, availability, languages } = req.body;
      const tUpdates = [];
      const tValues = [];
      if (qualification) { tUpdates.push('qualification = ?'); tValues.push(qualification); }
      if (subject) { tUpdates.push('subject = ?'); tValues.push(subject); }
      if (yearsOfExperience !== undefined) { tUpdates.push('years_experience = ?'); tValues.push(yearsOfExperience); }
      if (expertise) { tUpdates.push('expertise = ?'); tValues.push(expertise); }
      if (availability) { tUpdates.push('availability = ?'); tValues.push(availability); }
      if (languages) { tUpdates.push('languages = ?'); tValues.push(languages); }
      if (tUpdates.length > 0) {
        tValues.push(userId);
        await db.query(`UPDATE teachers SET ${tUpdates.join(', ')} WHERE user_id = ?`, tValues);
      }
    }

    sendResponse(res, 200, {}, 'Profile updated successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * CHANGE PASSWORD
 */
exports.changePassword = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) throw new ApiError(400, 'All fields are required.');

    const [users] = await db.query('SELECT password_hash FROM users WHERE id = ?', [userId]);
    const isMatch = await bcrypt.compare(currentPassword, users[0].password_hash);
    
    if (!isMatch) throw new ApiError(401, 'Current password is incorrect.');

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, userId]);

    sendResponse(res, 200, {}, 'Password updated successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * SEARCH USERS - Directory for finding contacts
 */
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

    if (q) {
      query += ` AND (full_name LIKE ? OR email LIKE ?)`;
      params.push(`%${q}%`, `%${q}%`);
    }

    if (role) {
      query += ` AND role = ?`;
      params.push(role);
    }

    query += ` ORDER BY full_name ASC`;

    const result = await getPaginatedRes(query, params, page, limit);
    
    logger.info(`User search: "${q || ''}" role: "${role || 'all'}" - Found ${result.data.length} users`);
    sendResponse(res, 200, result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET ALL USERS - Admin only
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const { page, limit, role } = req.query;

    let query = `
      SELECT id, full_name, email, phone, role, profile_image, status, is_verified, created_at
      FROM users
      WHERE is_deleted = 0
    `;
    const params = [];

    if (role) {
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
