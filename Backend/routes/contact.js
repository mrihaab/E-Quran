const express = require('express');
const router = express.Router();
const db = require('../config/db');
const nodemailer = require('nodemailer');
const contactController = require('../controllers/contactController');
const { verifyToken } = require('../middleware/auth');

let transporter = null;

// Initialize email transporter
async function initEmail() {
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
  }
}
initEmail();

// ==================== SUBMIT CONTACT FORM ====================
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // Save to database
    const [result] = await db.query(
      'INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)',
      [name, email, subject, message]
    );

    // Try to send email if configured
    if (transporter) {
      try {
        await transporter.sendMail({
          from: process.env.SMTP_FROM || 'noreply@equranacademy.com',
          to: email,
          subject: `We received your message: ${subject}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #11d473;">Thank You, ${name}! 👋</h2>
              <p>We received your message and will get back to you as soon as possible.</p>
              <div style="background-color: #f0f0f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Your Message Summary:</h3>
                <p><strong>Subject:</strong> ${subject}</p>
                <p><strong>Message:</strong></p>
                <p>${message.replace(/\n/g, '<br>')}</p>
              </div>
              <p>Best regards,<br><strong>E-Quran Academy Team</strong></p>
            </div>
          `
        });

        await db.query('UPDATE contact_messages SET email_sent = 1 WHERE id = ?', [result.insertId]);
      } catch (emailError) {
        console.error('Email sending failed:', emailError.message);
      }
    }

    res.status(201).json({
      success: true,
      message: '✓ Your message has been received! We will contact you soon.',
      contactId: result.insertId
    });
  } catch (error) {
    console.error('Contact error:', error);
    res.status(500).json({ error: 'Failed to submit contact form.' });
  }
});

// ==================== ADMIN CRUD FOR CONTACT MESSAGES ====================
router.get('/admin/messages', verifyToken, contactController.getAllMessages);
router.get('/admin/messages/stats', verifyToken, contactController.getMessageStats);
router.get('/admin/messages/:id', verifyToken, contactController.getMessageById);
router.put('/admin/messages/:id/status', verifyToken, contactController.updateMessageStatus);
router.post('/admin/messages/:id/reply', verifyToken, contactController.replyToMessage);
router.delete('/admin/messages/:id', verifyToken, contactController.deleteMessage);

module.exports = router;
