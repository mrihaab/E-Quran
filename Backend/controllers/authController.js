const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../config/db');
const { generateToken, generateRefreshToken } = require('../middleware/auth');
const { sendOTPEmail, sendPasswordResetEmail } = require('../services/emailService');
const { createOTP, verifyOTP: verifyOTPService } = require('../services/otpService');
const { sendResponse } = require('../utils/responseHandler');
const { ApiError } = require('../middleware/errorMiddleware');
const { logAuditEvent } = require('../middleware/auditLogger');
const logger = require('../utils/logger');

// ============================================
// PREDEFINED ADMIN EMAILS - Direct Admin Access
// ============================================
const PREDEFINED_ADMIN_EMAILS = [
  'orhanuppal@gmail.com',
  'mrihaab6@gmail.com',
  'm.bilalirshad469@gmail.com'
];

/**
 * Check if email is a predefined admin
 */
const isPredefinedAdmin = (email) => {
  return PREDEFINED_ADMIN_EMAILS.includes(email.toLowerCase().trim());
};

/**
 * Create password reset OTP
 */
const createPasswordResetOTP = async (email) => {
  // Delete any existing unused OTPs for this email
  await db.query('DELETE FROM password_reset_tokens WHERE email = ? AND is_used = 0', [email]);
  
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Set expiry to 15 minutes
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 15);
  
  // Store OTP
  await db.query(
    'INSERT INTO password_reset_tokens (email, otp, expires_at) VALUES (?, ?, ?)',
    [email, otp, expiresAt]
  );
  
  return otp;
};

/**
 * Verify password reset OTP
 */
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
  
  // Check max attempts
  if (record.attempts >= 5) {
    await db.query('UPDATE password_reset_tokens SET is_used = 1 WHERE id = ?', [record.id]);
    return { valid: false, message: 'Too many failed attempts. Please request a new OTP.' };
  }
  
  // Increment attempts on wrong OTP
  if (record.otp !== otp) {
    await db.query('UPDATE password_reset_tokens SET attempts = attempts + 1 WHERE id = ?', [record.id]);
    return { valid: false, message: 'Invalid OTP.' };
  }
  
  // Mark as used
  await db.query('UPDATE password_reset_tokens SET is_used = 1 WHERE id = ?', [record.id]);
  
  return { valid: true, message: 'OTP verified successfully.' };
};

const safePersistRefreshToken = async ({ userId, token, expiresAt, req }) => {
  const ipAddress = req?.ip || null;
  const userAgent = req?.headers?.['user-agent'] || 'unknown';

  try {
    await db.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at, device_info, last_used_at, ip_address, user_agent) VALUES (?, ?, ?, ?, NOW(), ?, ?)',
      [userId, token, expiresAt, userAgent, ipAddress, userAgent]
    );
  } catch (error) {
    try {
      await db.query(
        'INSERT INTO refresh_tokens (user_id, token, expires_at, device_info) VALUES (?, ?, ?, ?)',
        [userId, token, expiresAt, userAgent]
      );
    } catch (_) {
      throw error;
    }
  }
};

const safeTrackRefreshTokenUsage = async ({ refreshToken, req }) => {
  const ipAddress = req?.ip || null;
  const userAgent = req?.headers?.['user-agent'] || 'unknown';

  try {
    await db.query(
      'UPDATE refresh_tokens SET last_used_at = NOW(), ip_address = ?, user_agent = ? WHERE token = ?',
      [ipAddress, userAgent, refreshToken]
    );
  } catch (_) {
    // Optional metadata columns may not exist; silently continue.
  }
};

