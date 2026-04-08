const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// ==================== CREATE PAYMENT ====================
router.post('/', verifyToken, async (req, res) => {
  try {
    const { payeeId, amount, paymentMethod, notes } = req.body;

    if (!payeeId || !amount) {
      return res.status(400).json({ error: 'payeeId and amount are required.' });
    }

    if (parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0.' });
    }

    const [result] = await db.query(
      `INSERT INTO payments (payer_id, payee_id, amount, payment_method, notes, status)
       VALUES (?, ?, ?, ?, ?, 'completed')`,
      [req.user.id, payeeId, amount, paymentMethod || 'Credit Card', notes || null]
    );

    res.status(201).json({
      message: 'Payment submitted successfully.',
      paymentId: result.insertId
    });
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ error: 'Failed to process payment.' });
  }
});

// ==================== GET PAYMENT HISTORY (payer) ====================
router.get('/user/:userId', verifyToken, async (req, res) => {
  try {
    const [payments] = await db.query(
      `SELECT p.*, 
              payer.full_name as payer_name,
              payee.full_name as payee_name
       FROM payments p
       JOIN users payer ON p.payer_id = payer.id
       JOIN users payee ON p.payee_id = payee.id
       WHERE p.payer_id = ?
       ORDER BY p.created_at DESC`,
      [req.params.userId]
    );

    res.json({ payments });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Failed to fetch payment history.' });
  }
});

// ==================== GET RECEIVED PAYMENTS (teacher) ====================
router.get('/received/:teacherId', verifyToken, async (req, res) => {
  try {
    const [payments] = await db.query(
      `SELECT p.*, 
              payer.full_name as payer_name, payer.email as payer_email,
              payee.full_name as payee_name
       FROM payments p
       JOIN users payer ON p.payer_id = payer.id
       JOIN users payee ON p.payee_id = payee.id
       WHERE p.payee_id = ?
       ORDER BY p.created_at DESC`,
      [req.params.teacherId]
    );

    // Calculate total received
    const totalReceived = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

    res.json({ payments, totalReceived });
  } catch (error) {
    console.error('Get received payments error:', error);
    res.status(500).json({ error: 'Failed to fetch received payments.' });
  }
});

module.exports = router;
