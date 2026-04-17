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

/**
 * SEND OTP EMAIL
 */
exports.sendOTPEmail = async (to, otp) => {
  const msg = {
    to,
    from: FROM_EMAIL,
    subject: 'Your E-Quran Academy Verification Code',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #2e7d32; text-align: center;">E-Quran Academy</h2>
        <p style="font-size: 16px;">Hello,</p>
        <p style="font-size: 16px;">Your verification code is:</p>
        <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f5f5f5; border-radius: 8px;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2e7d32;">${otp}</span>
        </div>
        <p style="font-size: 14px; color: #666;">This code will expire in <strong>10 minutes</strong>.</p>
        <p style="font-size: 14px; color: #666;">If you didn't request this code, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;">
        <p style="font-size: 12px; color: #888; text-align: center;">E-Quran Academy - Learn Quran Online</p>
      </div>
    `
  };

  try {
    if (process.env.SENDGRID_API_KEY) {
      await sgMail.send(msg);
      logger.info(`OTP email sent to ${to}`);
    } else {
      console.log(`\n========== MOCK OTP EMAIL ==========`);
      console.log(`To: ${to}`);
      console.log(`OTP: ${otp}`);
      console.log(`====================================\n`);
    }
  } catch (error) {
    logger.error('OTP email sending failed:', error);
  }
};

// ==================== APPROVAL SYSTEM EMAILS ====================

/**
 * SEND TEACHER APPROVAL EMAIL
 */
exports.sendApprovalEmail = async (to, name, status) => {
  const loginUrl = `${FRONTEND_URL}/teacher/login`;
  
  const msg = {
    to,
    from: FROM_EMAIL,
    subject: 'Your E-Quran Academy Teacher Application - Approved!',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #2e7d32; text-align: center;">🎉 Congratulations ${name}!</h2>
        <p style="font-size: 16px;">We are pleased to inform you that your teacher application has been <strong>APPROVED</strong>.</p>
        
        <div style="background-color: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #2e7d32; font-weight: bold;">Your account is now active!</p>
          <p style="margin: 10px 0 0 0;">You can now login and start teaching.</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${loginUrl}" style="background-color: #2e7d32; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Login to Your Dashboard</a>
        </div>
        
        <p>Welcome to our teaching community! We're excited to have you on board.</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;">
        <p style="font-size: 12px; color: #888; text-align: center;">E-Quran Academy - Empowering Education</p>
      </div>
    `
  };

  try {
    if (process.env.SENDGRID_API_KEY) {
      await sgMail.send(msg);
      logger.info(`Approval email sent to ${to}`);
    } else {
      logger.debug(`[MOCK EMAIL] To: ${to} | Status: APPROVED`);
    }
  } catch (error) {
    logger.error('Approval email failed:', error);
  }
};

/**
 * SEND TEACHER REJECTION EMAIL
 */
exports.sendRejectionEmail = async (to, name, reason) => {
  const reapplyUrl = `${FRONTEND_URL}/teacher/signup`;
  
  const msg = {
    to,
    from: FROM_EMAIL,
    subject: 'E-Quran Academy Teacher Application - Update',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #d32f2f; text-align: center;">Dear ${name}</h2>
        <p style="font-size: 16px;">Thank you for your interest in teaching at E-Quran Academy.</p>
        <p>After careful review of your application, we regret to inform you that we are unable to approve your application at this time.</p>
        
        <div style="background-color: #ffebee; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-weight: bold; color: #d32f2f;">Reason:</p>
          <p style="margin: 10px 0 0 0; color: #555;">${reason || 'Application did not meet our requirements'}</p>
        </div>
        
        <p>You are welcome to reapply in the future with updated qualifications.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${reapplyUrl}" style="background-color: #757575; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reapply</a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;">
        <p style="font-size: 12px; color: #888; text-align: center;">E-Quran Academy</p>
      </div>
    `
  };

  try {
    if (process.env.SENDGRID_API_KEY) {
      await sgMail.send(msg);
      logger.info(`Rejection email sent to ${to}`);
    } else {
      logger.debug(`[MOCK EMAIL] To: ${to} | Status: REJECTED | Reason: ${reason}`);
    }
  } catch (error) {
    logger.error('Rejection email failed:', error);
  }
};

/**
 * SEND SUSPENSION EMAIL
 */
exports.sendSuspensionEmail = async (to, name, reason) => {
  const supportUrl = `${FRONTEND_URL}/contact`;
  
  const msg = {
    to,
    from: FROM_EMAIL,
    subject: 'Important: Your E-Quran Academy Account - Suspended',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #d32f2f; text-align: center;">Account Suspended</h2>
        <p style="font-size: 16px;">Dear ${name},</p>
        <p>Your teacher account has been temporarily suspended.</p>
        
        <div style="background-color: #ffebee; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-weight: bold; color: #d32f2f;">Suspension Reason:</p>
          <p style="margin: 10px 0 0 0; color: #555;">${reason}</p>
        </div>
        
        <p>During this time, you will not be able to access your teacher dashboard or conduct classes.</p>
        <p>If you believe this was done in error, please contact our support team immediately.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${supportUrl}" style="background-color: #d32f2f; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Contact Support</a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;">
        <p style="font-size: 12px; color: #888; text-align: center;">E-Quran Academy</p>
      </div>
    `
  };

  try {
    if (process.env.SENDGRID_API_KEY) {
      await sgMail.send(msg);
      logger.info(`Suspension email sent to ${to}`);
    } else {
      logger.debug(`[MOCK EMAIL] To: ${to} | Status: SUSPENDED`);
    }
  } catch (error) {
    logger.error('Suspension email failed:', error);
  }
};

