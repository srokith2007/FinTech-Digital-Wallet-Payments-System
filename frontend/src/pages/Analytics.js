import React, { useEffect, useState } from 'react';
import apiFetch from '../api/client';

export default function Analytics() {
  const [summary, setSummary] = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/analytics/summary').then(setSummary).catch((err) => setError(err.message));
    apiFetch('/analytics/monthly').then(setMonthly).catch((err) => setError(err.message));
  }, []);

  function fmt(cents) {
    return `$${(cents / 100).toFixed(2)}`;
  }

  return (
    <div>
      <h2>Payment Analytics</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {summary && (
        <table border="1" cellPadding="5">
          <thead>
            <tr><th>Category</th><th>Total Amount</th><th>Count</th></tr>
          </thead>
          <tbody>
            <tr><td>Sent</td><td>{fmt(summary.sent.total)}</td><td>{summary.sent.count}</td></tr>
            <tr><td>Received</td><td>{fmt(summary.received.total)}</td><td>{summary.received.count}</td></tr>
            <tr><td>Deposits</td><td>{fmt(summary.deposits.total)}</td><td>{summary.deposits.count}</td></tr>
            <tr><td>Withdrawals</td><td>{fmt(summary.withdrawals.total)}</td><td>{summary.withdrawals.count}</td></tr>
          </tbody>
        </table>
      )}

      <h3>Monthly Breakdown (last 6 months)</h3>
      {monthly.length === 0 && <p>No data yet.</p>}
      <table border="1" cellPadding="5">
        <thead>
          <tr><th>Month</th><th>Sent</th><th>Received</th></tr>
        </thead>
        <tbody>
          {monthly.map((m) => (
            <tr key={m.month}>
              <td>{m.month}</td>
              <td>{fmt(m.sent_cents)}</td>
              <td>{fmt(m.received_cents)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
