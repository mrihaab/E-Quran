const db = require('../config/db');
const { getPaginatedRes } = require('../utils/paginate');
const { sendResponse } = require('../utils/responseHandler');
const { ApiError } = require('../middleware/errorMiddleware');

/**
 * GET ALL CLASSES (Advanced Search, Filtering & Pagination)
 */
exports.getClasses = async (req, res, next) => {
  try {
    const { 
      subject, 
      level, 
      search, 
      sortBy, 
      teacherId,
      page,
      limit
    } = req.query;

    let query = `
      SELECT c.*, u.full_name as teacher_name, u.profile_image as teacher_image, t.rating as teacher_rating
      FROM classes c
      JOIN users u ON c.teacher_id = u.id
      JOIN teachers t ON u.id = t.user_id
      WHERE c.is_deleted = 0 AND c.status != 'Cancelled'
    `;
    const params = [];

    if (subject && subject !== 'all') {
      query += ' AND c.subject = ?';
      params.push(subject);
    }

    if (level && level !== 'all') {
      query += ' AND c.level = ?';
      params.push(level);
    }

    if (teacherId) {
      query += ' AND c.teacher_id = ?';
      params.push(teacherId);
    }

    if (search) {
      query += ' AND (c.name LIKE ? OR c.subject LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Sorting
    if (sortBy === 'newest') {
      query += ' ORDER BY c.created_at DESC';
    } else if (sortBy === 'level') {
      query += ' ORDER BY c.level ASC';
    } else {
      query += ' ORDER BY c.created_at DESC';
    }

    const result = await getPaginatedRes(query, params, page, limit);
    sendResponse(res, 200, result, 'Classes fetched successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * GET SINGLE CLASS
 */
exports.getClassById = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT c.*, u.full_name as teacher_name, u.profile_image as teacher_image, t.rating as teacher_rating, t.expertise, t.qualification
       FROM classes c
       JOIN users u ON c.teacher_id = u.id
       JOIN teachers t ON u.id = t.user_id
       WHERE c.id = ? AND c.is_deleted = 0`,
      [req.params.classId]
    );

    if (rows.length === 0) throw new ApiError(404, 'Class not found.');
    sendResponse(res, 200, rows[0]);
  } catch (error) {
    next(error);
  }
};

/**
 * CREATE CLASS
 */
exports.createClass = async (req, res, next) => {
  try {
    const { name, subject, level, schedule, capacity, platform } = req.body;
    const teacherId = req.user.role === 'teacher' ? req.user.id : req.body.teacherId;

    if (!name || !subject || !teacherId) {
      throw new ApiError(400, 'Name, subject, and teacher are required.');
    }

    const [result] = await db.query(
      `INSERT INTO classes (name, teacher_id, subject, level, schedule, capacity, platform, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Active')`,
      [name, teacherId, subject, level || 'Beginner', schedule || null, capacity || 20, platform || 'Zoom']
    );

    sendResponse(res, 201, { classId: result.insertId }, 'Class created successfully!');
  } catch (error) {
    next(error);
  }
};

/**
 * UPDATE CLASS
 */
exports.updateClass = async (req, res, next) => {
  try {
    const classId = req.params.classId;
    const { name, subject, level, schedule, capacity, platform, status } = req.body;

    // Ownership check
    if (req.user.role !== 'admin') {
      const [classes] = await db.query('SELECT teacher_id FROM classes WHERE id = ? AND is_deleted = 0', [classId]);
      if (classes.length === 0) throw new ApiError(404, 'Class not found.');
      if (classes[0].teacher_id !== req.user.id) throw new ApiError(403, 'Unauthorized.');
    }

    const updates = [];
    const values = [];
    if (name) { updates.push('name = ?'); values.push(name); }
    if (subject) { updates.push('subject = ?'); values.push(subject); }
    if (level) { updates.push('level = ?'); values.push(level); }
    if (schedule) { updates.push('schedule = ?'); values.push(schedule); }
    if (capacity) { updates.push('capacity = ?'); values.push(capacity); }
    if (platform) { updates.push('platform = ?'); values.push(platform); }
    if (status) { updates.push('status = ?'); values.push(status); }

    if (updates.length > 0) {
      values.push(classId);
      await db.query(`UPDATE classes SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    sendResponse(res, 200, {}, 'Class updated successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE CLASS (Soft Delete)
 */
exports.deleteClass = async (req, res, next) => {
  try {
    const classId = req.params.classId;

    if (req.user.role !== 'admin') {
      const [classes] = await db.query('SELECT teacher_id FROM classes WHERE id = ? AND is_deleted = 0', [classId]);
      if (classes.length === 0) throw new ApiError(404, 'Class not found.');
      if (classes[0].teacher_id !== req.user.id) throw new ApiError(403, 'Unauthorized.');
    }

    await db.query('UPDATE classes SET is_deleted = 1 WHERE id = ?', [classId]);
    sendResponse(res, 200, {}, 'Class deleted successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * GET CLASSES BY TEACHER
 */
exports.getClassesByTeacher = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const teacherId = req.params.teacherId;

    const query = `
       SELECT c.*, u.full_name as teacher_name
       FROM classes c
       JOIN users u ON c.teacher_id = u.id
       WHERE c.teacher_id = ? AND c.is_deleted = 0
       ORDER BY c.created_at DESC
    `;

    const result = await getPaginatedRes(query, [teacherId], page, limit);
    sendResponse(res, 200, result);
  } catch (error) {
    next(error);
  }
};
