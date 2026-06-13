const express = require('express');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');
const { checkFraud } = require('../models/fraud');

const router = express.Router();

router.use(authMiddleware);

// Send money to another user (by email)
router.post('/send', async (req, res) => {
  const { receiver_email, amount_cents, note } = req.body;

  if (!receiver_email || !amount_cents || amount_cents <= 0) {
    return res.status(400).json({ error: 'receiver_email and a positive amount_cents are required' });
  }

  // Find receiver
  const receiverResult = await pool.query('SELECT id FROM users WHERE email=$1', [receiver_email]);
  if (receiverResult.rows.length === 0) {
    return res.status(404).json({ error: 'Receiver not found' });
  }
  const receiverId = receiverResult.rows[0].id;

  if (receiverId === req.userId) {
    return res.status(400).json({ error: 'Cannot send money to yourself' });
  }

  // Check sender balance
  const senderWallet = await pool.query('SELECT balance_cents FROM wallets WHERE user_id=$1', [req.userId]);
  if (senderWallet.rows.length === 0) {
    return res.status(404).json({ error: 'Sender wallet not found' });
  }
  if (senderWallet.rows[0].balance_cents < amount_cents) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }

  // Run fraud checks before completing the transaction
  const fraudFlags = await checkFraud({ senderId: req.userId, amountCents: amount_cents });
  const status = fraudFlags.length > 0 ? 'flagged' : 'completed';

  // Move funds (still process even if flagged, per simple rule-based demo)
  await pool.query('UPDATE wallets SET balance_cents = balance_cents - $1, updated_at=NOW() WHERE user_id=$2', [
    amount_cents,
    req.userId,
  ]);
  await pool.query('UPDATE wallets SET balance_cents = balance_cents + $1, updated_at=NOW() WHERE user_id=$2', [
    amount_cents,
    receiverId,
  ]);

  const tx = await pool.query(
    `INSERT INTO transactions (sender_id, receiver_id, amount_cents, type, status, note)
     VALUES ($1, $2, $3, 'transfer', $4, $5) RETURNING *`,
    [req.userId, receiverId, amount_cents, status, note || null]
  );

  // Save any fraud alerts
  for (const flag of fraudFlags) {
    await pool.query(
      `INSERT INTO fraud_alerts (user_id, transaction_id, reason, severity)
       VALUES ($1, $2, $3, $4)`,
      [req.userId, tx.rows[0].id, flag.reason, flag.severity]
    );
  }

  res.status(201).json({ transaction: tx.rows[0], fraud_flags: fraudFlags });
});

// Get transaction history for current user
router.get('/history', async (req, res) => {
  const result = await pool.query(
    `SELECT t.*, su.email as sender_email, ru.email as receiver_email
     FROM transactions t
     LEFT JOIN users su ON su.id = t.sender_id
     LEFT JOIN users ru ON ru.id = t.receiver_id
     WHERE t.sender_id=$1 OR t.receiver_id=$1
     ORDER BY t.created_at DESC`,
    [req.userId]
  );

  res.status(200).json(result.rows);
});

module.exports = router;
