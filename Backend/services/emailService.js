const nodemailer = require('nodemailer');
const logger = require('../utils/logger');
require('dotenv').config();

// ==================== TRANSPORT SETUP ====================

const FROM_NAME  = process.env.EMAIL_FROM_NAME  || 'E-Quran Academy';
const FROM_EMAIL = process.env.EMAIL_FROM        || process.env.SMTP_USER || 'noreply@equran.com';
const FRONTEND_URL = process.env.FRONTEND_URL    || 'http://localhost:5173';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST,
      port:   parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',       // true for 465, false for 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: { rejectUnauthorized: process.env.NODE_ENV === 'production' }
    });
    logger.info('Email: SMTP transporter configured.');
  } else {
    // Development only — log to console, do not actually send
    logger.warn('Email: SMTP not configured. Emails will be printed to console.');
    transporter = null;
  }

  return transporter;
}

/**
 * Internal send helper.
 * Falls back to console logging in development when SMTP is not configured.
 */
async function sendMail({ to, subject, html }) {
  const t = getTransporter();

  if (!t) {
    logger.info(`[DEV EMAIL] To: ${to} | Subject: ${subject}`);
    return;
  }

  try {
    const info = await t.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to,
      subject,
      html
    });
    logger.info(`Email sent to ${to}: ${info.messageId}`);
  } catch (error) {
    logger.error(`Failed to send email to ${to}: ${error.message}`);
    // Do not throw — a failed email must never break the calling request
  }
}

// ==================== BRANDED LAYOUT ====================

