const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const validator = require('validator');
const db = require('../config/db');
const { generateToken, generateRefreshToken } = require('../middleware/auth');
const { sendOTPEmail } = require('../services/emailService');
const { createOTP, verifyOTP: verifyOTPService } = require('../services/otpService');
const { sendResponse } = require('../utils/responseHandler');
const { ApiError } = require('../middleware/errorMiddleware');
const logger = require('../utils/logger');

const SALT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 8;

const PREDEFINED_ADMIN_EMAILS = [
  'orhanuppal@gmail.com',
  'mrihaab6@gmail.com',
  'm.bilalirshad469@gmail.com',
];

const isPredefinedAdmin = (email) => {
  return PREDEFINED_ADMIN_EMAILS.includes(email.toLowerCase().trim());
};

function validateEmail(email) {
  if (!email || !validator.isEmail(email)) {
    throw new ApiError(400, 'Please provide a valid email address.', 'INVALID_EMAIL');
  }
  return validator.normalizeEmail(email);
}

function validatePassword(password) {
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    throw new ApiError(400, `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`, 'WEAK_PASSWORD');
  }
}

function sanitizeUserResponse(user) {
  return {
    id: user.id,
    name: user.full_name,
    email: user.email,
    role: user.role,
    profileImage: user.profile_image,
    isVerified: !!user.is_verified,
  };
}

async function storeRefreshToken(userId, refreshToken, userAgent) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await db.query(
    'INSERT INTO refresh_tokens (user_id, token, expires_at, device_info) VALUES (?, ?, ?, ?)',
    [userId, refreshToken, expiresAt, userAgent || 'unknown']
  );
}

const createPasswordResetOTP = async (email) => {
  await db.query('DELETE FROM password_reset_tokens WHERE email = ? AND is_used = 0', [email]);

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 15);

  await db.query(
    'INSERT INTO password_reset_tokens (email, otp, expires_at) VALUES (?, ?, ?)',
    [email, otp, expiresAt]
  );

  return otp;
};

const verifyPasswordResetOTP = async (email, otp) => {
  const [records] = await db.query(
    `SELECT * FROM password_reset_tokens
     WHERE email = ? AND otp = ? AND is_used = 0 AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1`,
    [email, otp]
  );

  if (records.length === 0) {
    return { valid: false, message: 'Invalid or expired OTP.' };
  }

  const record = records[0];

  if (record.attempts >= 5) {
    await db.query('UPDATE password_reset_tokens SET is_used = 1 WHERE id = ?', [record.id]);
    return { valid: false, message: 'Too many failed attempts. Please request a new OTP.' };
  }

  if (record.otp !== otp) {
    await db.query('UPDATE password_reset_tokens SET attempts = attempts + 1 WHERE id = ?', [record.id]);
    return { valid: false, message: 'Invalid OTP.' };
  }

  await db.query('UPDATE password_reset_tokens SET is_used = 1 WHERE id = ?', [record.id]);
  return { valid: true, message: 'OTP verified successfully.' };
};

