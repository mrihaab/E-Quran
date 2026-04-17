const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const logger = require('../utils/logger');

const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 3;

/**
 * Generate a 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Hash OTP for secure storage
 */
const hashOTP = async (otp) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(otp, salt);
};

/**
 * Verify OTP against hash
 */
const verifyOTPHash = async (otp, hash) => {
  return bcrypt.compare(otp, hash);
};

/**
 * Create and store OTP for email
 */
const createOTP = async (email) => {
  try {
    // Invalidate any existing unused OTPs for this email
    await db.query(
      'UPDATE otp_verifications SET is_used = 1 WHERE email = ? AND is_used = 0',
      [email]
    );

    // Generate new OTP
    const otp = generateOTP();
    
    // Set expiry time
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES);

    // Store in database (plain text for now - add hashing later for production)
    await db.query(
      'INSERT INTO otp_verifications (email, otp, expires_at) VALUES (?, ?, ?)',
      [email, otp, expiresAt]
    );

    logger.info(`OTP created for ${email}: ${otp}`);
    return otp; // Return plain OTP for sending via email
  } catch (error) {
    logger.error('Error creating OTP:', error);
    throw error;
  }
};

/**
 * Verify OTP for email
 */
const verifyOTP = async (email, otp) => {
  try {
    logger.info(`Verifying OTP for ${email}, entered OTP: ${otp}`);
    
    // Get latest unused OTP for this email
    const [records] = await db.query(
      `SELECT * FROM otp_verifications 
       WHERE email = ? AND is_used = 0 AND expires_at > NOW() 
       ORDER BY created_at DESC LIMIT 1`,
      [email]
    );

    if (records.length === 0) {
      logger.warn(`No valid OTP found for ${email}`);
      return { valid: false, message: 'OTP expired or invalid. Please request a new one.' };
    }

    const record = records[0];
    logger.info(`Found OTP record for ${email}, attempts: ${record.attempts}`);

    // Check max attempts
    if (record.attempts >= MAX_ATTEMPTS) {
      // Mark as used to prevent further attempts
      await db.query('UPDATE otp_verifications SET is_used = 1 WHERE id = ?', [record.id]);
      return { valid: false, message: 'Too many failed attempts. Please request a new OTP.' };
    }

    // Verify OTP (plain text comparison for now)
    const isValid = otp === record.otp;
    logger.info(`OTP comparison: entered=${otp}, stored=${record.otp}, result=${isValid}`);

    // Increment attempts
    await db.query(
      'UPDATE otp_verifications SET attempts = attempts + 1 WHERE id = ?',
      [record.id]
    );

    if (!isValid) {
      const remainingAttempts = MAX_ATTEMPTS - (record.attempts + 1);
      logger.warn(`Invalid OTP for ${email}, remaining attempts: ${remainingAttempts}`);
      return { 
        valid: false, 
        message: remainingAttempts > 0 
          ? `Invalid OTP. ${remainingAttempts} attempts remaining.` 
          : 'Too many failed attempts. Please request a new OTP.'
      };
    }

    // Mark OTP as used
    await db.query('UPDATE otp_verifications SET is_used = 1 WHERE id = ?', [record.id]);

    logger.info(`OTP verified successfully for ${email}`);
    return { valid: true, message: 'OTP verified successfully' };
  } catch (error) {
    logger.error('Error verifying OTP:', error);
    throw error;
  }
};

/**
 * Clean up expired OTPs (can be run periodically)
 */
const cleanupExpiredOTPs = async () => {
  try {
    const [result] = await db.query(
      'DELETE FROM otp_verifications WHERE expires_at < NOW() - INTERVAL 1 DAY'
    );
    if (result.affectedRows > 0) {
      logger.info(`Cleaned up ${result.affectedRows} expired OTP records`);
    }
  } catch (error) {
    logger.error('Error cleaning up expired OTPs:', error);
  }
};

/**
 * Check if email has a valid pending OTP
 */
const hasValidOTP = async (email) => {
  try {
    const [records] = await db.query(
      `SELECT COUNT(*) as count FROM otp_verifications 
       WHERE email = ? AND is_used = 0 AND expires_at > NOW()`,
      [email]
    );
    return records[0].count > 0;
  } catch (error) {
    logger.error('Error checking valid OTP:', error);
    return false;
  }
};

module.exports = {
  createOTP,
  verifyOTP,
  cleanupExpiredOTPs,
  hasValidOTP,
  OTP_EXPIRY_MINUTES,
  MAX_ATTEMPTS
};
