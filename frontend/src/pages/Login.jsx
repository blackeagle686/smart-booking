import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../api';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('auth/login/', { username, password });
      localStorage.setItem('access', res.data.access);
      localStorage.setItem('refresh', res.data.refresh);
      // Fetch user profile
      const profileRes = await api.get('auth/profile/', {
        headers: { Authorization: `Bearer ${res.data.access}` }
      });
      localStorage.setItem('user', JSON.stringify(profileRes.data));
      
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (error) {
      alert('Login failed. Please check your credentials.');
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '75vh', background: 'white', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
      {/* Image Side */}
      <div style={{ flex: 1.2, background: `linear-gradient(to bottom, rgba(30, 41, 59, 0.2), rgba(15, 23, 42, 0.8)), url('/login-bg.png') center/cover no-repeat`, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '4rem', color: 'white' }}>
        <h1 style={{ margin: '0 0 1rem 0', fontSize: '3.5rem', fontWeight: '800', letterSpacing: '-1px', textShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>Welcome<br/>Back.</h1>
        <p style={{ fontSize: '1.2rem', margin: 0, textShadow: '0 2px 8px rgba(0,0,0,0.4)', opacity: 0.9, lineHeight: 1.6 }}>
          Log in to access your exclusive bookings and premium hotel features. Your next stay awaits.
        </p>
      </div>
      
      {/* Form Side */}
      <div style={{ flex: 1, padding: '4rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ maxWidth: '400px', width: '100%', margin: '0 auto' }}>
          <h2 style={{ marginBottom: '0.5rem', fontSize: '2rem' }}>Sign In</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Please enter your credentials to continue.</p>
          
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.95rem' }}>Username</label>
              <input
                className="input-field"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ background: 'white' }}
                required
              />
            </div>
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.95rem' }}>Password</label>
              <input
                className="input-field"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ background: 'white' }}
                required
              />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}>Login to Account</button>
          </form>
          
          <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
              Don't have an account? <Link to="/register" style={{ color: 'var(--color-1)', fontWeight: 'bold', textDecoration: 'none' }}>Sign up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
