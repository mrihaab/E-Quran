const crypto = require('crypto');
const db = require('../config/db');
const logger = require('../utils/logger');

const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;

function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

async function createOTP(email) {
  try {
    await db.query(
      'UPDATE otp_verifications SET is_used = 1 WHERE email = ? AND is_used = 0',
      [email]
    );

    const otp = generateOTP();

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES);

    await db.query(
      'INSERT INTO otp_verifications (email, otp, expires_at) VALUES (?, ?, ?)',
      [email, otp, expiresAt]
    );

    logger.info(`OTP created for ${email}`);
    return otp;
  } catch (error) {
    logger.error('Error creating OTP:', error);
    throw error;
  }
}

async function verifyOTP(email, otp) {
  try {
    const [records] = await db.query(
      `SELECT * FROM otp_verifications
       WHERE email = ? AND is_used = 0 AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [email]
    );

    if (records.length === 0) {
      return { valid: false, message: 'OTP expired or invalid. Please request a new one.' };
    }

    const record = records[0];

    if (record.attempts >= MAX_ATTEMPTS) {
      await db.query('UPDATE otp_verifications SET is_used = 1 WHERE id = ?', [record.id]);
      return { valid: false, message: 'Too many failed attempts. Please request a new OTP.' };
    }

    await db.query(
      'UPDATE otp_verifications SET attempts = attempts + 1 WHERE id = ?',
      [record.id]
    );

    if (otp !== record.otp) {
      const remaining = MAX_ATTEMPTS - (record.attempts + 1);
      return {
        valid: false,
        message: remaining > 0
          ? `Invalid OTP. ${remaining} attempts remaining.`
          : 'Too many failed attempts. Please request a new OTP.',
      };
    }

    await db.query('UPDATE otp_verifications SET is_used = 1 WHERE id = ?', [record.id]);

    logger.info(`OTP verified for ${email}`);
    return { valid: true, message: 'OTP verified successfully.' };
  } catch (error) {
    logger.error('Error verifying OTP:', error);
    throw error;
  }
}

async function cleanupExpiredOTPs() {
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
}

async function hasValidOTP(email) {
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
}

setInterval(cleanupExpiredOTPs, 60 * 60 * 1000);

module.exports = {
  createOTP,
  verifyOTP,
  cleanupExpiredOTPs,
  hasValidOTP,
  OTP_EXPIRY_MINUTES,
  MAX_ATTEMPTS,
};
