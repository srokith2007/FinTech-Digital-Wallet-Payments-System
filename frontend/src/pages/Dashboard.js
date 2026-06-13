import React, { useEffect, useState } from 'react';
import apiFetch from '../api/client';

export default function Dashboard() {
  const [balance, setBalance] = useState(null);
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  async function loadBalance() {
    try {
      const data = await apiFetch('/wallet/balance');
      setBalance(data);
    } catch (err) {
      setMessage(err.message);
    }
  }

  useEffect(() => {
    loadBalance();
  }, []);

  async function handleDeposit(e) {
    e.preventDefault();
    setMessage('');
    try {
      const cents = Math.round(parseFloat(amount) * 100);
      await apiFetch('/wallet/deposit', {
        method: 'POST',
        body: JSON.stringify({ amount_cents: cents }),
      });
      setMessage('Deposit successful.');
      setAmount('');
      loadBalance();
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function handleWithdraw(e) {
    e.preventDefault();
    setMessage('');
    try {
      const cents = Math.round(parseFloat(amount) * 100);
      await apiFetch('/wallet/withdraw', {
        method: 'POST',
        body: JSON.stringify({ amount_cents: cents }),
      });
      setMessage('Withdrawal successful.');
      setAmount('');
      loadBalance();
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <div>
      <h2>Welcome, {user.name || 'User'}</h2>

      <h3>Wallet Balance</h3>
      {balance ? (
        <p style={{ fontSize: '24px' }}>
          {(balance.balance_cents / 100).toFixed(2)} {balance.currency}
        </p>
      ) : (
        <p>Loading...</p>
      )}

      <h3>Deposit / Withdraw</h3>
      <form>
        <div>
          <label>Amount (USD): </label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <button onClick={handleDeposit}>Deposit</button>{' '}
        <button onClick={handleWithdraw}>Withdraw</button>
      </form>

      {message && <p>{message}</p>}
    </div>
  );
}
