const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { verifyToken } = require('../middleware/auth');

// STRIPE
router.post('/stripe/create-session', verifyToken, paymentController.createStripeSession);
router.post('/stripe/verify', verifyToken, paymentController.verifyStripePayment);

// LOCAL PROVIDERS (Placeholders)
router.post('/jazzcash/initiate', verifyToken, paymentController.initiateJazzCash);
router.post('/easypaisa/initiate', verifyToken, paymentController.initiateEasyPaisa);

// HISTORY
router.get('/history', verifyToken, paymentController.getPaymentHistory);

module.exports = router;