/**
 * SEND REACTIVATION EMAIL
 */
exports.sendReactivationEmail = async (to, name) => {
  const loginUrl = `${FRONTEND_URL}/teacher/login`;
  
  const msg = {
    to,
    from: FROM_EMAIL,
    subject: 'Good News: Your E-Quran Academy Account - Reactivated',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #2e7d32; text-align: center;">🎉 Welcome Back ${name}!</h2>
        <p style="font-size: 16px;">We are pleased to inform you that your teacher account has been reactivated.</p>
        
        <div style="background-color: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #2e7d32; font-weight: bold;">Your account is active again!</p>
          <p style="margin: 10px 0 0 0;">You can now resume teaching on our platform.</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${loginUrl}" style="background-color: #2e7d32; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Login Now</a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;">
        <p style="font-size: 12px; color: #888; text-align: center;">E-Quran Academy</p>
      </div>
    `
  };

  try {
    if (process.env.SENDGRID_API_KEY) {
      await sgMail.send(msg);
      logger.info(`Reactivation email sent to ${to}`);
    } else {
      logger.debug(`[MOCK EMAIL] To: ${to} | Status: REACTIVATED`);
    }
  } catch (error) {
    logger.error('Reactivation email failed:', error);
  }
};

// ==================== PARENT INVITATION EMAILS ====================

/**
 * SEND PARENT INVITATION EMAIL
 */
exports.sendParentInvitationEmail = async (to, studentName, token) => {
  const activationUrl = `${FRONTEND_URL}/parent/activate/${token}`;
  
  const msg = {
    to,
    from: FROM_EMAIL,
    subject: `You're Invited: Connect with ${studentName} on E-Quran Academy`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #1976d2; text-align: center;">Parent Invitation</h2>
        <p style="font-size: 16px;">Hello,</p>
        <p>You have been invited to connect with <strong>${studentName}</strong> on E-Quran Academy.</p>
        <p>As a parent, you'll be able to:</p>
        <ul style="color: #555;">
          <li>Monitor your child's progress</li>
          <li>View attendance records</li>
          <li>Communicate with teachers</li>
          <li>Track homework completion</li>
        </ul>
        
        <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p style="margin: 0 0 15px 0; font-weight: bold;">Click below to activate your parent account:</p>
          <a href="${activationUrl}" style="background-color: #1976d2; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Activate Parent Account</a>
        </div>
        
        <p style="font-size: 14px; color: #666;">This invitation link will expire in 7 days.</p>
        <p style="font-size: 14px; color: #666;">If you didn't expect this invitation, please ignore this email.</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;">
        <p style="font-size: 12px; color: #888; text-align: center;">E-Quran Academy</p>
      </div>
    `
  };

  try {
    if (process.env.SENDGRID_API_KEY) {
      await sgMail.send(msg);
      logger.info(`Parent invitation sent to ${to} for student ${studentName}`);
    } else {
      logger.debug(`[MOCK EMAIL] To: ${to} | Parent invitation for ${studentName} | Token: ${token}`);
    }
  } catch (error) {
    logger.error('Parent invitation email failed:', error);
  }
};

/**
 * SEND PARENT LINK NOTIFICATION (when parent already exists)
 */
exports.sendParentLinkNotificationEmail = async (to, studentName) => {
  const dashboardUrl = `${FRONTEND_URL}/parent/login`;
  
  const msg = {
    to,
    from: FROM_EMAIL,
    subject: `New Student Linked: ${studentName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #1976d2; text-align: center;">New Student Connection</h2>
        <p style="font-size: 16px;">Hello,</p>
        <p><strong>${studentName}</strong> has been linked to your parent account on E-Quran Academy.</p>
        <p>You can now view their progress, attendance, and communicate with their teachers.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${dashboardUrl}" style="background-color: #1976d2; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Dashboard</a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;">
        <p style="font-size: 12px; color: #888; text-align: center;">E-Quran Academy</p>
      </div>
    `
  };

  try {
    if (process.env.SENDGRID_API_KEY) {
      await sgMail.send(msg);
      logger.info(`Parent link notification sent to ${to}`);
    } else {
      logger.debug(`[MOCK EMAIL] To: ${to} | Parent link notification for ${studentName}`);
    }
  } catch (error) {
    logger.error('Parent link notification email failed:', error);
  }
};
