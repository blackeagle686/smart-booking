import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import './pages.css';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '', email: '', password: '', first_name: '', last_name: '', phone_number: ''
  });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('auth/register/', formData);
      localStorage.setItem('access', res.data.access);
      localStorage.setItem('refresh', res.data.refresh);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/');
    } catch (error) {
      alert('Registration failed. Please check your inputs.');
    }
  };

  return (
    <div className="auth-container">
      
      {/* Form Side */}
      <div className="auth-form-side">
        <div className="auth-form-wrapper register">
          <h2 className="auth-title">Create Account</h2>
          <p className="auth-subtitle">Sign up to book rooms and manage your reservations.</p>
          
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label className="form-label">First Name</label>
                <input className="input-field form-input" type="text" placeholder="John" onChange={(e) => setFormData({...formData, first_name: e.target.value})} />
              </div>
              <div style={{ flex: 1 }}>
                <label className="form-label">Last Name</label>
                <input className="input-field form-input" type="text" placeholder="Doe" onChange={(e) => setFormData({...formData, last_name: e.target.value})} />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Username *</label>
              <input className="input-field form-input" type="text" placeholder="johndoe123" required onChange={(e) => setFormData({...formData, username: e.target.value})} />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input className="input-field form-input" type="email" placeholder="john@example.com" required onChange={(e) => setFormData({...formData, email: e.target.value})} />
            </div>

            <div className="form-group">
              <label className="form-label">Password *</label>
              <input className="input-field form-input" type="password" placeholder="••••••••" required onChange={(e) => setFormData({...formData, password: e.target.value})} />
            </div>

            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label className="form-label">Phone Number (Vodafone Cash)</label>
              <input className="input-field form-input" type="text" placeholder="010XXXXXXXX" onChange={(e) => setFormData({...formData, phone_number: e.target.value})} />
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}>Register Account</button>
          </form>

          <div className="auth-footer">
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
              Already have an account? <Link to="/login" style={{ color: 'var(--color-1)', fontWeight: 'bold', textDecoration: 'none' }}>Login</Link>
            </p>
          </div>
        </div>
      </div>

      {/* Image Side */}
      <div className="auth-image-side register-bg">
        <h1 className="auth-image-title">Start Your<br/>Journey.</h1>
        <p className="auth-image-subtitle">
          Join us today to unlock the best resorts and exclusive travel experiences worldwide.
        </p>
      </div>
    </div>
  );
};

export default Register;