// ============================================
// REGISTER USER
// ============================================
exports.register = async (req, res, next) => {
  try {
    const { fullName, email, phone, password, role, gender, address } = req.body;

    if (!fullName || !email || !password || !role) {
      throw new ApiError(400, 'Full name, email, password, and role are required.', 'MISSING_FIELDS');
    }

    // SECURITY: Block predefined admin emails from regular registration
    // These emails can only be used via Google OAuth or by existing system
    if (isPredefinedAdmin(email) && role !== 'admin') {
      throw new ApiError(403, 'This email is reserved. Please use a different email or contact support.', 'RESERVED_EMAIL');
    }

    // Check if user already exists
    const [existing] = await db.query('SELECT id, is_verified FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      throw new ApiError(400, 'Email is already registered. Please login instead.', 'EMAIL_EXISTS');
    }

    // Check if role is admin and handle approval
    let isApproved = 1;
    let finalRole = role;
    
    if (role === 'admin') {
      if (isPredefinedAdmin(email)) {
        // Predefined admin - auto approve
        isApproved = 1;
        logger.info(`Predefined admin registered: ${email}`);
      } else {
        // Non-predefined admin - needs approval
        isApproved = 0;
        logger.info(`Admin registration pending approval: ${email}`);
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const [userResult] = await db.query(
      `INSERT INTO users (full_name, email, password_hash, phone, role, gender, address, profile_image, is_verified, is_approved)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
      [fullName, email, passwordHash, phone || null, finalRole, gender || null, address || null, 
       `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`, isApproved]
    );

    const userId = userResult.insertId;

    // Role-specific data
    if (finalRole === 'student') {
      const { studentId, dateOfBirth, course, enrollmentYear } = req.body;
      await db.query(
        `INSERT INTO students (user_id, student_id, date_of_birth, course, enrollment_year, level)
         VALUES (?, ?, ?, ?, ?, 'Beginner')`,
        [userId, studentId || `STU${userId}`, dateOfBirth || null, course || null, enrollmentYear || new Date().getFullYear()]
      );
    } else if (finalRole === 'teacher') {
      const { teacherId, qualification, subject, yearsOfExperience, salary } = req.body;
      await db.query(
        `INSERT INTO teachers (user_id, teacher_id, qualification, subject, years_experience, salary)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, teacherId || `TEA${userId}`, qualification || null, subject || null, yearsOfExperience || 0, salary || null]
      );
    } else if (finalRole === 'parent') {
      const { parentId, occupation } = req.body;
      await db.query(
        `INSERT INTO parents (user_id, parent_id, occupation)
         VALUES (?, ?, ?)`,
        [userId, parentId || `PAR${userId}`, occupation || null]
      );
    } else if (finalRole === 'admin') {
      await db.query(
        `INSERT INTO admins (user_id, admin_level, permissions)
         VALUES (?, ?, ?)`,
        [userId, isApproved ? 'super' : 'pending', JSON.stringify({})]
      );
      
      // If not predefined admin, create approval request
      if (!isPredefinedAdmin(email)) {
        await db.query(
          `INSERT INTO admin_approval_requests (user_id, email, full_name, request_reason, status)
           VALUES (?, ?, ?, ?, 'pending')`,
          [userId, email, fullName, req.body.adminReason || 'Admin access requested']
        );
      }
    }

    await db.query(
      `INSERT INTO settings (user_id, notification_preferences, privacy_settings)
       VALUES (?, ?, ?)`,
      [userId, JSON.stringify({}), JSON.stringify({})]
    );

    // Generate and send OTP
    const otp = await createOTP(email);
    await sendOTPEmail(email, otp);

    logger.info(`User registered: ${email}, role: ${finalRole}, approved: ${isApproved}`);
    
    const message = isApproved === 0 && finalRole === 'admin' 
      ? 'Registration successful! Your admin request is pending approval. Please verify your email with the OTP sent.'
      : 'Registration successful! Please verify your email with the OTP sent.';
    
    sendResponse(res, 201, { 
      verificationRequired: true, 
      email,
      role: finalRole,
      isApproved: isApproved === 1
    }, message);
  } catch (error) {
    next(error);
  }
};

