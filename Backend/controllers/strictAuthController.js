/**
 * STRICT ROLE-BASED AUTHENTICATION CONTROLLER
 * 
 * Implements:
 * - Role-specific login endpoints
 * - Approval status checking for ALL roles
 * - Strict portal isolation
 * - Security logging
 */

const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { generateToken, generateRefreshToken } = require('../middleware/auth');
const { sendResponse } = require('../utils/responseHandler');
const { ApiError } = require('../middleware/errorMiddleware');
const logger = require('../utils/logger');
const { verifyRoleForPortal, logLoginAttempt, checkApprovalStatus } = require('../middleware/strictAuth');

/**
 * Generic login function with strict role checking
 */
async function performRoleBasedLogin(req, res, next, expectedRole) {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'unknown';

    if (!email || !password) {
      throw new ApiError(400, 'Email and password are required.', 'MISSING_CREDENTIALS');
    }

    // CRITICAL: Check role and approval status BEFORE password verification
    const roleCheck = await verifyRoleForPortal(email, expectedRole, ipAddress, userAgent);
    
    if (!roleCheck.valid) {
      // Return specific error codes for frontend handling
      return res.status(403).json({
        success: false,
        message: roleCheck.message,
        code: roleCheck.code,
        ...(roleCheck.rejectionReason && { rejectionReason: roleCheck.rejectionReason }),
        ...(roleCheck.status && { approvalStatus: roleCheck.status })
      });
    }

    // Now verify password (only if role is correct and approved)
    const [users] = await db.query(
      `SELECT u.*, 
              t.cnic_number, t.qualification, t.subject, t.years_experience,
              tvd.cnic_url, tvd.profile_photo_url, tvd.resume_url, tvd.certificate_url
       FROM users u
       LEFT JOIN teachers t ON u.id = t.user_id
       LEFT JOIN teacher_verification_documents tvd ON u.id = tvd.user_id
       WHERE u.email = ? AND u.is_deleted = 0`,
      [email]
    );

    if (users.length === 0) {
      await logLoginAttempt(email, expectedRole, 'none', ipAddress, userAgent, 'failed_invalid_cred');
      throw new ApiError(401, 'Invalid credentials.', 'INVALID_CREDENTIALS');
    }

    const user = users[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      await logLoginAttempt(email, expectedRole, user.role, ipAddress, userAgent, 'failed_invalid_cred');
      throw new ApiError(401, 'Invalid credentials.', 'INVALID_CREDENTIALS');
    }

    // Check email verification
    if (!user.is_verified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email address before logging in.',
        code: 'EMAIL_UNVERIFIED',
        verificationRequired: true,
        email: user.email
      });
    }

    // Check if Google-only account
    if (user.password_hash === 'google_oauth') {
      return res.status(401).json({
        success: false,
        message: 'This account was created via Google. Please use "Continue with Google" to login.',
        code: 'GOOGLE_ACCOUNT',
        showGoogleLogin: true
      });
    }

    // All checks passed - generate tokens
    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await db.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at, device_info) VALUES (?, ?, ?, ?)',
      [user.id, refreshToken, expiresAt, userAgent]
    );

    // Log successful login
    await logLoginAttempt(email, expectedRole, user.role, ipAddress, userAgent, 'success');
    logger.info(`Successful ${expectedRole} login: ${email}`);

    // Prepare user response (exclude sensitive data)
    const userResponse = {
      id: user.id,
      name: user.full_name,
      email: user.email,
      role: user.role,
      approvalStatus: user.approval_status,
      profileImage: user.profile_image,
      isVerified: !!user.is_verified,
      phone: user.phone,
      gender: user.gender
    };

    // Add role-specific data
    if (user.role === 'teacher') {
      userResponse.teacherData = {
        qualification: user.qualification,
        subject: user.subject,
        yearsExperience: user.years_experience,
        cnicNumber: user.cnic_number,
        documents: {
          cnicUrl: user.cnic_url,
          profilePhotoUrl: user.profile_photo_url,
          resumeUrl: user.resume_url,
          certificateUrl: user.certificate_url
        }
      };
    }

    sendResponse(res, 200, {
      user: userResponse,
      accessToken,
      refreshToken
    }, `${expectedRole.charAt(0).toUpperCase() + expectedRole.slice(1)} login successful!`);

  } catch (error) {
    next(error);
  }
}

