/**
 * ADMIN APPROVAL CONTROLLER
 * 
 * Manages:
 * - Teacher approval/rejection/suspension
 * - Viewing verification documents
 * - Approval history
 * - Admin notes
 */

const db = require('../config/db');
const { sendResponse } = require('../utils/responseHandler');
const { ApiError } = require('../middleware/errorMiddleware');
const logger = require('../utils/logger');

// ============================================
// GET PENDING TEACHERS FOR REVIEW
// ============================================

exports.getPendingTeachers = async (req, res, next) => {
  try {
    const [teachers] = await db.query(
      `SELECT 
        u.id,
        u.full_name,
        u.email,
        u.phone,
        u.gender,
        u.created_at as applied_at,
        u.admin_notes,
        t.teacher_id,
        t.qualification,
        t.subject,
        t.years_experience,
        t.cnic_number,
        tvd.cnic_url,
        tvd.profile_photo_url,
        tvd.resume_url,
        tvd.certificate_url,
        tvd.additional_docs,
        tvd.uploaded_at as documents_uploaded_at
      FROM users u
      JOIN teachers t ON u.id = t.user_id
      LEFT JOIN teacher_verification_documents tvd ON u.id = tvd.user_id
      WHERE u.role = 'teacher'
        AND u.approval_status = 'pending'
        AND u.is_deleted = 0
      ORDER BY u.created_at ASC`
    );

    sendResponse(res, 200, { teachers, count: teachers.length });
  } catch (error) {
    next(error);
  }
};

// ============================================
// GET ALL TEACHERS (WITH FILTER)
// ============================================

