const express = require('express');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// Get fraud alerts for current user
router.get('/', async (req, res) => {
  const result = await pool.query(
    `SELECT * FROM fraud_alerts WHERE user_id=$1 ORDER BY created_at DESC`,
    [req.userId]
  );
  res.status(200).json(result.rows);
});

// Mark alert as resolved
router.post('/:id/resolve', async (req, res) => {
  const { id } = req.params;
  await pool.query('UPDATE fraud_alerts SET resolved=TRUE WHERE id=$1 AND user_id=$2', [id, req.userId]);
  res.status(200).json({ success: true });
});

module.exports = router;