// ============================================
// REGISTER USER
// ============================================
exports.register = async (req, res, next) => {
  try {
    const { fullName, email, phone, password, role, gender, address } = req.body;

    if (!fullName || !fullName.trim()) {
      throw new ApiError(400, 'Full name is required.', 'MISSING_FIELDS');
    }
    if (!role || !['student', 'teacher', 'parent', 'admin'].includes(role)) {
      throw new ApiError(400, 'Valid role is required (student, teacher, parent, admin).', 'INVALID_ROLE');
    }

    const normalizedEmail = validateEmail(email);
    validatePassword(password);

    if (isPredefinedAdmin(normalizedEmail) && role !== 'admin') {
      throw new ApiError(403, 'This email is reserved. Please use a different email.', 'RESERVED_EMAIL');
    }

    const [existing] = await db.query('SELECT id, is_verified FROM users WHERE email = ?', [normalizedEmail]);
    if (existing.length > 0) {
      throw new ApiError(409, 'Email is already registered. Please login instead.', 'EMAIL_EXISTS');
    }

    let isApproved = 1;
    let approvalStatus = 'approved';
    if (role === 'admin') {
      if (isPredefinedAdmin(normalizedEmail)) {
        isApproved = 1;
        approvalStatus = 'approved';
      } else {
        isApproved = 0;
        approvalStatus = 'pending';
      }
    } else if (role === 'teacher') {
      approvalStatus = 'pending';
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const profileImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName.trim())}&background=random&color=fff`;

    const [userResult] = await db.query(
      `INSERT INTO users (full_name, email, password_hash, phone, role, approval_status, gender, address, profile_image, is_verified, is_approved)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
      [fullName.trim(), normalizedEmail, passwordHash, phone || null, role, approvalStatus, gender || null, address || null, profileImage, isApproved]
    );

    const userId = userResult.insertId;

    if (role === 'student') {
      const { studentId, dateOfBirth, course, enrollmentYear } = req.body;
      await db.query(
        `INSERT INTO students (user_id, student_id, date_of_birth, course, enrollment_year, level)
         VALUES (?, ?, ?, ?, ?, 'Beginner')`,
        [userId, studentId || `STU${userId}`, dateOfBirth || null, course || null, enrollmentYear || new Date().getFullYear()]
      );
    } else if (role === 'teacher') {
      const { teacherId, qualification, subject, yearsOfExperience, salary } = req.body;
      await db.query(
        `INSERT INTO teachers (user_id, teacher_id, qualification, subject, years_experience, salary)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, teacherId || `TEA${userId}`, qualification || null, subject || null, yearsOfExperience || 0, salary || null]
      );
    } else if (role === 'parent') {
      const { parentId, occupation } = req.body;
      await db.query(
        `INSERT INTO parents (user_id, parent_id, occupation)
         VALUES (?, ?, ?)`,
        [userId, parentId || `PAR${userId}`, occupation || null]
      );
    } else if (role === 'admin') {
      await db.query(
        `INSERT INTO admins (user_id, admin_level, permissions)
         VALUES (?, ?, ?)`,
        [userId, isApproved ? 'super' : 'pending', JSON.stringify({})]
      );

      if (!isPredefinedAdmin(normalizedEmail)) {
        await db.query(
          `INSERT INTO admin_approval_requests (user_id, email, full_name, request_reason, status)
           VALUES (?, ?, ?, ?, 'pending')`,
          [userId, normalizedEmail, fullName.trim(), req.body.adminReason || 'Admin access requested']
        );
      }
    }

    await db.query(
      `INSERT INTO settings (user_id, notification_preferences, privacy_settings) VALUES (?, '{}', '{}')`,
      [userId]
    );

    const otp = await createOTP(normalizedEmail);
    await sendOTPEmail(normalizedEmail, otp);

    logger.info(`User registered: ${normalizedEmail}, role: ${role}, approved: ${isApproved}`);

    let message = 'Registration successful! Please verify your email with the OTP sent.';
    if (role === 'admin' && !isApproved) {
      message = 'Registration successful! Your admin request is pending approval. Please verify your email.';
    } else if (role === 'teacher') {
      message = 'Registration successful! Your teacher account is pending admin approval. Please verify your email.';
    }

    sendResponse(res, 201, {
      verificationRequired: true,
      email: normalizedEmail,
      role,
      isApproved: isApproved === 1,
    }, message);
  } catch (error) {
    next(error);
  }
};

// ============================================
// LOGIN USER
// ============================================
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError(400, 'Email and password are required.', 'MISSING_FIELDS');
    }

    const normalizedEmail = validateEmail(email);

    const [users] = await db.query('SELECT * FROM users WHERE email = ? AND is_deleted = 0', [normalizedEmail]);

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Account not found. Please register first.',
        code: 'USER_NOT_REGISTERED',
        requiresRegistration: true,
      });
    }

    const user = users[0];

    if (user.status !== 'active') {
      throw new ApiError(403, 'Your account has been deactivated or suspended.', 'ACCOUNT_DEACTIVATED');
    }

    if (user.is_suspended) {
      throw new ApiError(403, 'Your account has been suspended. Please contact support.', 'ACCOUNT_SUSPENDED');
    }

    if (user.role === 'admin' && user.is_approved === 0) {
      return res.status(403).json({
        success: false,
        message: 'Your admin account is pending approval.',
        code: 'ADMIN_PENDING_APPROVAL',
        requiresApproval: true,
      });
    }

    if (user.password_hash === 'google_oauth' || user.password_hash === 'PREDEFINED_ADMIN') {
      return res.status(401).json({
        success: false,
        message: 'This account uses Google login. Please use "Continue with Google" or reset your password.',
        code: 'GOOGLE_ACCOUNT_NO_PASSWORD',
        showForgotPassword: true,
        isGoogleAccount: true,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password.',
        code: 'INVALID_PASSWORD',
        showForgotPassword: true,
      });
    }

    if (!user.is_verified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email address before logging in.',
        code: 'EMAIL_UNVERIFIED',
        verificationRequired: true,
        email: user.email,
      });
    }

    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);
    await storeRefreshToken(user.id, refreshToken, req.headers['user-agent']);

    await db.query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [user.id]);

    logger.info(`Login successful: ${normalizedEmail}`);
    sendResponse(res, 200, {
      user: sanitizeUserResponse(user),
      accessToken,
      refreshToken,
    }, 'Login successful!');
  } catch (error) {
    next(error);
  }
};

// ============================================
// GOOGLE OAUTH CALLBACK
// ============================================
exports.googleCallback = async (req, res) => {
  const sendHtmlRedirect = (url) => {
    res.send(`
      <html>
        <head><meta http-equiv="refresh" content="0;url=${url}"></head>
        <body><script>window.location.href="${url}";</script></body>
      </html>
    `);
  };

  try {
    const user = req.user;
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

    if (!user.isNewUser && user.id) {
      const [users] = await db.query('SELECT * FROM users WHERE id = ? AND is_deleted = 0', [user.id]);

      if (users.length === 0) {
        return sendHtmlRedirect(`${FRONTEND_URL}/login?error=user_not_found`);
      }

      const dbUser = users[0];

      if (dbUser.status !== 'active') {
        return sendHtmlRedirect(`${FRONTEND_URL}/login?error=account_deactivated`);
      }

      if (dbUser.role === 'admin' && dbUser.is_approved === 0) {
        return sendHtmlRedirect(`${FRONTEND_URL}/login?error=admin_pending_approval`);
      }

      const accessToken = generateToken(dbUser);
      const refreshToken = generateRefreshToken(dbUser);
      await storeRefreshToken(dbUser.id, refreshToken, req.headers['user-agent']);

      await db.query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [dbUser.id]);

      logger.info(`Google login: ${dbUser.email}`);
      return sendHtmlRedirect(`${FRONTEND_URL}/auth/google/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`);
    }

    if (user.isNewUser) {
      logger.info(`New Google user redirecting to registration: ${user.email}`);

      const googleData = Buffer.from(JSON.stringify({
        email: user.email,
        fullName: user.fullName,
        googleId: user.googleId,
        profileImage: user.profileImage,
        isGoogleUser: true,
      })).toString('base64');

      return sendHtmlRedirect(`${FRONTEND_URL}/auth/google/role-select?googleData=${googleData}&requiresRegistration=true`);
    }
  } catch (error) {
    logger.error('Google callback error:', error);
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.send(`<html><body><script>window.location.href="${FRONTEND_URL}/login?error=google_auth_failed";</script></body></html>`);
  }
};

// ============================================
// COMPLETE GOOGLE REGISTRATION
// ============================================
exports.completeGoogleRegistration = async (req, res, next) => {
  try {
    const { googleId, email, fullName, profileImage, role } = req.body;

    if (!googleId || !email || !fullName || !role) {
      throw new ApiError(400, 'Missing required fields.', 'MISSING_FIELDS');
    }
    if (!['student', 'teacher', 'parent', 'admin'].includes(role)) {
      throw new ApiError(400, 'Invalid role.', 'INVALID_ROLE');
    }

    const normalizedEmail = validateEmail(email);

    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
    if (existing.length > 0) {
      throw new ApiError(409, 'Email is already registered.', 'EMAIL_EXISTS');
    }

    let isApproved = 1;
    let approvalStatus = 'approved';
    if (role === 'admin' && !isPredefinedAdmin(normalizedEmail)) {
      isApproved = 0;
      approvalStatus = 'pending';
    } else if (role === 'teacher') {
      approvalStatus = 'pending';
    }

    const defaultImage = profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random&color=fff`;

    const [userResult] = await db.query(
      `INSERT INTO users (full_name, email, google_id, profile_image, role, approval_status, is_verified, is_approved, password_hash)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?, 'google_oauth')`,
      [fullName, normalizedEmail, googleId, defaultImage, role, approvalStatus, isApproved]
    );

    const userId = userResult.insertId;

    if (role === 'student') {
      await db.query(
        `INSERT INTO students (user_id, student_id, enrollment_year, level) VALUES (?, ?, ?, 'Beginner')`,
        [userId, `STU${userId}`, new Date().getFullYear()]
      );
    } else if (role === 'teacher') {
      await db.query(
        `INSERT INTO teachers (user_id, teacher_id, years_experience) VALUES (?, ?, 0)`,
        [userId, `TEA${userId}`]
      );
    } else if (role === 'parent') {
      await db.query(
        `INSERT INTO parents (user_id, parent_id) VALUES (?, ?)`,
        [userId, `PAR${userId}`]
      );
    } else if (role === 'admin') {
      await db.query(
        `INSERT INTO admins (user_id, admin_level, permissions) VALUES (?, ?, '{}')`,
        [userId, isApproved ? 'super' : 'pending']
      );

      if (!isPredefinedAdmin(normalizedEmail)) {
        await db.query(
          `INSERT INTO admin_approval_requests (user_id, email, full_name, status) VALUES (?, ?, ?, 'pending')`,
          [userId, normalizedEmail, fullName]
        );
      }
    }

    await db.query(
      `INSERT INTO settings (user_id, notification_preferences, privacy_settings) VALUES (?, '{}', '{}')`,
      [userId]
    );

    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    const user = users[0];

    if (role === 'admin' && !isApproved) {
      return sendResponse(res, 201, {
        user: sanitizeUserResponse(user),
        isApproved: false,
      }, 'Registration successful! Admin account is pending approval.');
    }

    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);
    await storeRefreshToken(userId, refreshToken, req.headers['user-agent']);

    logger.info(`Google registration: ${normalizedEmail}, role: ${role}`);
    sendResponse(res, 201, {
      user: sanitizeUserResponse(user),
      accessToken,
      refreshToken,
      isApproved: true,
    }, 'Registration completed successfully!');
  } catch (error) {
    next(error);
  }
};