// ============================================
// LOGIN USER - Registration Required
// ============================================
exports.login = async (req, res, next) => {
  try {
    const { email, password, portalRole } = req.body;

    // Check if user exists - MUST be registered first
    const [users] = await db.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      // User not registered
      logAuditEvent(req, {
        action: 'login',
        status: 'failed',
        metadata: { reason: 'user_not_registered', email: email || null }
      });
      return res.status(401).json({
        success: false,
        message: 'Account not found. Please register first.',
        code: 'USER_NOT_REGISTERED',
        requiresRegistration: true
      });
    }

    const user = users[0];
    
    // DEBUG: Log user role
    console.log(`[LOGIN DEBUG] User: ${user.email}, Role from DB: ${user.role}, Portal: ${portalRole}`);
    
    // STRICT ROLE VALIDATION: Check if user is logging in through correct portal
    if (portalRole && portalRole !== user.role) {
      console.log(`[LOGIN DEBUG] ROLE MISMATCH: ${email} is ${user.role} but tried ${portalRole}`);
      logAuditEvent(req, {
        action: 'login',
        status: 'failed',
        metadata: { reason: 'wrong_portal', email: email || null, actualRole: user.role, attemptedRole: portalRole }
      });
      return res.status(403).json({
        success: false,
        message: `This email is registered as a ${user.role}. Please use the correct login portal.`,
        code: 'WRONG_PORTAL',
        actualRole: user.role,
        attemptedRole: portalRole
      });
    }

    // Check if account is active
    if (user.status !== 'active') {
      throw new ApiError(403, 'Your account is deactivated or suspended.', 'ACCOUNT_DEACTIVATED');
    }

    // Check if admin is approved
    if (user.role === 'admin' && user.is_approved === 0) {
      logAuditEvent(req, {
        action: 'login',
        status: 'failed',
        metadata: { reason: 'admin_pending_approval', userId: user.id, role: user.role }
      });
      return res.status(403).json({
        success: false,
        message: 'Your admin account is pending approval. Please wait for an existing admin to approve your request.',
        code: 'ADMIN_PENDING_APPROVAL',
        requiresApproval: true
      });
    }

    // Check if user registered via Google OAuth only (no password set)
    if (user.password_hash === 'google_oauth' || user.password_hash === 'PREDEFINED_ADMIN') {
      logAuditEvent(req, {
        action: 'login',
        status: 'failed',
        metadata: { reason: 'google_account_no_password', userId: user.id, email: user.email }
      });
      return res.status(401).json({
        success: false,
        message: 'This account was created via Google. Please use "Continue with Google" to login, or use Forgot Password to set a password.',
        code: 'GOOGLE_ACCOUNT_NO_PASSWORD',
        showForgotPassword: true,
        isGoogleAccount: true
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      logAuditEvent(req, {
        action: 'login',
        status: 'failed',
        metadata: { reason: 'invalid_password', userId: user.id, email: user.email }
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid password. Please try again or use Forgot Password.',
        code: 'INVALID_PASSWORD',
        showForgotPassword: true
      });
    }

    // Check if email is verified
    if (!user.is_verified) {
      logAuditEvent(req, {
        action: 'login',
        status: 'failed',
        metadata: { reason: 'email_unverified', userId: user.id, email: user.email }
      });
      return res.status(403).json({ 
        success: false,
        message: 'Please verify your email address before logging in.',
        code: 'EMAIL_UNVERIFIED',
        verificationRequired: true,
        email: user.email 
      });
    }

    // Generate tokens
    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    await safePersistRefreshToken({
      userId: user.id,
      token: refreshToken,
      expiresAt,
      req
    });

    logger.info(`User logged in: ${email}`);
    logAuditEvent(req, {
      action: 'login',
      status: 'success',
      metadata: { userId: user.id, role: user.role, loginType: 'password' }
    });
    sendResponse(res, 200, {
      user: { id: user.id, name: user.full_name, email: user.email, role: user.role, profileImage: user.profile_image },
      accessToken,
      refreshToken
    }, 'Login successful!');
  } catch (error) {
    next(error);
  }
};

// ============================================
// GOOGLE OAUTH CALLBACK - Registered Users Only
// ============================================
exports.googleCallback = async (req, res) => {
  // Helper to force a client-side redirect, bypassing Chrome 302 strictness
  const sendHtmlRedirect = (url) => {
    res.send(`
      <html>
        <head><meta http-equiv="refresh" content="0;url=${url}"></head>
        <body><script>window.location.href = "${url}";</script></body>
      </html>
    `);
  };

  try {
    const user = req.user;
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

    // If user is already registered and exists in DB
    if (!user.isNewUser && user.id) {
      const [users] = await db.query('SELECT * FROM users WHERE id = ?', [user.id]);
      
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

      // STRICT ROLE CHECK: Verify user is logging in through correct portal
      const requestedRole = req.oauthRole; // Role from the login portal
      const actualRole = dbUser.role; // Role from database
      
      console.log(`[GOOGLE AUTH DEBUG] User: ${dbUser.email}, Requested role: ${requestedRole}, Actual role: ${actualRole}`);
      
      if (requestedRole && requestedRole !== actualRole) {
        // User is trying to login through wrong portal - redirect back to attempted role's form
        console.log(`[GOOGLE AUTH DEBUG] Role mismatch! User ${dbUser.email} tried to login as ${requestedRole} but is actually ${actualRole}`);
        return sendHtmlRedirect(`${FRONTEND_URL}/auth/${requestedRole}?intent=login&error=wrong_portal&actualRole=${actualRole}`);
      }

      const accessToken = generateToken(dbUser);
      const refreshToken = generateRefreshToken(dbUser);

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      await safePersistRefreshToken({
        userId: dbUser.id,
        token: refreshToken,
        expiresAt,
        req
      });

      logger.info(`Google login successful: ${dbUser.email}, role: ${actualRole}`);
      logAuditEvent(req, {
        action: 'login',
        status: 'success',
        metadata: { userId: dbUser.id, role: actualRole, loginType: 'google' }
      });
      return sendHtmlRedirect(`${FRONTEND_URL}/auth/google/callback?accessToken=${accessToken}&refreshToken=${refreshToken}&role=${actualRole}`);
    }

    if (user.isNewUser) {
      logger.info(`New Google user - redirecting to registration: ${user.email}`);
      
      const googleData = Buffer.from(JSON.stringify({
        email: user.email,
        fullName: user.fullName,
        googleId: user.googleId,
        profileImage: user.profileImage,
        isGoogleUser: true
      })).toString('base64');
      
      return sendHtmlRedirect(`${FRONTEND_URL}/auth/google/role-select?googleData=${googleData}&requiresRegistration=true`);
    }
  } catch (error) {
    logger.error('Google callback error:', error);
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.send(`<html><body><script>window.location.href="${FRONTEND_URL}/login?error=google_auth_failed";</script></body></html>`);
  }
};

// ============================================
// FORGOT PASSWORD - Send OTP
// ============================================
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new ApiError(400, 'Email is required.', 'MISSING_EMAIL');
    }

    // Check if user exists and is verified
    const [users] = await db.query(
      'SELECT id, email, full_name, is_verified FROM users WHERE email = ? AND is_deleted = 0',
      [email]
    );

    if (users.length === 0) {
      // Don't reveal if email exists - security best practice
      return sendResponse(res, 200, {}, 'If an account exists with this email, a password reset OTP has been sent.');
    }

    const user = users[0];

    if (!user.is_verified) {
      throw new ApiError(403, 'Please verify your email before resetting password.', 'EMAIL_UNVERIFIED');
    }

    // Create and send OTP
    const otp = await createPasswordResetOTP(email);
    
    // Send email with OTP
    await sendOTPEmail(email, otp, 'password_reset');

    logger.info(`Password reset OTP sent to: ${email}`);
    sendResponse(res, 200, { 
      email,
      otpSent: true 
    }, 'Password reset OTP has been sent to your email.');
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

    if (!email || !otp) {
      throw new ApiError(400, 'Email and OTP are required.', 'MISSING_FIELDS');
    }

    const result = await verifyPasswordResetOTP(email, otp);

    if (!result.valid) {
      throw new ApiError(400, result.message, 'INVALID_OTP');
    }

    // Generate a temporary token for password reset
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Store in reset_token field
    await db.query(
      'UPDATE users SET reset_token = ?, reset_token_expiry = DATE_ADD(NOW(), INTERVAL 15 MINUTE) WHERE email = ?',
      [resetToken, email]
    );

    logger.info(`Password reset OTP verified: ${email}`);
    sendResponse(res, 200, { 
      resetToken,
      email 
    }, 'OTP verified. You can now reset your password.');
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

    if (!resetToken || !newPassword) {
      throw new ApiError(400, 'Reset token and new password are required.', 'MISSING_FIELDS');
    }

    // Validate password strength
    if (newPassword.length < 6) {
      throw new ApiError(400, 'Password must be at least 6 characters long.', 'WEAK_PASSWORD');
    }

    const [users] = await db.query(
      'SELECT id FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()',
      [resetToken]
    );

    if (users.length === 0) {
      throw new ApiError(400, 'Invalid or expired reset token. Please request a new OTP.', 'INVALID_TOKEN');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await db.query(
      'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?',
      [passwordHash, users[0].id]
    );

    logger.info(`Password reset successful for user: ${users[0].id}`);
    sendResponse(res, 200, {}, 'Password reset successful! You can now login with your new password.');
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

    // Get request details
    const [requests] = await db.query(
      'SELECT * FROM admin_approval_requests WHERE id = ?',
      [requestId]
    );

    if (requests.length === 0) {
      throw new ApiError(404, 'Admin approval request not found.', 'REQUEST_NOT_FOUND');
    }

    const request = requests[0];

    // Update user to approved
    await db.query(
      'UPDATE users SET is_approved = 1 WHERE id = ?',
      [request.user_id]
    );

    // Update admin record
    await db.query(
      'UPDATE admins SET admin_level = ? WHERE user_id = ?',
      ['regular', request.user_id]
    );

    // Update request status
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

    const [requests] = await db.query(
      'SELECT * FROM admin_approval_requests WHERE id = ?',
      [requestId]
    );

    if (requests.length === 0) {
      throw new ApiError(404, 'Admin approval request not found.', 'REQUEST_NOT_FOUND');
    }

    const request = requests[0];

    // Update request status
    await db.query(
      'UPDATE admin_approval_requests SET status = ?, reviewed_at = NOW(), reviewed_by = ?, rejection_reason = ? WHERE id = ?',
      ['rejected', adminId, reason || 'No reason provided', requestId]
    );

    // Optionally deactivate the user
    await db.query(
      'UPDATE users SET status = ? WHERE id = ?',
      ['suspended', request.user_id]
    );

    logger.info(`Admin request rejected: ${request.email} by admin ${adminId}`);
    sendResponse(res, 200, {}, 'Admin request rejected.');
  } catch (error) {
    next(error);
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

    // Check if user already exists
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      throw new ApiError(400, 'Email is already registered. Please login instead.', 'EMAIL_EXISTS');
    }

    // Check if predefined admin
    let isApproved = 1;
    if (role === 'admin') {
      if (isPredefinedAdmin(email)) {
        isApproved = 1;
      } else {
        isApproved = 0;
      }
    }

    // Create user
    const [userResult] = await db.query(
      `INSERT INTO users (full_name, email, google_id, profile_image, role, is_verified, is_approved, password_hash)
       VALUES (?, ?, ?, ?, ?, 1, ?, 'google_oauth')`,
      [fullName, email, googleId, profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`, role, isApproved]
    );

    const userId = userResult.insertId;

    // Role-specific data
    if (role === 'student') {
      await db.query(
        `INSERT INTO students (user_id, student_id, enrollment_year, level)
         VALUES (?, ?, ?, 'Beginner')`,
        [userId, `STU${userId}`, new Date().getFullYear()]
      );
    } else if (role === 'teacher') {
      await db.query(
        `INSERT INTO teachers (user_id, teacher_id, years_experience)
         VALUES (?, ?, 0)`,
        [userId, `TEA${userId}`]
      );
    } else if (role === 'parent') {
      await db.query(
        `INSERT INTO parents (user_id, parent_id)
         VALUES (?, ?)`,
        [userId, `PAR${userId}`]
      );
    } else if (role === 'admin') {
      await db.query(
        `INSERT INTO admins (user_id, admin_level, permissions)
         VALUES (?, ?, ?)`,
        [userId, isApproved ? 'super' : 'pending', JSON.stringify({})]
      );
      
      if (!isPredefinedAdmin(email)) {
        await db.query(
          `INSERT INTO admin_approval_requests (user_id, email, full_name, status)
           VALUES (?, ?, ?, 'pending')`,
          [userId, email, fullName]
        );
      }
    }

    await db.query(
      `INSERT INTO settings (user_id, notification_preferences, privacy_settings)
       VALUES (?, ?, ?)`,
      [userId, JSON.stringify({}), JSON.stringify({})]
    );

    // Get created user
    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    const user = users[0];

    // If admin not approved, return message instead of tokens
    if (role === 'admin' && !isApproved) {
      return sendResponse(res, 201, {
        user: { id: user.id, name: user.full_name, email: user.email, role: user.role },
        isApproved: false,
        message: 'Registration successful! Your admin account is pending approval.'
      }, 'Registration successful! Your admin account is pending approval from an existing admin.');
    }

    // Generate tokens
    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    await safePersistRefreshToken({
      userId,
      token: refreshToken,
      expiresAt,
      req
    });

    logger.info(`Google registration completed: ${email}, role: ${role}`);
    sendResponse(res, 201, {
      user: { id: user.id, name: user.full_name, email: user.email, role: user.role, profileImage: user.profile_image },
      accessToken,
      refreshToken,
      isApproved: true
    }, 'Registration completed successfully!');
  } catch (error) {
    next(error);
  }
};

// ============================================
// OTHER FUNCTIONS (UNCHANGED)
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
      throw new ApiError(401, 'Invalid or expired refresh token.', 'INVALID_REFRESH_TOKEN');
    }

    await safeTrackRefreshTokenUsage({ refreshToken, req });

    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [storedToken[0].user_id]);
    if (users.length === 0) throw new ApiError(401, 'User no longer exists.', 'USER_NOT_FOUND');

    const newAccessToken = generateToken(users[0]);
    logAuditEvent(req, {
      action: 'token_refresh',
      status: 'success',
      metadata: { userId: users[0].id, role: users[0].role }
    });
    sendResponse(res, 200, { accessToken: newAccessToken });
  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await db.query('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);
    }
    logAuditEvent(req, {
      action: 'logout',
      status: 'success',
      metadata: { refreshTokenProvided: Boolean(refreshToken) }
    });
    sendResponse(res, 200, {}, 'Logged out successfully.');
  } catch (error) {
    next(error);
  }
};

exports.logoutAll = async (req, res, next) => {
  try {
    await db.query('DELETE FROM refresh_tokens WHERE user_id = ?', [req.user.id]);
    sendResponse(res, 200, {}, 'Logged out from all devices.');
  } catch (error) {
    next(error);
  }
};

exports.sendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      throw new ApiError(400, 'Email is required.', 'MISSING_EMAIL');
    }

    const [users] = await db.query('SELECT id, is_verified FROM users WHERE email = ?', [email]);
    
    if (users.length === 0) {
      throw new ApiError(404, 'User not found.', 'USER_NOT_FOUND');
    }

    if (users[0].is_verified) {
      throw new ApiError(400, 'Email is already verified.', 'ALREADY_VERIFIED');
    }

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

    if (!email || !otp) {
      throw new ApiError(400, 'Email and OTP are required.', 'MISSING_FIELDS');
    }

    const result = await verifyOTPService(email, otp);

    if (!result.valid) {
      throw new ApiError(400, result.message, 'INVALID_OTP');
    }

    await db.query('UPDATE users SET is_verified = 1 WHERE email = ?', [email]);

    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = users[0];

    // DEBUG: Log user role being returned
    console.log(`[VERIFY OTP DEBUG] Email: ${email}, Role from DB: ${user.role}`);

    // If admin not approved, return without tokens
    if (user.role === 'admin' && user.is_approved === 0) {
      return sendResponse(res, 200, {
        user: { id: user.id, name: user.full_name, email: user.email, role: user.role },
        isApproved: false,
        message: 'Email verified! Your admin account is pending approval.'
      }, 'Email verified! Your admin account is pending approval.');
    }

    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    await safePersistRefreshToken({
      userId: user.id,
      token: refreshToken,
      expiresAt,
      req
    });

    logger.info(`Email verified with OTP: ${email}`);
    sendResponse(res, 200, {
      user: { id: user.id, name: user.full_name, email: user.email, role: user.role, profileImage: user.profile_image },
      accessToken,
      refreshToken
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