// ============================================
// ROLE-SPECIFIC LOGIN ENDPOINTS
// ============================================

exports.loginStudent = async (req, res, next) => {
  await performRoleBasedLogin(req, res, next, 'student');
};

exports.loginTeacher = async (req, res, next) => {
  await performRoleBasedLogin(req, res, next, 'teacher');
};

exports.loginParent = async (req, res, next) => {
  await performRoleBasedLogin(req, res, next, 'parent');
};

exports.loginAdmin = async (req, res, next) => {
  await performRoleBasedLogin(req, res, next, 'admin');
};

// ============================================
// GOOGLE OAUTH WITH STRICT ROLE CHECKING
// ============================================

exports.googleCallbackStrict = async (req, res) => {
  const sendHtmlRedirect = (url) => {
    res.send(`
      <html>
        <head><meta http-equiv="refresh" content="0;url=${url}"></head>
        <body><script>window.location.href = "${url}";</script></body>
      </html>
    `);
  };

  try {
    const googleUser = req.user;
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

    // Check if this is a new Google user (role selection pending)
    if (googleUser.isNewUser) {
      // Store temp data and redirect to role selection
      return sendHtmlRedirect(`${FRONTEND_URL}/auth/google/role-select?email=${encodeURIComponent(googleUser.email)}&name=${encodeURIComponent(googleUser.name)}&googleId=${googleUser.googleId}`);
    }

    // Existing user - check role and approval
    const [users] = await db.query(
      'SELECT * FROM users WHERE id = ? AND is_deleted = 0',
      [googleUser.id]
    );

    if (users.length === 0) {
      return sendHtmlRedirect(`${FRONTEND_URL}/login?error=user_not_found`);
    }

    const dbUser = users[0];

    // Check if account is active/suspended
    if (dbUser.is_suspended) {
      return sendHtmlRedirect(`${FRONTEND_URL}/login?error=account_suspended`);
    }

    // Check approval status for ALL roles (not just admin)
    const approvalCheck = await checkApprovalStatus(dbUser.id);
    
    if (!approvalCheck.allowed) {
      // Redirect with specific error
      const errorParam = approvalCheck.status === 'pending' 
        ? `${dbUser.role}_pending_approval` 
        : approvalCheck.status === 'rejected'
          ? `${dbUser.role}_rejected`
          : 'not_approved';
      
      return sendHtmlRedirect(`${FRONTEND_URL}/login?error=${errorParam}&role=${dbUser.role}`);
    }

    // Generate tokens
    const accessToken = generateToken(dbUser);
    const refreshToken = generateRefreshToken(dbUser);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await db.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at, device_info) VALUES (?, ?, ?, ?)',
      [dbUser.id, refreshToken, expiresAt, req.headers['user-agent'] || 'google-oauth']
    );

    logger.info(`Successful Google login: ${dbUser.email} (${dbUser.role})`);

    // Redirect to frontend with tokens
    sendHtmlRedirect(`${FRONTEND_URL}/auth/google/callback?accessToken=${accessToken}&refreshToken=${refreshToken}&role=${dbUser.role}`);

  } catch (error) {
    logger.error('Google callback error:', error);
    sendHtmlRedirect(`${FRONTEND_URL}/login?error=google_callback_failed`);
  }
};

// ============================================
// REGISTRATION WITH APPROVAL FLOW
// ============================================