// ============================================
// FORGOT PASSWORD
// ============================================
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) throw new ApiError(400, 'Email is required.', 'MISSING_EMAIL');

    const normalizedEmail = validateEmail(email);

    const [users] = await db.query(
      'SELECT id, email, full_name, is_verified FROM users WHERE email = ? AND is_deleted = 0',
      [normalizedEmail]
    );

    if (users.length === 0) {
      return sendResponse(res, 200, {}, 'If an account exists with this email, a password reset OTP has been sent.');
    }

    const user = users[0];
    if (!user.is_verified) {
      throw new ApiError(403, 'Please verify your email before resetting password.', 'EMAIL_UNVERIFIED');
    }

    const otp = await createPasswordResetOTP(normalizedEmail);
    await sendOTPEmail(normalizedEmail, otp, 'password_reset');

    logger.info(`Password reset OTP sent to: ${normalizedEmail}`);
    sendResponse(res, 200, { email: normalizedEmail, otpSent: true }, 'Password reset OTP has been sent to your email.');
  } catch (error) {
    next(error);
  }
};

// ============================================
// VERIFY RESET OTP
// ============================================
exports.verifyResetOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) throw new ApiError(400, 'Email and OTP are required.', 'MISSING_FIELDS');

    const result = await verifyPasswordResetOTP(email, otp);
    if (!result.valid) {
      throw new ApiError(400, result.message, 'INVALID_OTP');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    await db.query(
      'UPDATE users SET reset_token = ?, reset_token_expiry = DATE_ADD(NOW(), INTERVAL 15 MINUTE) WHERE email = ?',
      [resetToken, email]
    );

    logger.info(`Reset OTP verified: ${email}`);
    sendResponse(res, 200, { resetToken, email }, 'OTP verified. You can now reset your password.');
  } catch (error) {
    next(error);
  }
};

