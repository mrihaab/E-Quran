const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { verifyToken } = require('../middleware/auth');
const authGuard = require('../middleware/authGuard');
const approvalMiddleware = require('../middleware/approvalMiddleware');

// STRIPE
router.post('/stripe/create-session', verifyToken, authGuard, approvalMiddleware, paymentController.createStripeSession);
router.post('/stripe/verify', verifyToken, authGuard, approvalMiddleware, paymentController.verifyStripePayment);

// LOCAL PROVIDERS (Placeholders)
router.post('/jazzcash/initiate', verifyToken, authGuard, approvalMiddleware, paymentController.initiateJazzCash);
router.post('/easypaisa/initiate', verifyToken, authGuard, approvalMiddleware, paymentController.initiateEasyPaisa);

// HISTORY
router.get('/history', verifyToken, authGuard, approvalMiddleware, paymentController.getPaymentHistory);

module.exports = router;
