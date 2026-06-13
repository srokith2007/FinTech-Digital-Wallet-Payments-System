const pool = require('../config/db');

// Very basic rule-based fraud detection.
// Returns an array of { reason, severity } if any rules are triggered.
async function checkFraud({ senderId, amountCents }) {
  const alerts = [];

  // Rule 1: Large transaction (over $1000)
  if (amountCents >= 100000) {
    alerts.push({ reason: 'Large transaction amount (over $1000)', severity: 'high' });
  }

  // Rule 2: Too many transactions in the last 10 minutes
  const recent = await pool.query(
    `SELECT COUNT(*) FROM transactions
     WHERE sender_id = $1 AND created_at > NOW() - INTERVAL '10 minutes'`,
    [senderId]
  );
  if (parseInt(recent.rows[0].count, 10) >= 5) {
    alerts.push({ reason: 'High transaction frequency (5+ in 10 minutes)', severity: 'medium' });
  }

  // Rule 3: Sending more than current balance shouldn't even get here,
  // but flag exact-balance-drain transactions as a precaution
  const wallet = await pool.query('SELECT balance_cents FROM wallets WHERE user_id=$1', [senderId]);
  if (wallet.rows.length > 0 && wallet.rows[0].balance_cents === amountCents && amountCents > 0) {
    alerts.push({ reason: 'Transaction empties entire wallet balance', severity: 'low' });
  }

  return alerts;
}

module.exports = { checkFraud };