// ============================================
// RESET PASSWORD
// ============================================
exports.resetPassword = async (req, res, next) => {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword) throw new ApiError(400, 'Reset token and new password are required.', 'MISSING_FIELDS');

    validatePassword(newPassword);

    const [users] = await db.query(
      'SELECT id FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()',
      [resetToken]
    );

    if (users.length === 0) {
      throw new ApiError(400, 'Invalid or expired reset token. Please request a new OTP.', 'INVALID_TOKEN');
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await db.query(
      'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?',
      [passwordHash, users[0].id]
    );

    await db.query('DELETE FROM refresh_tokens WHERE user_id = ?', [users[0].id]);

    logger.info(`Password reset for user: ${users[0].id}`);
    sendResponse(res, 200, {}, 'Password reset successful! You can now login with your new password.');
  } catch (error) {
    next(error);
  }
};

// ============================================
// REFRESH TOKEN
// ============================================
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new ApiError(400, 'Refresh token required.', 'MISSING_TOKEN');

    const [storedToken] = await db.query(
      'SELECT * FROM refresh_tokens WHERE token = ? AND expires_at > NOW()',
      [refreshToken]
    );

    if (storedToken.length === 0) {
      throw new ApiError(401, 'Invalid or expired refresh token. Please login again.', 'INVALID_REFRESH_TOKEN');
    }

    const [users] = await db.query('SELECT * FROM users WHERE id = ? AND is_deleted = 0 AND status = ?', [storedToken[0].user_id, 'active']);
    if (users.length === 0) {
      await db.query('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);
      throw new ApiError(401, 'User account not found or deactivated.', 'USER_NOT_FOUND');
    }

    const newAccessToken = generateToken(users[0]);
    sendResponse(res, 200, { accessToken: newAccessToken });
  } catch (error) {
    next(error);
  }
};