exports.registerWithApproval = async (req, res, next) => {
  try {
    const { fullName, email, phone, password, role, gender, address } = req.body;

    if (!fullName || !email || !password || !role) {
      throw new ApiError(400, 'Full name, email, password, and role are required.', 'MISSING_FIELDS');
    }

    // Check if user already exists
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      throw new ApiError(400, 'Email is already registered.', 'EMAIL_EXISTS');
    }

    // Determine approval status based on role
    let approvalStatus = 'pending';
    
    if (role === 'admin') {
      // Predefined admins are auto-approved
      const PREDEFINED_ADMIN_EMAILS = ['orhanuppal@gmail.com', 'mrihaab6@gmail.com', 'm.bilalirshad469@gmail.com'];
      if (PREDEFINED_ADMIN_EMAILS.includes(email.toLowerCase().trim())) {
        approvalStatus = 'approved';
        logger.info(`Auto-approved predefined admin: ${email}`);
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const [userResult] = await db.query(
      `INSERT INTO users (full_name, email, password_hash, phone, role, gender, address, 
                         profile_image, is_verified, approval_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
      [fullName, email, passwordHash, phone || null, role, gender || null, address || null,
       `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`, 
       approvalStatus]
    );

    const userId = userResult.insertId;

    // Create role-specific profile
    if (role === 'student') {
      const { studentId, dateOfBirth, course, guardianName, guardianEmail, guardianPhone } = req.body;
      await db.query(
        `INSERT INTO students (user_id, student_id, date_of_birth, course, enrollment_year, level,
                             guardian_name, guardian_email, guardian_phone)
         VALUES (?, ?, ?, ?, ?, 'Beginner', ?, ?, ?)`,
        [userId, studentId || `STU${userId}`, dateOfBirth || null, course || null, new Date().getFullYear(),
         guardianName || null, guardianEmail || null, guardianPhone || null]
      );

      // If guardian email provided, create parent invitation
      if (guardianEmail) {
        const crypto = require('crypto');
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await db.query(
          `INSERT INTO parent_invitations (student_id, parent_email, parent_phone, token, 
                                          relation_type, expires_at)
           VALUES (?, ?, ?, ?, 'father', ?)`,
          [userId, guardianEmail, guardianPhone || null, token, expiresAt]
        );

        // Send invitation email (async)
        const { sendParentInvitationEmail } = require('../services/emailService');
        sendParentInvitationEmail(guardianEmail, fullName, token).catch(err => {
          logger.error('Failed to send parent invitation:', err);
        });
      }
    } 
    else if (role === 'teacher') {
      const { qualification, subject, yearsExperience, salary, cnicNumber } = req.body;
      await db.query(
        `INSERT INTO teachers (user_id, teacher_id, qualification, subject, years_experience, 
                              salary, cnic_number, is_verified_teacher)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
        [userId, `TEA${userId}`, qualification || null, subject || null, yearsExperience || 0, 
         salary || null, cnicNumber || null]
      );

      // Create empty document record for teacher to upload later
      await db.query(
        'INSERT INTO teacher_verification_documents (user_id) VALUES (?)',
        [userId]
      );
    }
    else if (role === 'parent') {
      await db.query(
        `INSERT INTO parents (user_id, parent_id)
         VALUES (?, ?)`,
        [userId, `PAR${userId}`]
      );
    }

    logger.info(`New ${role} registered: ${email} (Status: ${approvalStatus})`);

    // If approved (only predefined admins), return success
    if (approvalStatus === 'approved') {
      sendResponse(res, 201, {
        userId,
        role,
        approvalStatus,
        requiresOTP: true
      }, 'Registration successful! Please verify your email with OTP.');
    } else {
      // Pending approval
      sendResponse(res, 201, {
        userId,
        role,
        approvalStatus,
        requiresOTP: true,
        message: 'Registration successful! Your account is pending admin approval. You will receive an email once approved.'
      }, 'Registration successful! Your application is pending review.');
    }

  } catch (error) {
    next(error);
  }
};

// ============================================
// CHECK LOGIN STATUS (for frontend redirects)
// ============================================

exports.checkStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const [users] = await db.query(
      'SELECT approval_status, role, is_suspended, rejection_reason FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      throw new ApiError(404, 'User not found');
    }

    const user = users[0];

    // If rejected, include reason
    const response = {
      approvalStatus: user.approval_status,
      role: user.role,
      isSuspended: !!user.is_suspended
    };

    if (user.approval_status === 'rejected') {
      response.rejectionReason = user.rejection_reason;
    }

    sendResponse(res, 200, response);

  } catch (error) {
    next(error);
  }
};

module.exports = exports;
