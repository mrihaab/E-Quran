const db = require('../config/db');
const { sendResponse } = require('../utils/responseHandler');
const { ApiError } = require('../middleware/errorMiddleware');

/**
 * CREATE MODULE
 */
exports.createModule = async (req, res, next) => {
  try {
    const { classId, title, orderIndex } = req.body;

    // Check ownership of class
    const [classes] = await db.query('SELECT teacher_id FROM classes WHERE id = ? AND is_deleted = 0', [classId]);
    if (classes.length === 0) throw new ApiError(404, 'Class not found.');
    if (classes[0].teacher_id !== req.user.id && req.user.role !== 'admin') {
      throw new ApiError(403, 'Unauthorized.');
    }

    const [result] = await db.query(
      'INSERT INTO modules (class_id, title, order_index) VALUES (?, ?, ?)',
      [classId, title, orderIndex || 0]
    );

    sendResponse(res, 201, { moduleId: result.insertId }, 'Module created successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * GET MODULES BY CLASS
 */
exports.getModulesByClass = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const [modules] = await db.query(
      'SELECT * FROM modules WHERE class_id = ? AND is_deleted = 0 ORDER BY order_index ASC',
      [classId]
    );
    sendResponse(res, 200, modules);
  } catch (error) {
    next(error);
  }
};

/**
 * CREATE LESSON
 */
exports.createLesson = async (req, res, next) => {
  try {
    const { moduleId, title, contentType, contentUrl, description, orderIndex } = req.body;

    // Verify module exists and user owns the class
    const [modules] = await db.query(
      `SELECT m.id, c.teacher_id FROM modules m 
       JOIN classes c ON m.class_id = c.id 
       WHERE m.id = ? AND m.is_deleted = 0`,
      [moduleId]
    );

    if (modules.length === 0) throw new ApiError(404, 'Module not found.');
    if (modules[0].teacher_id !== req.user.id && req.user.role !== 'admin') {
      throw new ApiError(403, 'Unauthorized.');
    }

    const [result] = await db.query(
      `INSERT INTO lessons (module_id, title, content_type, content_url, description, order_index) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [moduleId, title, contentType || 'text', contentUrl || null, description || null, orderIndex || 0]
    );

    sendResponse(res, 201, { lessonId: result.insertId }, 'Lesson created successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * GET LESSONS BY MODULE
 */
exports.getLessonsByModule = async (req, res, next) => {
  try {
    const { moduleId } = req.params;
    const [lessons] = await db.query(
      'SELECT * FROM lessons WHERE module_id = ? AND is_deleted = 0 ORDER BY order_index ASC',
      [moduleId]
    );
    sendResponse(res, 200, lessons);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE MODULE (Soft Delete)
 */
exports.deleteModule = async (req, res, next) => {
  try {
    const { moduleId } = req.params;
    await db.query('UPDATE modules SET is_deleted = 1 WHERE id = ?', [moduleId]);
    // Also soft delete lessons in this module
    await db.query('UPDATE lessons SET is_deleted = 1 WHERE module_id = ?', [moduleId]);
    sendResponse(res, 200, {}, 'Module deleted.');
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE LESSON (Soft Delete)
 */
exports.deleteLesson = async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    await db.query('UPDATE lessons SET is_deleted = 1 WHERE id = ?', [lessonId]);
    sendResponse(res, 200, {}, 'Lesson deleted.');
  } catch (error) {
    next(error);
  }
};
