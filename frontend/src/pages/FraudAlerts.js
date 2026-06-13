import React, { useEffect, useState } from 'react';
import apiFetch from '../api/client';

export default function FraudAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState('');

  function load() {
    apiFetch('/fraud-alerts')
      .then(setAlerts)
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleResolve(id) {
    try {
      await apiFetch(`/fraud-alerts/${id}/resolve`, { method: 'POST' });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h2>Fraud Alerts</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {alerts.length === 0 && <p>No fraud alerts.</p>}

      <table border="1" cellPadding="5">
        <thead>
          <tr>
            <th>Date</th>
            <th>Transaction ID</th>
            <th>Reason</th>
            <th>Severity</th>
            <th>Resolved</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {alerts.map((a) => (
            <tr key={a.id}>
              <td>{new Date(a.created_at).toLocaleString()}</td>
              <td>{a.transaction_id}</td>
              <td>{a.reason}</td>
              <td>{a.severity}</td>
              <td>{a.resolved ? 'Yes' : 'No'}</td>
              <td>
                {!a.resolved && <button onClick={() => handleResolve(a.id)}>Mark Resolved</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
