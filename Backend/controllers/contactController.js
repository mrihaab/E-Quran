const db = require('../config/db');
const { sendResponse } = require('../utils/responseHandler');
const { ApiError } = require('../middleware/errorMiddleware');
const { getPaginatedRes } = require('../utils/paginate');
const logger = require('../utils/logger');

/**
 * GET ALL CONTACT MESSAGES - Admin only
 */
exports.getAllMessages = async (req, res, next) => {
  try {
    const { page, limit, status } = req.query;

    let query = `
      SELECT id, name, email, subject, message, status, email_sent, created_at, updated_at
      FROM contact_messages
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }

    query += ` ORDER BY created_at DESC`;

    const result = await getPaginatedRes(query, params, page, limit);
    
    logger.info(`Admin fetched contact messages: ${result.data.length} records`);
    sendResponse(res, 200, result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET SINGLE CONTACT MESSAGE
 */
exports.getMessageById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [messages] = await db.query(
      'SELECT * FROM contact_messages WHERE id = ?',
      [id]
    );

    if (messages.length === 0) {
      throw new ApiError(404, 'Contact message not found.');
    }

    // Mark as read when viewed
    if (messages[0].status === 'new') {
      await db.query(
        "UPDATE contact_messages SET status = 'read' WHERE id = ?",
        [id]
      );
    }

    sendResponse(res, 200, messages[0]);
  } catch (error) {
    next(error);
  }
};

/**
 * UPDATE CONTACT MESSAGE STATUS
 */
exports.updateMessageStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    if (!status) {
      throw new ApiError(400, 'Status is required.');
    }

    const validStatuses = ['new', 'read', 'in_progress', 'resolved', 'archived'];
    if (!validStatuses.includes(status)) {
      throw new ApiError(400, `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    await db.query(
      'UPDATE contact_messages SET status = ?, admin_notes = ? WHERE id = ?',
      [status, adminNotes || null, id]
    );

    logger.info(`Contact message ${id} status updated to: ${status}`);
    sendResponse(res, 200, {}, 'Message status updated successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE CONTACT MESSAGE
 */
exports.deleteMessage = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      'DELETE FROM contact_messages WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      throw new ApiError(404, 'Contact message not found.');
    }

    logger.info(`Contact message ${id} deleted`);
    sendResponse(res, 200, {}, 'Message deleted successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * GET MESSAGE STATISTICS
 */
exports.getMessageStats = async (req, res, next) => {
  try {
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new_count,
        SUM(CASE WHEN status = 'read' THEN 1 ELSE 0 END) as read_count,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_count,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_count
      FROM contact_messages
    `);

    sendResponse(res, 200, stats[0]);
  } catch (error) {
    next(error);
  }
};

/**
 * REPLY TO CONTACT MESSAGE (Send email reply)
 */
exports.replyToMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { replyMessage } = req.body;

    if (!replyMessage) {
      throw new ApiError(400, 'Reply message is required.');
    }

    const [messages] = await db.query(
      'SELECT email, name, subject FROM contact_messages WHERE id = ?',
      [id]
    );

    if (messages.length === 0) {
      throw new ApiError(404, 'Contact message not found.');
    }

    const { email, name, subject } = messages[0];

    // Import email service
    const { sendEmail } = require('../services/emailService');
    
    await sendEmail({
      to: email,
      subject: `Re: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #11d473;">Hello ${name},</h2>
          <p>Thank you for contacting E-Quran Academy. Here is our response:</p>
          <div style="background-color: #f0f0f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p>${replyMessage.replace(/\n/g, '<br>')}</p>
          </div>
          <p>Best regards,<br><strong>E-Quran Academy Team</strong></p>
        </div>
      `
    });

    // Update status to resolved
    await db.query(
      "UPDATE contact_messages SET status = 'resolved' WHERE id = ?",
      [id]
    );

    logger.info(`Reply sent to contact message ${id} - ${email}`);
    sendResponse(res, 200, {}, 'Reply sent successfully.');
  } catch (error) {
    next(error);
  }
};
