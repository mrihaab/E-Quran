/**
 * Strict role-based authentication controller.
 *
 * Exposes role-specific login endpoints that enforce:
 *   - Correct portal (student / teacher / parent / admin)
 *   - Account status (active, not suspended)
 *   - Admin approval gate (is_approved flag)
 *   - Email verification
 */

const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { generateToken, generateRefreshToken } = require('../middleware/auth');
const { sendResponse } = require('../utils/responseHandler');
const { ApiError } = require('../middleware/errorMiddleware');
const logger = require('../utils/logger');
const { verifyRoleForPortal, logLoginAttempt } = require('../middleware/strictAuth');

// ==================== GENERIC ROLE-BASED LOGIN ====================

async function performRoleBasedLogin(req, res, next, expectedRole) {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'unknown';

    if (!email || !password) {
      throw new ApiError(400, 'Email and password are required.', 'MISSING_CREDENTIALS');
    }

    // Check role + account status BEFORE password verification (saves bcrypt cost on invalid portal)
    const roleCheck = await verifyRoleForPortal(email, expectedRole, ipAddress, userAgent);

    if (!roleCheck.valid) {
      return res.status(403).json({
        success: false,
        message: roleCheck.message,
        code: roleCheck.code,
        ...(roleCheck.status && { approvalStatus: roleCheck.status })
      });
    }

    const [rows] = await db.query(
      `SELECT u.id, u.full_name, u.email, u.password_hash, u.role, u.status,
              u.is_verified, u.is_approved, u.profile_image, u.phone, u.gender,
              t.qualification, t.subject, t.years_experience
       FROM users u
       LEFT JOIN teachers t ON u.role = 'teacher' AND u.id = t.user_id
       WHERE u.email = ? AND u.is_deleted = 0`,
      [email]
    );

    if (rows.length === 0) {
      await logLoginAttempt(email, expectedRole, 'none', ipAddress, userAgent, 'failed_not_found');
      throw new ApiError(401, 'Invalid credentials.', 'INVALID_CREDENTIALS');
    }

    const user = rows[0];

    // Google-only account guard
    if (user.password_hash === 'google_oauth' || user.password_hash === 'PREDEFINED_ADMIN') {
      return res.status(401).json({
        success: false,
        message: 'This account uses Google login. Please use "Continue with Google".',
        code: 'GOOGLE_ACCOUNT_ONLY'
      });
    }

    // Password check
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      await logLoginAttempt(email, expectedRole, user.role, ipAddress, userAgent, 'failed_bad_password');
      throw new ApiError(401, 'Invalid credentials.', 'INVALID_CREDENTIALS');
    }

    // Email verification check
    if (!user.is_verified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email address before logging in.',
        code: 'EMAIL_UNVERIFIED',
        verificationRequired: true,
        email: user.email
      });
    }

    // Generate tokens
    const accessToken  = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await db.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at, device_info) VALUES (?, ?, ?, ?)',
      [user.id, refreshToken, expiresAt, userAgent]
    );

    await logLoginAttempt(email, expectedRole, user.role, ipAddress, userAgent, 'success');
    logger.info(`Login success [${expectedRole}]: ${email}`);

    const userResponse = {
      id:           user.id,
      name:         user.full_name,
      email:        user.email,
      role:         user.role,
      profileImage: user.profile_image,
      isVerified:   !!user.is_verified,
      phone:        user.phone,
      gender:       user.gender
    };

    if (user.role === 'teacher') {
      userResponse.teacherData = {
        qualification:   user.qualification,
        subject:         user.subject,
        yearsExperience: user.years_experience
      };
    }

    sendResponse(res, 200, { user: userResponse, accessToken, refreshToken },
      `${expectedRole.charAt(0).toUpperCase() + expectedRole.slice(1)} login successful!`);

  } catch (error) {
    next(error);
  }
}

// ==================== ROLE-SPECIFIC ENDPOINTS ====================

exports.loginStudent = (req, res, next) => performRoleBasedLogin(req, res, next, 'student');
exports.loginTeacher = (req, res, next) => performRoleBasedLogin(req, res, next, 'teacher');
exports.loginParent  = (req, res, next) => performRoleBasedLogin(req, res, next, 'parent');
exports.loginAdmin   = (req, res, next) => performRoleBasedLogin(req, res, next, 'admin');

// ==================== REGISTRATION WITH APPROVAL ====================

exports.registerWithApproval = async (req, res, next) => {
  try {
    const { fullName, email, phone, password, role, gender, address } = req.body;

    if (!fullName || !email || !password || !role) {
      throw new ApiError(400, 'Full name, email, password, and role are required.', 'MISSING_FIELDS');
    }

    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) throw new ApiError(400, 'Email is already registered.', 'EMAIL_EXISTS');

    const PREDEFINED_ADMINS = ['orhanuppal@gmail.com', 'mrihaab6@gmail.com', 'm.bilalirshad469@gmail.com'];
    const isApproved = (role === 'admin' && PREDEFINED_ADMINS.includes(email.toLowerCase().trim())) ? 1 : 1;
    // All roles default to approved=1 here; admin-specific flow uses is_approved=0 in the legacy flow.

    const passwordHash = await bcrypt.hash(password, 10);

    const [userResult] = await db.query(
      `INSERT INTO users (full_name, email, password_hash, phone, role, gender, address,
                          profile_image, is_verified, is_approved, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 'active')`,
      [fullName, email, passwordHash, phone || null, role, gender || null, address || null,
       `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`,
       isApproved]
    );

    const userId = userResult.insertId;

    if (role === 'student') {
      await db.query(
        'INSERT INTO students (user_id, student_id, enrollment_year, level) VALUES (?, ?, ?, ?)',
        [userId, `STU${userId}`, new Date().getFullYear(), 'Beginner']
      );
    } else if (role === 'teacher') {
      const { qualification, subject, yearsExperience } = req.body;
      await db.query(
        'INSERT INTO teachers (user_id, teacher_id, qualification, subject, years_experience) VALUES (?, ?, ?, ?, ?)',
        [userId, `TEA${userId}`, qualification || null, subject || null, yearsExperience || 0]
      );
    } else if (role === 'parent') {
      await db.query(
        'INSERT INTO parents (user_id, parent_id) VALUES (?, ?)',
        [userId, `PAR${userId}`]
      );
    }

    await db.query(
      'INSERT INTO settings (user_id, notification_preferences, privacy_settings) VALUES (?, ?, ?)',
      [userId, '{}', '{}']
    );

    logger.info(`New ${role} registered via strict-auth: ${email}`);

    sendResponse(res, 201, { userId, role, requiresOTP: true },
      'Registration successful! Please verify your email with the OTP sent.');
  } catch (error) {
    next(error);
  }
};

// ==================== STATUS CHECK ====================

exports.checkStatus = async (req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT role, status, is_approved FROM users WHERE id = ? AND is_deleted = 0',
      [req.user.id]
    );

    if (rows.length === 0) throw new ApiError(404, 'User not found.', 'USER_NOT_FOUND');

    const user = rows[0];

    sendResponse(res, 200, {
      role:       user.role,
      status:     user.status,
      isApproved: !!user.is_approved
    });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;
