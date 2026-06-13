const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const pool = require('../config/db');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email, and password are required' });
  }

  const existing = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const result = await pool.query(
    'INSERT INTO users (name, email, password_hash) VALUES ($1,$2,$3) RETURNING id, name, email',
    [name, email, passwordHash]
  );

  const user = result.rows[0];

  // Create wallet for user with $0 balance
  await pool.query('INSERT INTO wallets (user_id, balance_cents) VALUES ($1, 0)', [user.id]);

  res.status(201).json({ user });
});

// Login - step 1 (email + password)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const result = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
  if (result.rows.length === 0) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const user = result.rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // If 2FA is enabled, do not return a full token yet
  if (user.two_fa_enabled) {
    return res.status(200).json({
      requires_2fa: true,
      user_id: user.id,
    });
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });
  res.status(200).json({
    token,
    user: { id: user.id, name: user.name, email: user.email },
  });
});

// Login - step 2 (verify 2FA code, issue token)
router.post('/login/verify-2fa', async (req, res) => {
  const { user_id, code } = req.body;
  if (!user_id || !code) {
    return res.status(400).json({ error: 'user_id and code are required' });
  }

  const result = await pool.query('SELECT * FROM users WHERE id=$1', [user_id]);
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'User not found' });
  }

  const user = result.rows[0];
  if (!user.two_fa_enabled || !user.two_fa_secret) {
    return res.status(400).json({ error: '2FA is not enabled for this user' });
  }

  const verified = speakeasy.totp.verify({
    secret: user.two_fa_secret,
    encoding: 'base32',
    token: code,
    window: 1,
  });

  if (!verified) {
    return res.status(401).json({ error: 'Invalid 2FA code' });
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });
  res.status(200).json({
    token,
    user: { id: user.id, name: user.name, email: user.email },
  });
});

// Setup 2FA - generates secret + QR code (requires auth)
router.post('/2fa/setup', async (req, res) => {
  const authMiddleware = require('../middleware/auth');
  authMiddleware(req, res, async () => {
    const secret = speakeasy.generateSecret({ name: `Wallet App (${req.userId})` });

    await pool.query('UPDATE users SET two_fa_secret=$1 WHERE id=$2', [secret.base32, req.userId]);

    const qrDataUrl = await qrcode.toDataURL(secret.otpauth_url);

    res.status(200).json({
      secret: secret.base32,
      qr_code: qrDataUrl,
    });
  });
});

// Enable 2FA - verify a code before turning it on (requires auth)
router.post('/2fa/enable', async (req, res) => {
  const authMiddleware = require('../middleware/auth');
  authMiddleware(req, res, async () => {
    const { code } = req.body;

    const result = await pool.query('SELECT two_fa_secret FROM users WHERE id=$1', [req.userId]);
    if (result.rows.length === 0 || !result.rows[0].two_fa_secret) {
      return res.status(400).json({ error: '2FA setup has not been started' });
    }

    const verified = speakeasy.totp.verify({
      secret: result.rows[0].two_fa_secret,
      encoding: 'base32',
      token: code,
      window: 1,
    });

    if (!verified) {
      return res.status(401).json({ error: 'Invalid 2FA code' });
    }

    await pool.query('UPDATE users SET two_fa_enabled=TRUE WHERE id=$1', [req.userId]);
    res.status(200).json({ success: true });
  });
});

// Disable 2FA (requires auth)
router.post('/2fa/disable', async (req, res) => {
  const authMiddleware = require('../middleware/auth');
  authMiddleware(req, res, async () => {
    await pool.query('UPDATE users SET two_fa_enabled=FALSE, two_fa_secret=NULL WHERE id=$1', [req.userId]);
    res.status(200).json({ success: true });
  });
});

module.exports = router;
