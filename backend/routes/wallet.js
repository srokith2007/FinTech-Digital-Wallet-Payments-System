const express = require('express');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// Get wallet balance
router.get('/balance', async (req, res) => {
  const result = await pool.query('SELECT balance_cents, currency FROM wallets WHERE user_id=$1', [req.userId]);
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Wallet not found' });
  }
  res.status(200).json(result.rows[0]);
});

// Deposit funds (simulated - no real payment gateway call)
router.post('/deposit', async (req, res) => {
  const { amount_cents } = req.body;
  if (!amount_cents || amount_cents <= 0) {
    return res.status(400).json({ error: 'amount_cents must be a positive number' });
  }

  await pool.query('UPDATE wallets SET balance_cents = balance_cents + $1, updated_at=NOW() WHERE user_id=$2', [
    amount_cents,
    req.userId,
  ]);

  const tx = await pool.query(
    `INSERT INTO transactions (sender_id, receiver_id, amount_cents, type, status)
     VALUES (NULL, $1, $2, 'deposit', 'completed') RETURNING *`,
    [req.userId, amount_cents]
  );

  res.status(201).json(tx.rows[0]);
});

// Withdraw funds (simulated)
router.post('/withdraw', async (req, res) => {
  const { amount_cents } = req.body;
  if (!amount_cents || amount_cents <= 0) {
    return res.status(400).json({ error: 'amount_cents must be a positive number' });
  }

  const wallet = await pool.query('SELECT balance_cents FROM wallets WHERE user_id=$1', [req.userId]);
  if (wallet.rows.length === 0) {
    return res.status(404).json({ error: 'Wallet not found' });
  }

  if (wallet.rows[0].balance_cents < amount_cents) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }

  await pool.query('UPDATE wallets SET balance_cents = balance_cents - $1, updated_at=NOW() WHERE user_id=$2', [
    amount_cents,
    req.userId,
  ]);

  const tx = await pool.query(
    `INSERT INTO transactions (sender_id, receiver_id, amount_cents, type, status)
     VALUES ($1, NULL, $2, 'withdrawal', 'completed') RETURNING *`,
    [req.userId, amount_cents]
  );

  res.status(201).json(tx.rows[0]);
});

module.exports = router;
