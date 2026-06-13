import React from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Verify2FA from './pages/Verify2FA';
import Dashboard from './pages/Dashboard';
import Send from './pages/Send';
import History from './pages/History';
import FraudAlerts from './pages/FraudAlerts';
import Analytics from './pages/Analytics';
import Security from './pages/Security';

function isLoggedIn() {
  return !!localStorage.getItem('token');
}

function PrivateRoute({ children }) {
  return isLoggedIn() ? children : <Navigate to="/login" />;
}

function Nav() {
  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  return (
    <nav style={{ marginBottom: '20px', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
      {isLoggedIn() ? (
        <>
          <Link to="/" style={{ marginRight: '10px' }}>Dashboard</Link>
          <Link to="/send" style={{ marginRight: '10px' }}>Send Money</Link>
          <Link to="/history" style={{ marginRight: '10px' }}>History</Link>
          <Link to="/fraud-alerts" style={{ marginRight: '10px' }}>Fraud Alerts</Link>
          <Link to="/analytics" style={{ marginRight: '10px' }}>Analytics</Link>
          <Link to="/security" style={{ marginRight: '10px' }}>Security</Link>
          <button onClick={handleLogout}>Logout</button>
        </>
      ) : (
        <>
          <Link to="/login" style={{ marginRight: '10px' }}>Login</Link>
          <Link to="/register" style={{ marginRight: '10px' }}>Register</Link>
        </>
      )}
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        <h1>Digital Wallet</h1>
        <Nav />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-2fa" element={<Verify2FA />} />
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/send" element={<PrivateRoute><Send /></PrivateRoute>} />
          <Route path="/history" element={<PrivateRoute><History /></PrivateRoute>} />
          <Route path="/fraud-alerts" element={<PrivateRoute><FraudAlerts /></PrivateRoute>} />
          <Route path="/analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} />
          <Route path="/security" element={<PrivateRoute><Security /></PrivateRoute>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
