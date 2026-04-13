const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../config/db');
const { generateToken, generateRefreshToken } = require('../middleware/auth');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');
const { sendResponse } = require('../utils/responseHandler');
const { ApiError } = require('../middleware/errorMiddleware');
const logger = require('../utils/logger');

/**
 * REGISTER USER
 */
exports.register = async (req, res, next) => {
  try {
    const { fullName, email, phone, password, role, gender, address } = req.body;

    if (!fullName || !email || !password || !role) {
      throw new ApiError(400, 'Full name, email, password, and role are required.', 'MISSING_FIELDS');
    }

    const [existing] = await db.query('SELECT id FROM users WHERE email = ? AND is_deleted = 0', [email]);
    if (existing.length > 0) {
      throw new ApiError(400, 'Email is already registered.', 'EMAIL_EXISTS');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const [userResult] = await db.query(
      `INSERT INTO users (full_name, email, password_hash, phone, role, gender, address, profile_image, verification_token, is_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [fullName, email, passwordHash, phone || null, role, gender || null, address || null, 
       `https://picsum.photos/seed/${encodeURIComponent(email)}/100/100`, verificationToken]
    );

    const userId = userResult.insertId;

    // Role-specific data
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
    }

    await db.query(
      `INSERT INTO settings (user_id, notification_preferences, privacy_settings)
       VALUES (?, ?, ?)`,
      [userId, JSON.stringify({}), JSON.stringify({})]
    );

    await sendVerificationEmail(email, verificationToken);

    sendResponse(res, 201, { verificationRequired: true }, 'Registration successful! Please verify your email.');
  } catch (error) {
    next(error);
  }
};

/**
 * LOGIN USER
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const [users] = await db.query(
      'SELECT * FROM users WHERE email = ? AND is_deleted = 0',
      [email]
    );

    if (users.length === 0) {
      throw new ApiError(401, 'Invalid credentials.', 'INVALID_AUTH');
    }

    const user = users[0];

    if (user.status !== 'active') {
      throw new ApiError(403, 'Your account is deactivated.', 'ACCOUNT_DEACTIVATED');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid credentials.', 'INVALID_AUTH');
    }

    if (!user.is_verified) {
      return res.status(403).json({ 
        success: false,
        message: 'Please verify your email address.',
        code: 'EMAIL_UNVERIFIED',
        verificationRequired: true,
        email: user.email 
      });
    }

    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    await db.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at, device_info) VALUES (?, ?, ?, ?)',
      [user.id, refreshToken, expiresAt, req.headers['user-agent'] || 'unknown']
    );

    sendResponse(res, 200, {
      user: { id: user.id, name: user.full_name, email: user.email, role: user.role, profileImage: user.profile_image },
      accessToken,
      refreshToken
    }, 'Login successful!');
  } catch (error) {
    next(error);
  }
};

/**
 * REFRESH TOKEN
 */
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

    const [users] = await db.query('SELECT * FROM users WHERE id = ? AND is_deleted = 0', [storedToken[0].user_id]);
    if (users.length === 0) throw new ApiError(401, 'User no longer exists.', 'USER_NOT_FOUND');

    const newAccessToken = generateToken(users[0]);
    sendResponse(res, 200, { accessToken: newAccessToken });
  } catch (error) {
    next(error);
  }
};

/**
 * LOGOUT
 */
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

/**
 * LOGOUT FROM ALL DEVICES
 */
exports.logoutAll = async (req, res, next) => {
  try {
    await db.query('DELETE FROM refresh_tokens WHERE user_id = ?', [req.user.id]);
    sendResponse(res, 200, {}, 'Logged out from all devices.');
  } catch (error) {
    next(error);
  }
};

/**
 * VERIFY EMAIL
 */
exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;
    const [users] = await db.query('SELECT id FROM users WHERE verification_token = ? AND is_deleted = 0', [token]);

    if (users.length === 0) {
      throw new ApiError(400, 'Invalid or expired verification token.', 'INVALID_TOKEN');
    }

    await db.query('UPDATE users SET is_verified = 1, verification_token = NULL WHERE id = ?', [users[0].id]);
    sendResponse(res, 200, {}, 'Email verified successfully!');
  } catch (error) {
    next(error);
  }
};

/**
 * FORGOT PASSWORD
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const [users] = await db.query('SELECT id FROM users WHERE email = ? AND is_deleted = 0', [email]);

    if (users.length > 0) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpiry = new Date(Date.now() + 3600000); // 1 hour
      await db.query('UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?', [resetToken, resetExpiry, email]);
      await sendPasswordResetEmail(email, resetToken);
    }

    sendResponse(res, 200, {}, 'If an account exists, a reset link has been sent.');
  } catch (error) {
    next(error);
  }
};

/**
 * RESET PASSWORD
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    const [users] = await db.query(
      'SELECT id FROM users WHERE reset_token = ? AND reset_token_expiry > NOW() AND is_deleted = 0',
      [token]
    );

    if (users.length === 0) {
      throw new ApiError(400, 'Invalid or expired reset token.', 'INVALID_TOKEN');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await db.query(
      'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?',
      [passwordHash, users[0].id]
    );

    sendResponse(res, 200, {}, 'Password reset successful!');
  } catch (error) {
    next(error);
  }
};
