# FinTech Digital Wallet & Payments System

A minimal peer-to-peer digital wallet built with React, Node.js/Express, and PostgreSQL.
Plain HTML elements, no CSS framework — beginner-style project.

## Features
- Wallet balance, deposits & withdrawals (simulated, no real payment gateway integration)
- Send money to other users by email
- Transaction history
- Two-factor authentication (TOTP, via Google Authenticator-compatible apps)
- Basic rule-based fraud detection alerts (large amounts, high frequency, balance-draining transfers)
- Payment analytics (totals + monthly breakdown)

## Project Structure
```
backend/   - Express API server
frontend/  - React app
```

## Backend Setup

1. ```
   cd backend
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in:
   - `DATABASE_URL` - PostgreSQL connection string
   - `JWT_SECRET` - any long random string
3. Initialize the database:
   ```
   npm run db:init
   ```
4. Start the server:
   ```
   npm start
   ```
   API runs on `http://localhost:5000`.

## Frontend Setup

1. ```
   cd frontend
   npm install
   ```
2. Copy `.env.example` to `.env` (defaults to `http://localhost:5000/api`).
3. Start the app:
   ```
   npm start
   ```
   App runs on `http://localhost:3000`.

## Usage
1. Register a new account (this also creates a $0 wallet).
2. Login.
3. From the Dashboard, deposit funds (simulated).
4. Use "Send Money" to transfer to another registered user by email.
5. View "History" for transaction logs, "Fraud Alerts" for flagged transactions,
   and "Analytics" for summary stats.
6. Go to "Security" to set up 2FA (scan QR code with an authenticator app).

## Fraud Detection Rules (simple, rule-based)
- Transaction amount >= $1000 → high severity
- 5+ transactions from same user within 10 minutes → medium severity
- Transaction that empties the entire wallet balance → low severity

Flagged transactions still complete but are logged in `fraud_alerts` for review.

## Notes
- No real payment gateway is integrated; deposits/withdrawals directly adjust the wallet balance for demo purposes.
- Passwords are hashed with bcrypt; JWT used for session auth.