// ============================================
// LOGOUT
// ============================================
exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await db.query('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);
    }
    sendResponse(res, 200, {}, 'Logged out successfully.');
  } catch (error) {
    next(error);
  }
};

// ============================================
// LOGOUT ALL DEVICES
// ============================================
exports.logoutAll = async (req, res, next) => {
  try {
    await db.query('DELETE FROM refresh_tokens WHERE user_id = ?', [req.user.id]);
    logger.info(`User ${req.user.id} logged out from all devices`);
    sendResponse(res, 200, {}, 'Logged out from all devices.');
  } catch (error) {
    next(error);
  }
};

// ============================================
// OTP VERIFICATION
// ============================================
exports.sendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) throw new ApiError(400, 'Email is required.', 'MISSING_EMAIL');

    const [users] = await db.query('SELECT id, is_verified FROM users WHERE email = ?', [email]);
    if (users.length === 0) throw new ApiError(404, 'User not found.', 'USER_NOT_FOUND');
    if (users[0].is_verified) throw new ApiError(400, 'Email is already verified.', 'ALREADY_VERIFIED');

    const otp = await createOTP(email);
    await sendOTPEmail(email, otp);

    logger.info(`OTP resent to ${email}`);
    sendResponse(res, 200, { email }, 'OTP sent successfully! Please check your email.');
  } catch (error) {
    next(error);
  }
};

