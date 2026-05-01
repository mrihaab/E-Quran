const express = require('express');
const router = express.Router();
const db = require('../config/db');
const nodemailer = require('nodemailer');
const contactController = require('../controllers/contactController');
const { verifyToken, requireRole } = require('../middleware/auth');
const { sendResponse } = require('../utils/responseHandler');
const logger = require('../utils/logger');

let transporter = null;

async function initEmail() {
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
}
initEmail();

router.post('/', async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required (name, email, subject, message).',
        code: 'MISSING_FIELDS',
      });
    }

    const [result] = await db.query(
      'INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)',
      [name.trim(), email.trim(), subject.trim(), message.trim()]
    );

    if (transporter) {
      try {
        await transporter.sendMail({
          from: process.env.SMTP_FROM || 'noreply@equranacademy.com',
          to: email,
          subject: `We received your message: ${subject}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2e7d32;">Thank You, ${name}!</h2>
              <p>We received your message and will get back to you as soon as possible.</p>
              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Your Message Summary:</h3>
                <p><strong>Subject:</strong> ${subject}</p>
                <p><strong>Message:</strong></p>
                <p>${message.replace(/\n/g, '<br>')}</p>
              </div>
              <p>Best regards,<br><strong>E-Quran Academy Team</strong></p>
            </div>
          `,
        });
        await db.query('UPDATE contact_messages SET email_sent = 1 WHERE id = ?', [result.insertId]);
      } catch (emailError) {
        logger.error('Contact confirmation email failed:', emailError.message);
      }
    }

    sendResponse(res, 201, { contactId: result.insertId }, 'Your message has been received! We will contact you soon.');
  } catch (error) {
    next(error);
  }
});

router.get('/admin/messages', verifyToken, requireRole('admin'), contactController.getAllMessages);
router.get('/admin/messages/stats', verifyToken, requireRole('admin'), contactController.getMessageStats);
router.get('/admin/messages/:id', verifyToken, requireRole('admin'), contactController.getMessageById);
router.put('/admin/messages/:id/status', verifyToken, requireRole('admin'), contactController.updateMessageStatus);
router.post('/admin/messages/:id/reply', verifyToken, requireRole('admin'), contactController.replyToMessage);
router.delete('/admin/messages/:id', verifyToken, requireRole('admin'), contactController.deleteMessage);

module.exports = router;
