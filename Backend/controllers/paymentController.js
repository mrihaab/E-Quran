const db = require('../config/db');
const { sendResponse } = require('../utils/responseHandler');
const { ApiError } = require('../middleware/errorMiddleware');
const logger = require('../utils/logger');

// Initialize Stripe only if API key is available
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
}

/**
 * STRIPE: CREATE CHECKOUT SESSION
 */
exports.createStripeSession = async (req, res, next) => {
  try {
    const { amount, classId } = req.body;
    const userId = req.user.id;

    if (!amount || !classId) throw new ApiError(400, 'Amount and classId are required.');

    if (!stripe || !process.env.STRIPE_SECRET_KEY) {
      logger.warn('STRIPE_SECRET_KEY missing. Simulating payment.');
      return sendResponse(res, 200, { sessionId: 'mock_session_id', url: `${process.env.FRONTEND_URL}/payment-success?mock=true` });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: `Course Enrollment: ${classId}` },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-failed`,
      metadata: { userId, classId }
    });

    sendResponse(res, 200, { sessionId: session.id, url: session.url });
  } catch (error) {
    next(error);
  }
};

/**
 * STRIPE: WEBHOOK / VERIFY PAYMENT
 */
exports.verifyStripePayment = async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    
    // In production, we'd use Stripe Webhooks. 
    // Here we'll do a manual verification pull for simplicity/portability
    if (!stripe || !process.env.STRIPE_SECRET_KEY) {
       // Mock success
       return sendResponse(res, 200, { status: 'completed' });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status === 'paid') {
      // Record in DB
      const { userId, classId } = session.metadata;
      await db.query(
        'INSERT INTO payments (payer_id, payee_id, amount, payment_method, status, notes) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, 0, session.amount_total / 100, 'Credit Card', 'completed', `Stripe Session: ${sessionId}`]
      );
      
      sendResponse(res, 200, { status: 'completed' });
    } else {
      sendResponse(res, 400, { status: 'failed' });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * PLACEHOLDER: JAZZCASH HANDLER
 */
exports.initiateJazzCash = async (req, res, next) => {
  try {
    // This is a placeholder for future integration
    sendResponse(res, 200, { message: 'JazzCash integration coming soon.' }, 'FEATURE_LOCKED');
  } catch (error) {
    next(error);
  }
};

/**
 * PLACEHOLDER: EASYPAISA HANDLER
 */
exports.initiateEasyPaisa = async (req, res, next) => {
  try {
    // This is a placeholder for future integration
    sendResponse(res, 200, { message: 'EasyPaisa integration coming soon.' }, 'FEATURE_LOCKED');
  } catch (error) {
    next(error);
  }
};

/**
 * GET PAYMENT HISTORY
 */
exports.getPaymentHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [payments] = await db.query(
      'SELECT * FROM payments WHERE payer_id = ? OR payee_id = ? ORDER BY created_at DESC',
      [userId, userId]
    );
    sendResponse(res, 200, payments);
  } catch (error) {
    next(error);
  }
};
