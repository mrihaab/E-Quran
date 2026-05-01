const db = require('../config/db');
const { sendResponse } = require('../utils/responseHandler');
const { ApiError } = require('../middleware/errorMiddleware');
const logger = require('../utils/logger');

let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  logger.info('Stripe payment gateway initialized');
}

exports.createStripeSession = async (req, res, next) => {
  try {
    const { amount, classId } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) throw new ApiError(400, 'A valid amount is required.', 'INVALID_AMOUNT');
    if (!classId) throw new ApiError(400, 'Class ID is required.', 'MISSING_CLASS_ID');

    const [classes] = await db.query(
      'SELECT id, name FROM classes WHERE id = ? AND is_deleted = 0',
      [classId]
    );
    if (classes.length === 0) {
      throw new ApiError(404, 'Class not found.', 'CLASS_NOT_FOUND');
    }

    if (!stripe) {
      logger.warn('Stripe not configured. Payment gateway unavailable.');
      throw new ApiError(503, 'Payment gateway is not configured. Please contact administration.', 'PAYMENT_NOT_CONFIGURED');
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: `Course Enrollment: ${classes[0].name}` },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-failed`,
      metadata: { userId: String(userId), classId: String(classId) }
    });

    sendResponse(res, 200, { sessionId: session.id, url: session.url });
  } catch (error) {
    next(error);
  }
};

exports.verifyStripePayment = async (req, res, next) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) throw new ApiError(400, 'Session ID is required.', 'MISSING_SESSION_ID');

    if (!stripe) {
      throw new ApiError(503, 'Payment gateway is not configured.', 'PAYMENT_NOT_CONFIGURED');
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status === 'paid') {
      const { userId, classId } = session.metadata;

      const [existing] = await db.query(
        'SELECT id FROM payments WHERE transaction_id = ?',
        [sessionId]
      );

      if (existing.length === 0) {
        await db.query(
          'INSERT INTO payments (payer_id, payee_id, amount, payment_method, status, transaction_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [userId, 0, session.amount_total / 100, 'Stripe', 'completed', sessionId, `Stripe Checkout Session`]
        );
      }

      sendResponse(res, 200, { status: 'completed' });
    } else {
      sendResponse(res, 200, { status: session.payment_status });
    }
  } catch (error) {
    next(error);
  }
};

exports.initiateJazzCash = async (req, res, next) => {
  try {
    throw new ApiError(503, 'JazzCash payment integration is not yet available.', 'FEATURE_UNAVAILABLE');
  } catch (error) {
    next(error);
  }
};

exports.initiateEasyPaisa = async (req, res, next) => {
  try {
    throw new ApiError(503, 'EasyPaisa payment integration is not yet available.', 'FEATURE_UNAVAILABLE');
  } catch (error) {
    next(error);
  }
};

exports.getPaymentHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [payments] = await db.query(
      `SELECT p.*, 
              payer.full_name AS payer_name,
              payee.full_name AS payee_name
       FROM payments p
       LEFT JOIN users payer ON p.payer_id = payer.id
       LEFT JOIN users payee ON p.payee_id = payee.id
       WHERE (p.payer_id = ? OR p.payee_id = ?) AND p.is_deleted = 0
       ORDER BY p.created_at DESC`,
      [userId, userId]
    );
    sendResponse(res, 200, payments);
  } catch (error) {
    next(error);
  }
};
