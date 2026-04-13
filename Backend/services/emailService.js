const sgMail = require('@sendgrid/mail');
const logger = require('../utils/logger');

// Initialize SendGrid with API key from environment
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  logger.info('SendGrid service initialized');
} else {
  logger.warn('SENDGRID_API_KEY not found. Emails will be logged to console only.');
}

// ==================== CONFIGURATION ====================
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@equran.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

/**
 * SEND VERIFICATION EMAIL
 */
exports.sendVerificationEmail = async (to, token) => {
  const verifyUrl = `${FRONTEND_URL}/verify-email?token=${token}`;
  
  const msg = {
    to,
    from: FROM_EMAIL,
    subject: 'Complete your E-Quran Academy Registration',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee;">
        <h2 style="color: #2e7d32;">Welcome to E-Quran Academy!</h2>
        <p>Thank you for registering. Please verify your email address to activate your account.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" style="background-color: #2e7d32; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify My Account</a>
        </div>
        <p>If the button doesn't work, copy and paste this link: <br> ${verifyUrl}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;">
        <p style="font-size: 12px; color: #888;">If you did not create an account, please ignore this email.</p>
      </div>
    `
  };

  try {
    if (process.env.SENDGRID_API_KEY) {
      await sgMail.send(msg);
      logger.info(`Verification email sent to ${to}`);
    } else {
      logger.debug(`[MOCK EMAIL] To: ${to} | Verification URL: ${verifyUrl}`);
    }
  } catch (error) {
    logger.error('Email sending failed:', error);
    // Don't throw error to prevent blocking registration, but log it
  }
};

/**
 * SEND PASSWORD RESET EMAIL
 */
exports.sendPasswordResetEmail = async (to, token) => {
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;
  
  const msg = {
    to,
    from: FROM_EMAIL,
    subject: 'Reset your E-Quran Academy Password',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee;">
        <h2 style="color: #d32f2f;">Password Reset Request</h2>
        <p>You requested a password reset. Click the button below to choose a new password. This link expires in 1 hour.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #d32f2f; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
        </div>
        <p>If the button doesn't work, copy and paste this link: <br> ${resetUrl}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;">
        <p style="font-size: 12px; color: #888;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `
  };

  try {
    if (process.env.SENDGRID_API_KEY) {
      await sgMail.send(msg);
      logger.info(`Password reset email sent to ${to}`);
    } else {
      logger.debug(`[MOCK EMAIL] To: ${to} | Reset URL: ${resetUrl}`);
    }
  } catch (error) {
    logger.error('Password reset email failed:', error);
  }
};
