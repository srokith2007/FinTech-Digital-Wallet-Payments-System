const express = require('express');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// Summary stats: totals sent, received, deposits, withdrawals
router.get('/summary', async (req, res) => {
  const sent = await pool.query(
    `SELECT COALESCE(SUM(amount_cents),0) as total, COUNT(*) as count
     FROM transactions WHERE sender_id=$1 AND type='transfer'`,
    [req.userId]
  );

  const received = await pool.query(
    `SELECT COALESCE(SUM(amount_cents),0) as total, COUNT(*) as count
     FROM transactions WHERE receiver_id=$1 AND type='transfer'`,
    [req.userId]
  );

  const deposits = await pool.query(
    `SELECT COALESCE(SUM(amount_cents),0) as total, COUNT(*) as count
     FROM transactions WHERE receiver_id=$1 AND type='deposit'`,
    [req.userId]
  );

  const withdrawals = await pool.query(
    `SELECT COALESCE(SUM(amount_cents),0) as total, COUNT(*) as count
     FROM transactions WHERE sender_id=$1 AND type='withdrawal'`,
    [req.userId]
  );

  res.status(200).json({
    sent: sent.rows[0],
    received: received.rows[0],
    deposits: deposits.rows[0],
    withdrawals: withdrawals.rows[0],
  });
});

// Monthly spending breakdown (last 6 months)
router.get('/monthly', async (req, res) => {
  const result = await pool.query(
    `SELECT TO_CHAR(created_at, 'YYYY-MM') as month,
            SUM(CASE WHEN sender_id=$1 THEN amount_cents ELSE 0 END) as sent_cents,
            SUM(CASE WHEN receiver_id=$1 THEN amount_cents ELSE 0 END) as received_cents
     FROM transactions
     WHERE (sender_id=$1 OR receiver_id=$1) AND created_at > NOW() - INTERVAL '6 months'
     GROUP BY month
     ORDER BY month ASC`,
    [req.userId]
  );

  res.status(200).json(result.rows);
});

module.exports = router;