exports.getAllTeachers = async (req, res, next) => {
  try {
    const { status } = req.query;
    
    let query = `
      SELECT 
        u.id,
        u.full_name,
        u.email,
        u.phone,
        u.approval_status,
        u.created_at,
        u.reviewed_at,
        u.admin_notes,
        t.teacher_id,
        t.qualification,
        t.subject,
        t.years_experience,
        t.is_verified_teacher,
        t.rating,
        tvd.profile_photo_url,
        admin.full_name as reviewed_by_name
      FROM users u
      JOIN teachers t ON u.id = t.user_id
      LEFT JOIN teacher_verification_documents tvd ON u.id = tvd.user_id
      LEFT JOIN users admin ON u.reviewed_by = admin.id
      WHERE u.role = 'teacher' AND u.is_deleted = 0
    `;
    
    const params = [];
    
    if (status && ['pending', 'approved', 'rejected', 'suspended'].includes(status)) {
      query += ' AND u.approval_status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY u.created_at DESC';
    
    const [teachers] = await db.query(query, params);

    sendResponse(res, 200, { teachers, count: teachers.length });
  } catch (error) {
    next(error);
  }
};

// ============================================
// GET SINGLE TEACHER DETAILS
// ============================================

exports.getTeacherDetails = async (req, res, next) => {
  try {
    const { teacherId } = req.params;
    
    const [teachers] = await db.query(
      `SELECT 
        u.id,
        u.full_name,
        u.email,
        u.phone,
        u.gender,
        u.address,
        u.approval_status,
        u.rejection_reason,
        u.admin_notes,
        u.created_at,
        u.reviewed_at,
        t.teacher_id,
        t.qualification,
        t.subject,
        t.years_experience,
        t.cnic_number,
        t.salary,
        t.is_verified_teacher,
        t.verified_at,
        tvd.cnic_url,
        tvd.profile_photo_url,
        tvd.resume_url,
        tvd.certificate_url,
        tvd.additional_docs,
        tvd.uploaded_at,
        reviewer.full_name as reviewed_by_name
      FROM users u
      JOIN teachers t ON u.id = t.user_id
      LEFT JOIN teacher_verification_documents tvd ON u.id = tvd.user_id
      LEFT JOIN users reviewer ON u.reviewed_by = reviewer.id
      WHERE u.id = ? AND u.role = 'teacher' AND u.is_deleted = 0`,
      [teacherId]
    );

    if (teachers.length === 0) {
      throw new ApiError(404, 'Teacher not found');
    }

    // Get approval history
    const [history] = await db.query(
      `SELECT 
        tah.id,
        tah.action,
        tah.reason,
        tah.admin_notes,
        tah.created_at,
        admin.full_name as admin_name
      FROM teacher_approval_history tah
      JOIN users admin ON tah.admin_id = admin.id
      WHERE tah.teacher_id = ?
      ORDER BY tah.created_at DESC`,
      [teacherId]
    );

    sendResponse(res, 200, {
      teacher: teachers[0],
      approvalHistory: history
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// APPROVE TEACHER
// ============================================

exports.approveTeacher = async (req, res, next) => {
  try {
    const { teacherId } = req.params;
    const adminId = req.user.id;
    const { adminNotes } = req.body;

    // Check if teacher exists and is pending
    const [teachers] = await db.query(
      'SELECT id, full_name, email, approval_status FROM users WHERE id = ? AND role = "teacher" AND is_deleted = 0',
      [teacherId]
    );

    if (teachers.length === 0) {
      throw new ApiError(404, 'Teacher not found');
    }

    const teacher = teachers[0];

    if (teacher.approval_status === 'approved') {
      throw new ApiError(400, 'Teacher is already approved');
    }

    // Execute approval using stored procedure
    await db.query(
      'CALL ProcessTeacherApproval(?, ?, ?, ?, ?)',
      [teacherId, adminId, 'approved', null, adminNotes || null]
    );

    // Send approval email
    const { sendApprovalEmail } = require('../services/emailService');
    await sendApprovalEmail(teacher.email, teacher.full_name, 'approved');

    logger.info(`Teacher ${teacherId} (${teacher.email}) approved by admin ${adminId}`);

    sendResponse(res, 200, {}, 'Teacher approved successfully');
  } catch (error) {
    next(error);
  }
};

// ============================================
// REJECT TEACHER
// ============================================

exports.rejectTeacher = async (req, res, next) => {
  try {
    const { teacherId } = req.params;
    const adminId = req.user.id;
    const { reason, adminNotes } = req.body;

    if (!reason) {
      throw new ApiError(400, 'Rejection reason is required');
    }

    // Check if teacher exists
    const [teachers] = await db.query(
      'SELECT id, full_name, email, approval_status FROM users WHERE id = ? AND role = "teacher" AND is_deleted = 0',
      [teacherId]
    );

    if (teachers.length === 0) {
      throw new ApiError(404, 'Teacher not found');
    }

    const teacher = teachers[0];

    if (teacher.approval_status === 'rejected') {
      throw new ApiError(400, 'Teacher is already rejected');
    }

    // Execute rejection using stored procedure
    await db.query(
      'CALL ProcessTeacherApproval(?, ?, ?, ?, ?)',
      [teacherId, adminId, 'rejected', reason, adminNotes || null]
    );

    // Send rejection email
    const { sendRejectionEmail } = require('../services/emailService');
    await sendRejectionEmail(teacher.email, teacher.full_name, reason);

    logger.info(`Teacher ${teacherId} (${teacher.email}) rejected by admin ${adminId}. Reason: ${reason}`);

    sendResponse(res, 200, {}, 'Teacher application rejected');
  } catch (error) {
    next(error);
  }
};

// ============================================
// SUSPEND TEACHER
// ============================================

exports.suspendTeacher = async (req, res, next) => {
  try {
    const { teacherId } = req.params;
    const adminId = req.user.id;
    const { reason, adminNotes } = req.body;

    if (!reason) {
      throw new ApiError(400, 'Suspension reason is required');
    }

    // Check if teacher exists and is approved
    const [teachers] = await db.query(
      'SELECT id, full_name, email, approval_status FROM users WHERE id = ? AND role = "teacher" AND is_deleted = 0',
      [teacherId]
    );

    if (teachers.length === 0) {
      throw new ApiError(404, 'Teacher not found');
    }

    const teacher = teachers[0];

    // Only approved teachers can be suspended
    if (teacher.approval_status !== 'approved') {
      throw new ApiError(400, 'Cannot suspend a non-approved teacher');
    }

    // Execute suspension using stored procedure
    await db.query(
      'CALL ProcessTeacherApproval(?, ?, ?, ?, ?)',
      [teacherId, adminId, 'suspended', reason, adminNotes || null]
    );

    // Also mark as suspended in users table
    await db.query(
      'UPDATE users SET is_suspended = 1 WHERE id = ?',
      [teacherId]
    );

    // Send suspension email
    const { sendSuspensionEmail } = require('../services/emailService');
    await sendSuspensionEmail(teacher.email, teacher.full_name, reason);

    logger.warn(`Teacher ${teacherId} (${teacher.email}) SUSPENDED by admin ${adminId}. Reason: ${reason}`);

    sendResponse(res, 200, {}, 'Teacher suspended successfully');
  } catch (error) {
    next(error);
  }
};

// ============================================
// REACTIVATE TEACHER
// ============================================

exports.reactivateTeacher = async (req, res, next) => {
  try {
    const { teacherId } = req.params;
    const adminId = req.user.id;
    const { adminNotes } = req.body;

    // Check if teacher exists and is suspended
    const [teachers] = await db.query(
      'SELECT id, full_name, email, approval_status, is_suspended FROM users WHERE id = ? AND role = "teacher" AND is_deleted = 0',
      [teacherId]
    );

    if (teachers.length === 0) {
      throw new ApiError(404, 'Teacher not found');
    }

    const teacher = teachers[0];

    if (teacher.approval_status !== 'suspended' && !teacher.is_suspended) {
      throw new ApiError(400, 'Teacher is not suspended');
    }

    // Execute reactivation using stored procedure
    await db.query(
      'CALL ProcessTeacherApproval(?, ?, ?, ?, ?)',
      [teacherId, adminId, 'reactivated', null, adminNotes || null]
    );

    // Remove suspension flag
    await db.query(
      "UPDATE users SET is_suspended = 0, approval_status = 'approved' WHERE id = ?",
      [teacherId]
    );

    // Send reactivation email
    const { sendReactivationEmail } = require('../services/emailService');
    await sendReactivationEmail(teacher.email, teacher.full_name);

    logger.info(`Teacher ${teacherId} (${teacher.email}) REACTIVATED by admin ${adminId}`);

    sendResponse(res, 200, {}, 'Teacher reactivated successfully');
  } catch (error) {
    next(error);
  }
};

// ============================================
// UPDATE ADMIN NOTES
// ============================================

exports.updateAdminNotes = async (req, res, next) => {
  try {
    const { teacherId } = req.params;
    const { notes } = req.body;

    await db.query(
      'UPDATE users SET admin_notes = ? WHERE id = ? AND role = "teacher"',
      [notes, teacherId]
    );

    sendResponse(res, 200, {}, 'Admin notes updated');
  } catch (error) {
    next(error);
  }
};

// ============================================
// GET APPROVAL STATISTICS
// ============================================

exports.getApprovalStats = async (req, res, next) => {
  try {
    const [stats] = await db.query(
      `SELECT 
        COUNT(*) as total_teachers,
        SUM(CASE WHEN approval_status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN approval_status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN approval_status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN approval_status = 'suspended' THEN 1 ELSE 0 END) as suspended,
        SUM(CASE WHEN is_verified_teacher = 1 THEN 1 ELSE 0 END) as verified
      FROM users u
      LEFT JOIN teachers t ON u.id = t.user_id
      WHERE u.role = 'teacher' AND u.is_deleted = 0`
    );

    // Get recent approvals (last 30 days)
    const [recent] = await db.query(
      `SELECT 
        u.full_name,
        u.email,
        u.approval_status,
        u.reviewed_at,
        reviewer.full_name as reviewed_by
      FROM users u
      LEFT JOIN users reviewer ON u.reviewed_by = reviewer.id
      WHERE u.role = 'teacher' 
        AND u.reviewed_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
      ORDER BY u.reviewed_at DESC
      LIMIT 10`
    );

    sendResponse(res, 200, {
      statistics: stats[0],
      recentActivity: recent
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// VIEW TEACHER DOCUMENT (PROTECTED)
// ============================================

exports.getTeacherDocument = async (req, res, next) => {
  try {
    const { teacherId, documentType } = req.params;
    
    // Validate document type
    const validTypes = ['cnic', 'profile_photo', 'resume', 'certificate'];
    if (!validTypes.includes(documentType)) {
      throw new ApiError(400, 'Invalid document type');
    }

    const columnName = documentType === 'cnic' ? 'cnic_url' : 
                       documentType === 'profile_photo' ? 'profile_photo_url' :
                       documentType === 'resume' ? 'resume_url' : 'certificate_url';

    const [documents] = await db.query(
      `SELECT ${columnName} as document_url FROM teacher_verification_documents WHERE user_id = ?`,
      [teacherId]
    );

    if (documents.length === 0 || !documents[0].document_url) {
      throw new ApiError(404, 'Document not found');
    }

    // Return the document URL (frontend will handle secure viewing)
    sendResponse(res, 200, { 
      documentUrl: documents[0].document_url,
      documentType
    });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;
