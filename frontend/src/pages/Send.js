import React, { useState } from 'react';
import apiFetch from '../api/client';

export default function Send() {
  const [receiverEmail, setReceiverEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const cents = Math.round(parseFloat(amount) * 100);
      const data = await apiFetch('/transactions/send', {
        method: 'POST',
        body: JSON.stringify({ receiver_email: receiverEmail, amount_cents: cents, note }),
      });

      if (data.fraud_flags && data.fraud_flags.length > 0) {
        setMessage(`Payment sent, but flagged for review: ${data.fraud_flags.map((f) => f.reason).join(', ')}`);
      } else {
        setMessage('Payment sent successfully.');
      }

      setReceiverEmail('');
      setAmount('');
      setNote('');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h2>Send Money</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Recipient Email: </label>
          <input type="email" value={receiverEmail} onChange={(e) => setReceiverEmail(e.target.value)} required />
        </div>
        <div>
          <label>Amount (USD): </label>
          <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </div>
        <div>
          <label>Note (optional): </label>
          <input value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <button type="submit">Send</button>
      </form>
      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
