import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../api';
import './pages.css';

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
    <div className="auth-container">
      {/* Image Side */}
      <div className="auth-image-side login-bg">
        <h1 className="auth-image-title">Welcome<br/>Back.</h1>
        <p className="auth-image-subtitle">
          Log in to access your exclusive bookings and premium hotel features. Your next stay awaits.
        </p>
      </div>
      
      {/* Form Side */}
      <div className="auth-form-side">
        <div className="auth-form-wrapper">
          <h2 className="auth-title">Sign In</h2>
          <p className="auth-subtitle">Please enter your credentials to continue.</p>
          
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                className="input-field form-input"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label className="form-label">Password</label>
              <input
                className="input-field form-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}>Login to Account</button>
          </form>
          
          <div className="auth-footer">
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
