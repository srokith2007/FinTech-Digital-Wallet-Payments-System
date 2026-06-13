// Run with: node config/initDb.js
require('dotenv').config();
const pool = require('./db');

const SQL = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  two_fa_secret VARCHAR(255),
  two_fa_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) UNIQUE,
  balance_cents BIGINT DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'USD',
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER REFERENCES users(id),
  receiver_id INTEGER REFERENCES users(id),
  amount_cents BIGINT NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'transfer', -- transfer, deposit, withdrawal
  status VARCHAR(20) NOT NULL DEFAULT 'completed', -- completed, flagged, failed
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fraud_alerts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  transaction_id INTEGER REFERENCES transactions(id),
  reason VARCHAR(255) NOT NULL,
  severity VARCHAR(20) DEFAULT 'medium', -- low, medium, high
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
`;

async function init() {
  try {
    await pool.query(SQL);
    console.log('Database initialized successfully.');
  } catch (err) {
    console.error('Error initializing database:', err);
  } finally {
    await pool.end();
  }
}

init();
