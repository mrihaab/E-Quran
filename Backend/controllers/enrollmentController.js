const db = require('../config/db');
const { createNotification } = require('../services/notificationService');
const { getPaginatedRes } = require('../utils/paginate');
const { sendResponse } = require('../utils/responseHandler');
const { ApiError } = require('../middleware/errorMiddleware');

/**
 * ENROLL STUDENT IN CLASS
 */
exports.enroll = async (req, res, next) => {
  try {
    const { classId } = req.body;
    const studentId = req.user.id;

    if (!classId) throw new ApiError(400, 'classId is required.');

    const [classes] = await db.query('SELECT * FROM classes WHERE id = ? AND is_deleted = 0', [classId]);
    if (classes.length === 0) throw new ApiError(404, 'Class not found.');

    const cls = classes[0];
    if (cls.enrolled_count >= cls.capacity) throw new ApiError(400, 'Class is full.');

    const [existing] = await db.query(
      'SELECT id FROM enrollments WHERE student_id = ? AND class_id = ? AND is_deleted = 0',
      [studentId, classId]
    );
    if (existing.length > 0) throw new ApiError(400, 'Already enrolled.');

    await db.query(
      'INSERT INTO enrollments (student_id, class_id, status) VALUES (?, ?, ?)',
      [studentId, classId, 'active']
    );

    await db.query('UPDATE classes SET enrolled_count = enrolled_count + 1 WHERE id = ?', [classId]);

    // Send Notifications (Real-time enabled)
    await createNotification(
      req.app,
      studentId, 
      'Enrollment Successful', 
      `You have successfully enrolled in: ${cls.name}`, 
      'success'
    );
    
    await createNotification(
      req.app,
      cls.teacher_id,
      'New Enrollment',
      `A student has joined your class: ${cls.name}`,
      'info'
    );

    sendResponse(res, 201, {}, 'Enrolled successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * GET STUDENT ENROLLMENTS
 */
exports.getStudentEnrollments = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const studentId = req.params.studentId || req.user.id;

    const query = `
      SELECT e.*, c.name, c.subject, c.level, c.schedule, c.platform, c.status as classStatus, u.full_name as teacher_name
      FROM enrollments e
      JOIN classes c ON e.class_id = c.id
      JOIN users u ON c.teacher_id = u.id
      WHERE e.student_id = ? AND e.is_deleted = 0
      ORDER BY e.enrolled_at DESC
    `;

    const result = await getPaginatedRes(query, [studentId], page, limit);
    sendResponse(res, 200, result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET CLASS ENROLLEES
 */
exports.getClassEnrollees = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const classId = req.params.classId;

    const query = `
      SELECT e.*, u.full_name, u.email, u.profile_image
      FROM enrollments e
      JOIN users u ON e.student_id = u.id
      WHERE e.class_id = ? AND e.is_deleted = 0
      ORDER BY e.enrolled_at DESC
    `;

    const result = await getPaginatedRes(query, [classId], page, limit);
    sendResponse(res, 200, result);
  } catch (error) {
    next(error);
  }
};

/**
 * UNENROLL (Soft Delete)
 */
exports.unenroll = async (req, res, next) => {
  try {
    const { enrollmentId } = req.params;
    const [enrollments] = await db.query('SELECT * FROM enrollments WHERE id = ? AND is_deleted = 0', [enrollmentId]);
    
    if (enrollments.length === 0) throw new ApiError(404, 'Enrollment not found.');
    
    const e = enrollments[0];
    if (req.user.id !== e.student_id && req.user.role !== 'admin') {
      throw new ApiError(403, 'Permission denied.');
    }

    await db.query('UPDATE enrollments SET is_deleted = 1 WHERE id = ?', [enrollmentId]);
    await db.query('UPDATE classes SET enrolled_count = GREATEST(enrolled_count - 1, 0) WHERE id = ?', [e.class_id]);

    sendResponse(res, 200, {}, 'Unenrolled successfully.');
  } catch (error) {
    next(error);
  }
};