function layout(bodyHtml) {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:30px 0;">
      <tr><td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
          style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">

          <!-- Header -->
          <tr>
            <td style="background:#065f46;padding:24px 32px;">
              <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;letter-spacing:.5px;">
                📖 E-Quran Academy
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#6b7280;">
                © ${new Date().getFullYear()} E-Quran Academy &mdash; Learn Quran Online<br/>
                If you did not request this email, you may safely ignore it.
              </p>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
  </html>`;
}

// ==================== EMAIL SENDERS ====================

/**
 * OTP Email — used for both registration verification and password reset
 */
exports.sendOTPEmail = async (to, otp, type = 'verification') => {
  const isReset = type === 'password_reset';
  const title   = isReset ? 'Password Reset Code' : 'Email Verification Code';

  const body = `
    <h2 style="margin:0 0 16px;color:#111827;font-size:20px;">${title}</h2>
    <p style="color:#374151;font-size:15px;line-height:1.6;">
      ${isReset
        ? 'You requested a password reset. Enter the code below within <strong>15 minutes</strong>:'
        : 'Thank you for registering. Please use this code to verify your email address:'}
    </p>
    <div style="text-align:center;margin:28px 0;">
      <div style="display:inline-block;background:#f0fdf4;border:2px dashed #059669;
                  border-radius:10px;padding:18px 36px;">
        <span style="font-size:36px;font-weight:700;letter-spacing:10px;color:#065f46;">${otp}</span>
      </div>
    </div>
    <p style="color:#6b7280;font-size:13px;">
      This code expires in <strong>${isReset ? '15' : '10'} minutes</strong>.
      Do not share it with anyone.
    </p>`;

  await sendMail({
    to,
    subject: `${otp} — Your E-Quran Academy ${title}`,
    html: layout(body)
  });
};

/**
 * Verification email (token-based link — legacy flow)
 */
exports.sendVerificationEmail = async (to, token) => {
  const url = `${FRONTEND_URL}/verify-email?token=${token}`;
  const body = `
    <h2 style="margin:0 0 16px;color:#111827;font-size:20px;">Verify Your Account</h2>
    <p style="color:#374151;font-size:15px;line-height:1.6;">
      Welcome to E-Quran Academy! Click the button below to activate your account.
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${url}" style="background:#065f46;color:#fff;text-decoration:none;
                               padding:13px 28px;border-radius:6px;font-size:15px;
                               font-weight:600;display:inline-block;">
        Verify My Account
      </a>
    </div>
    <p style="color:#6b7280;font-size:13px;">Or copy this link:<br/>
      <a href="${url}" style="color:#065f46;word-break:break-all;">${url}</a>
    </p>`;

  await sendMail({ to, subject: 'Verify your E-Quran Academy account', html: layout(body) });
};

/**
 * Password reset email (token-based — legacy flow)
 */
exports.sendPasswordResetEmail = async (to, token) => {
  const url = `${FRONTEND_URL}/reset-password?token=${token}`;
  const body = `
    <h2 style="margin:0 0 16px;color:#111827;font-size:20px;">Reset Your Password</h2>
    <p style="color:#374151;font-size:15px;line-height:1.6;">
      We received a request to reset your password. Click below — this link expires in <strong>1 hour</strong>.
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${url}" style="background:#dc2626;color:#fff;text-decoration:none;
                               padding:13px 28px;border-radius:6px;font-size:15px;
                               font-weight:600;display:inline-block;">
        Reset Password
      </a>
    </div>
    <p style="color:#6b7280;font-size:13px;">Or copy this link:<br/>
      <a href="${url}" style="color:#dc2626;word-break:break-all;">${url}</a>
    </p>`;

  await sendMail({ to, subject: 'Reset your E-Quran Academy password', html: layout(body) });
};

/**
 * Teacher approval email
 */
exports.sendApprovalEmail = async (to, name) => {
  const url = `${FRONTEND_URL}/auth/teacher?intent=login`;
  const body = `
    <h2 style="margin:0 0 16px;color:#111827;font-size:20px;">Congratulations, ${name}! 🎉</h2>
    <p style="color:#374151;font-size:15px;line-height:1.6;">
      Your teacher application has been <strong style="color:#059669;">approved</strong>.
      You can now log in and start teaching on E-Quran Academy.
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${url}" style="background:#065f46;color:#fff;text-decoration:none;
                               padding:13px 28px;border-radius:6px;font-size:15px;
                               font-weight:600;display:inline-block;">
        Go to Teacher Dashboard
      </a>
    </div>`;

  await sendMail({ to, subject: 'Your teacher application has been approved!', html: layout(body) });
};

/**
 * Teacher rejection email
 */
exports.sendRejectionEmail = async (to, name, reason) => {
  const body = `
    <h2 style="margin:0 0 16px;color:#111827;font-size:20px;">Application Update</h2>
    <p style="color:#374151;font-size:15px;line-height:1.6;">Dear ${name},</p>
    <p style="color:#374151;font-size:15px;line-height:1.6;">
      Thank you for your interest in teaching at E-Quran Academy.
      After careful review, we are unable to approve your application at this time.
    </p>
    <div style="background:#fef2f2;border-left:4px solid #dc2626;padding:14px 16px;
                border-radius:0 6px 6px 0;margin:20px 0;">
      <p style="margin:0;color:#7f1d1d;font-size:14px;"><strong>Reason:</strong> ${reason || 'Your application did not meet our current requirements.'}</p>
    </div>
    <p style="color:#374151;font-size:15px;line-height:1.6;">
      You are welcome to reapply in the future with updated qualifications or documentation.
    </p>`;

  await sendMail({ to, subject: 'E-Quran Academy — Teacher Application Update', html: layout(body) });
};

/**
 * Account suspension email
 */
exports.sendSuspensionEmail = async (to, name, reason) => {
  const supportUrl = `${FRONTEND_URL}/contact`;
  const body = `
    <h2 style="margin:0 0 16px;color:#dc2626;font-size:20px;">Account Suspended</h2>
    <p style="color:#374151;font-size:15px;line-height:1.6;">Dear ${name},</p>
    <p style="color:#374151;font-size:15px;line-height:1.6;">
      Your account has been temporarily suspended.
    </p>
    <div style="background:#fef2f2;border-left:4px solid #dc2626;padding:14px 16px;
                border-radius:0 6px 6px 0;margin:20px 0;">
      <p style="margin:0;color:#7f1d1d;font-size:14px;"><strong>Reason:</strong> ${reason || 'Policy violation.'}</p>
    </div>
    <p style="color:#374151;font-size:15px;">If you believe this is an error, please contact our support team.</p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${supportUrl}" style="background:#dc2626;color:#fff;text-decoration:none;
                                     padding:12px 24px;border-radius:6px;font-size:15px;
                                     font-weight:600;display:inline-block;">
        Contact Support
      </a>
    </div>`;

  await sendMail({ to, subject: 'Important: Your E-Quran Academy account has been suspended', html: layout(body) });
};

/**
 * Account reactivation email
 */
exports.sendReactivationEmail = async (to, name) => {
  const url = `${FRONTEND_URL}/role-selection?intent=login`;
  const body = `
    <h2 style="margin:0 0 16px;color:#059669;font-size:20px;">Welcome Back, ${name}! 🎉</h2>
    <p style="color:#374151;font-size:15px;line-height:1.6;">
      Your E-Quran Academy account has been <strong style="color:#059669;">reactivated</strong>.
      You can now log in and continue your journey.
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${url}" style="background:#065f46;color:#fff;text-decoration:none;
                               padding:13px 28px;border-radius:6px;font-size:15px;
                               font-weight:600;display:inline-block;">
        Login Now
      </a>
    </div>`;

  await sendMail({ to, subject: 'Your E-Quran Academy account has been reactivated', html: layout(body) });
};

/**
 * Parent invitation email
 */
exports.sendParentInvitationEmail = async (to, studentName, token) => {
  const url = `${FRONTEND_URL}/parent/activate/${token}`;
  const body = `
    <h2 style="margin:0 0 16px;color:#111827;font-size:20px;">Parent Invitation</h2>
    <p style="color:#374151;font-size:15px;line-height:1.6;">
      You have been invited to connect with <strong>${studentName}</strong> on E-Quran Academy.
    </p>
    <p style="color:#374151;font-size:15px;">As a parent you will be able to:</p>
    <ul style="color:#374151;font-size:15px;line-height:2;">
      <li>Monitor your child's progress</li>
      <li>View attendance records</li>
      <li>Communicate with teachers</li>
    </ul>
    <div style="text-align:center;margin:28px 0;">
      <a href="${url}" style="background:#1d4ed8;color:#fff;text-decoration:none;
                               padding:13px 28px;border-radius:6px;font-size:15px;
                               font-weight:600;display:inline-block;">
        Activate Parent Account
      </a>
    </div>
    <p style="color:#6b7280;font-size:13px;">This invitation expires in 7 days.</p>`;

  await sendMail({ to, subject: `You're invited to monitor ${studentName} on E-Quran Academy`, html: layout(body) });
};

/**
 * Parent link notification (when parent already has an account)
 */
exports.sendParentLinkNotificationEmail = async (to, studentName) => {
  const url = `${FRONTEND_URL}/parent-dashboard`;
  const body = `
    <h2 style="margin:0 0 16px;color:#111827;font-size:20px;">New Student Linked</h2>
    <p style="color:#374151;font-size:15px;line-height:1.6;">
      <strong>${studentName}</strong> has been linked to your parent account.
      You can now view their progress from your dashboard.
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${url}" style="background:#065f46;color:#fff;text-decoration:none;
                               padding:13px 28px;border-radius:6px;font-size:15px;
                               font-weight:600;display:inline-block;">
        View Dashboard
      </a>
    </div>`;

  await sendMail({ to, subject: `${studentName} has been linked to your parent account`, html: layout(body) });
};