exports.verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) throw new ApiError(400, 'Email and OTP are required.', 'MISSING_FIELDS');

    const result = await verifyOTPService(email, otp);
    if (!result.valid) throw new ApiError(400, result.message, 'INVALID_OTP');

    await db.query('UPDATE users SET is_verified = 1 WHERE email = ?', [email]);

    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = users[0];

    if (user.role === 'admin' && user.is_approved === 0) {
      return sendResponse(res, 200, {
        user: sanitizeUserResponse(user),
        isApproved: false,
      }, 'Email verified! Your admin account is pending approval.');
    }

    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);
    await storeRefreshToken(user.id, refreshToken, req.headers['user-agent']);

    logger.info(`Email verified: ${email}`);
    sendResponse(res, 200, {
      user: sanitizeUserResponse(user),
      accessToken,
      refreshToken,
    }, 'Email verified successfully! You are now logged in.');
  } catch (error) {
    next(error);
  }
};

exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;
    const [users] = await db.query('SELECT id FROM users WHERE verification_token = ?', [token]);

    if (users.length === 0) {
      throw new ApiError(400, 'Invalid or expired verification token.', 'INVALID_TOKEN');
    }

    await db.query('UPDATE users SET is_verified = 1, verification_token = NULL WHERE id = ?', [users[0].id]);
    sendResponse(res, 200, {}, 'Email verified successfully!');
  } catch (error) {
    next(error);
  }
};

// ============================================
// ADMIN APPROVAL REQUESTS
// ============================================
exports.getPendingAdminRequests = async (req, res, next) => {
  try {
    const [requests] = await db.query(
      `SELECT r.*, u.created_at as user_created_at
       FROM admin_approval_requests r
       JOIN users u ON r.user_id = u.id
       WHERE r.status = 'pending'
       ORDER BY r.requested_at DESC`
    );
    sendResponse(res, 200, { requests });
  } catch (error) {
    next(error);
  }
};

exports.approveAdminRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const adminId = req.user.id;

    const [requests] = await db.query('SELECT * FROM admin_approval_requests WHERE id = ?', [requestId]);
    if (requests.length === 0) throw new ApiError(404, 'Approval request not found.', 'REQUEST_NOT_FOUND');

    const request = requests[0];

    await db.query('UPDATE users SET is_approved = 1, approval_status = ? WHERE id = ?', ['approved', request.user_id]);
    await db.query('UPDATE admins SET admin_level = ? WHERE user_id = ?', ['regular', request.user_id]);
    await db.query(
      'UPDATE admin_approval_requests SET status = ?, reviewed_at = NOW(), reviewed_by = ? WHERE id = ?',
      ['approved', adminId, requestId]
    );

    logger.info(`Admin request approved: ${request.email} by admin ${adminId}`);
    sendResponse(res, 200, {}, 'Admin request approved successfully.');
  } catch (error) {
    next(error);
  }
};

exports.rejectAdminRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    const [requests] = await db.query('SELECT * FROM admin_approval_requests WHERE id = ?', [requestId]);
    if (requests.length === 0) throw new ApiError(404, 'Approval request not found.', 'REQUEST_NOT_FOUND');

    const request = requests[0];

    await db.query(
      'UPDATE admin_approval_requests SET status = ?, reviewed_at = NOW(), reviewed_by = ?, rejection_reason = ? WHERE id = ?',
      ['rejected', adminId, reason || 'No reason provided', requestId]
    );

    await db.query('UPDATE users SET status = ?, approval_status = ? WHERE id = ?', ['suspended', 'rejected', request.user_id]);

    logger.info(`Admin request rejected: ${request.email} by admin ${adminId}`);
    sendResponse(res, 200, {}, 'Admin request rejected.');
  } catch (error) {
    next(error);
  }
};
