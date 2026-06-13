import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiFetch from '../api/client';

export default function Verify2FA() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const userId = location.state?.user_id;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!userId) {
      setError('Missing user context. Please login again.');
      return;
    }

    try {
      const data = await apiFetch('/auth/login/verify-2fa', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, code }),
      });

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h2>Two-Factor Verification</h2>
      <p>Enter the 6-digit code from your authenticator app.</p>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Code: </label>
          <input value={code} onChange={(e) => setCode(e.target.value)} required maxLength={6} />
        </div>
        <button type="submit">Verify</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
