import React, { useState } from 'react';
import apiFetch from '../api/client';

export default function Security() {
  const [qrCode, setQrCode] = useState(null);
  const [secret, setSecret] = useState(null);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSetup() {
    setError('');
    try {
      const data = await apiFetch('/auth/2fa/setup', { method: 'POST' });
      setQrCode(data.qr_code);
      setSecret(data.secret);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleEnable(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await apiFetch('/auth/2fa/enable', {
        method: 'POST',
        body: JSON.stringify({ code }),
      });
      setMessage('2FA enabled successfully.');
      setCode('');
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDisable() {
    setError('');
    setMessage('');
    try {
      await apiFetch('/auth/2fa/disable', { method: 'POST' });
      setMessage('2FA disabled.');
      setQrCode(null);
      setSecret(null);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h2>Security Settings</h2>
      <h3>Two-Factor Authentication (2FA)</h3>

      <button onClick={handleSetup}>Set Up / Re-generate 2FA</button>{' '}
      <button onClick={handleDisable}>Disable 2FA</button>

      {qrCode && (
        <div style={{ marginTop: '15px' }}>
          <p>Scan this QR code with an authenticator app (e.g. Google Authenticator):</p>
          <img src={qrCode} alt="2FA QR Code" />
          <p>Or enter this secret manually: <code>{secret}</code></p>

          <form onSubmit={handleEnable}>
            <label>Enter the 6-digit code to confirm and enable 2FA: </label>
            <input value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} required />
            <button type="submit">Enable 2FA</button>
          </form>
        </div>
      )}

      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
