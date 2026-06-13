import React, { useEffect, useState } from 'react';
import apiFetch from '../api/client';

export default function History() {
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState('');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    apiFetch('/transactions/history')
      .then(setTransactions)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div>
      <h2>Transaction History</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {transactions.length === 0 && <p>No transactions yet.</p>}

      <table border="1" cellPadding="5">
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Direction</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Note</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => {
            const isSender = tx.sender_id === user.id;
            const direction = tx.type === 'deposit'
              ? 'Deposit'
              : tx.type === 'withdrawal'
                ? 'Withdrawal'
                : isSender ? `To ${tx.receiver_email}` : `From ${tx.sender_email}`;

            return (
              <tr key={tx.id}>
                <td>{new Date(tx.created_at).toLocaleString()}</td>
                <td>{tx.type}</td>
                <td>{direction}</td>
                <td>{(isSender && tx.type === 'transfer' ? '-' : '+')}{(tx.amount_cents / 100).toFixed(2)}</td>
                <td>{tx.status}</td>
                <td>{tx.note || '-'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
