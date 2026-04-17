/**
 * PARENT INVITATION ROUTES
 * 
 * Parent invitation and activation system
 */

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { sendResponse } = require('../utils/responseHandler');
const { ApiError } = require('../middleware/errorMiddleware');
const { verifyTokenAndApproval, requireRole } = require('../middleware/strictAuth');
const logger = require('../utils/logger');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// ============================================
// CREATE PARENT INVITATION (Admin/Student)
// ============================================

router.post(
  '/create',
  verifyTokenAndApproval,
  requireRole('admin', 'student'),
  async (req, res, next) => {
    try {
      const { studentId, parentEmail, parentPhone, relationType } = req.body;
      const requestingUser = req.user;

      // Students can only create invitations for themselves
      if (requestingUser.role === 'student' && requestingUser.id !== parseInt(studentId)) {
        throw new ApiError(403, 'You can only invite parents for your own account');
      }

      // Check if student exists and is approved
      const [students] = await db.query(
        'SELECT id, full_name, approval_status FROM users WHERE id = ? AND role = "student" AND is_deleted = 0',
        [studentId]
      );

      if (students.length === 0) {
        throw new ApiError(404, 'Student not found');
      }

      const student = students[0];

      // Check if parent already exists
      const [existingParents] = await db.query(
        'SELECT id FROM users WHERE email = ? AND role = "parent"',
        [parentEmail]
      );

      if (existingParents.length > 0) {
        // Parent exists - create link directly
        const parentId = existingParents[0].id;
        
        await db.query(
          `INSERT INTO parent_student_links (parent_id, student_id, relation_type, linked_by) 
           VALUES (?, ?, ?, 'system')
           ON DUPLICATE KEY UPDATE is_active = 1, relation_type = ?`,
          [parentId, studentId, relationType || 'father', relationType || 'father']
        );

        // Send notification email
        const { sendParentLinkNotificationEmail } = require('../services/emailService');
        await sendParentLinkNotificationEmail(parentEmail, student.full_name);

        return sendResponse(res, 200, {}, 
          'Parent account exists. Student has been linked to your account.');
      }

      // Check for existing pending invitation
      const [existingInvites] = await db.query(
        `SELECT id FROM parent_invitations 
         WHERE student_id = ? AND parent_email = ? AND status = 'pending' 
         AND expires_at > NOW()`,
        [studentId, parentEmail]
      );

      if (existingInvites.length > 0) {
        throw new ApiError(400, 'An active invitation already exists for this email');
      }

      // Generate secure token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      // Create invitation
      await db.query(
        `INSERT INTO parent_invitations 
         (student_id, parent_email, parent_phone, token, relation_type, expires_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [studentId, parentEmail, parentPhone || null, token, relationType || 'father', expiresAt]
      );

      // Send invitation email
      const { sendParentInvitationEmail } = require('../services/emailService');
      await sendParentInvitationEmail(parentEmail, student.full_name, token);

      logger.info(`Parent invitation created for student ${studentId} to ${parentEmail}`);

      sendResponse(res, 201, { 
        token,
        expiresAt,
        invitationLink: `${process.env.FRONTEND_URL}/parent/activate/${token}`
      }, 'Parent invitation sent successfully');

    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// VERIFY INVITATION TOKEN
// ============================================

router.get('/verify/:token', async (req, res, next) => {
  try {
    const { token } = req.params;

    const [invitations] = await db.query(
      `SELECT pi.*, u.full_name as student_name, u.email as student_email
       FROM parent_invitations pi
       JOIN users u ON pi.student_id = u.id
       WHERE pi.token = ? AND pi.status = 'pending' AND pi.expires_at > NOW()`,
      [token]
    );

    if (invitations.length === 0) {
      throw new ApiError(400, 'Invalid or expired invitation token');
    }

    const invitation = invitations[0];

    sendResponse(res, 200, {
      valid: true,
      studentName: invitation.student_name,
      parentEmail: invitation.parent_email,
      relationType: invitation.relation_type,
      expiresAt: invitation.expires_at
    });

  } catch (error) {
    next(error);
  }
});

// ============================================
// ACTIVATE PARENT ACCOUNT
// ============================================

router.post('/activate/:token', async (req, res, next) => {
  try {
    const { token } = req.params;
    const { fullName, password, phone, gender } = req.body;

    if (!fullName || !password) {
      throw new ApiError(400, 'Full name and password are required');
    }

    // Validate invitation
    const [invitations] = await db.query(
      `SELECT pi.*, u.id as student_id, u.full_name as student_name
       FROM parent_invitations pi
       JOIN users u ON pi.student_id = u.id
       WHERE pi.token = ? AND pi.status = 'pending' AND pi.expires_at > NOW()`,
      [token]
    );

    if (invitations.length === 0) {
      throw new ApiError(400, 'Invalid or expired invitation token');
    }

    const invitation = invitations[0];

    // Check if parent email already has an account
    const [existingUsers] = await db.query(
      'SELECT id, role FROM users WHERE email = ?',
      [invitation.parent_email]
    );

    if (existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      
      // If already a parent, just link
      if (existingUser.role === 'parent') {
        await db.query(
          `INSERT INTO parent_student_links (parent_id, student_id, relation_type, linked_by)
           VALUES (?, ?, ?, 'invitation')
           ON DUPLICATE KEY UPDATE is_active = 1`,
          [existingUser.id, invitation.student_id, invitation.relation_type]
        );
      } else {
        throw new ApiError(400, 'This email is already registered with a different role');
      }
    } else {
      // Create new parent account
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const [userResult] = await db.query(
        `INSERT INTO users (full_name, email, password_hash, phone, role, gender, 
                          profile_image, is_verified, approval_status)
         VALUES (?, ?, ?, ?, 'parent', ?, ?, 1, 'approved')`,
        [fullName, invitation.parent_email, passwordHash, phone || null, gender || null,
         `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`]
      );

      const parentId = userResult.insertId;

      // Create parent record
      await db.query(
        'INSERT INTO parents (user_id, parent_id) VALUES (?, ?)',
        [parentId, `PAR${parentId}`]
      );

      // Link parent to student
      await db.query(
        `INSERT INTO parent_student_links (parent_id, student_id, relation_type, linked_by)
         VALUES (?, ?, ?, 'invitation')`,
        [parentId, invitation.student_id, invitation.relation_type]
      );

      // Update student's guardian info
      await db.query(
        `UPDATE students SET guardian_name = ?, guardian_email = ?, 
                            guardian_phone = ?, guardian_relation = ?
         WHERE user_id = ?`,
        [fullName, invitation.parent_email, phone || null, invitation.relation_type, invitation.student_id]
      );
    }

    // Mark invitation as used
    await db.query(
      `UPDATE parent_invitations 
       SET status = 'accepted', is_used = 1, used_at = NOW()
       WHERE id = ?`,
      [invitation.id]
    );

    logger.info(`Parent account activated for ${invitation.parent_email}`);

    sendResponse(res, 200, {}, 
      'Parent account activated successfully. You can now login.');

  } catch (error) {
    next(error);
  }
});

// ============================================
// GET STUDENT'S LINKED PARENTS
// ============================================

router.get(
  '/student-parents/:studentId',
  verifyTokenAndApproval,
  async (req, res, next) => {
    try {
      const { studentId } = req.params;
      const requestingUser = req.user;

      // Authorization check
      if (requestingUser.role === 'student' && requestingUser.id !== parseInt(studentId)) {
        throw new ApiError(403, 'Access denied');
      }
      if (requestingUser.role === 'parent') {
        // Check if parent is linked to this student
        const [links] = await db.query(
          'SELECT id FROM parent_student_links WHERE parent_id = ? AND student_id = ? AND is_active = 1',
          [requestingUser.id, studentId]
        );
        if (links.length === 0) {
          throw new ApiError(403, 'Access denied');
        }
      }

      const [parents] = await db.query(
        `SELECT 
          psl.id as link_id,
          psl.relation_type,
          psl.linked_at,
          u.id as parent_id,
          u.full_name,
          u.email,
          u.phone,
          u.profile_image
        FROM parent_student_links psl
        JOIN users u ON psl.parent_id = u.id
        WHERE psl.student_id = ? AND psl.is_active = 1`,
        [studentId]
      );

      sendResponse(res, 200, { parents, count: parents.length });

    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// ADMIN: GET ALL PENDING INVITATIONS
// ============================================

router.get(
  '/admin/pending',
  verifyTokenAndApproval,
  requireRole('admin'),
  async (req, res, next) => {
    try {
      const [invitations] = await db.query(
        `SELECT 
          pi.*,
          u.full_name as student_name,
          u.email as student_email
        FROM parent_invitations pi
        JOIN users u ON pi.student_id = u.id
        WHERE pi.status = 'pending' AND pi.expires_at > NOW()
        ORDER BY pi.created_at DESC`
      );

      sendResponse(res, 200, { invitations, count: invitations.length });

    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
