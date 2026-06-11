import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

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
    <div style={{ display: 'flex', minHeight: '75vh', background: 'white', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
      
      {/* Form Side */}
      <div style={{ flex: 1, padding: '4rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ maxWidth: '450px', width: '100%', margin: '0 auto' }}>
          <h2 style={{ marginBottom: '0.5rem', fontSize: '2rem' }}>Create Account</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Sign up to book rooms and manage your reservations.</p>
          
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.95rem' }}>First Name</label>
                <input className="input-field" type="text" placeholder="John" onChange={(e) => setFormData({...formData, first_name: e.target.value})} style={{ background: 'white', marginBottom: 0 }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.95rem' }}>Last Name</label>
                <input className="input-field" type="text" placeholder="Doe" onChange={(e) => setFormData({...formData, last_name: e.target.value})} style={{ background: 'white', marginBottom: 0 }} />
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.95rem' }}>Username *</label>
              <input className="input-field" type="text" placeholder="johndoe123" required onChange={(e) => setFormData({...formData, username: e.target.value})} style={{ background: 'white', marginBottom: 0 }} />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.95rem' }}>Email Address *</label>
              <input className="input-field" type="email" placeholder="john@example.com" required onChange={(e) => setFormData({...formData, email: e.target.value})} style={{ background: 'white', marginBottom: 0 }} />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.95rem' }}>Password *</label>
              <input className="input-field" type="password" placeholder="••••••••" required onChange={(e) => setFormData({...formData, password: e.target.value})} style={{ background: 'white', marginBottom: 0 }} />
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.95rem' }}>Phone Number (Vodafone Cash)</label>
              <input className="input-field" type="text" placeholder="010XXXXXXXX" onChange={(e) => setFormData({...formData, phone_number: e.target.value})} style={{ background: 'white', marginBottom: 0 }} />
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}>Register Account</button>
          </form>

          <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
              Already have an account? <Link to="/login" style={{ color: 'var(--color-1)', fontWeight: 'bold', textDecoration: 'none' }}>Login</Link>
            </p>
          </div>
        </div>
      </div>

      {/* Image Side */}
      <div style={{ flex: 1.2, background: `linear-gradient(to bottom, rgba(30, 41, 59, 0.2), rgba(15, 23, 42, 0.8)), url('/register-bg.png') center/cover no-repeat`, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '4rem', color: 'white' }}>
        <h1 style={{ margin: '0 0 1rem 0', fontSize: '3.5rem', fontWeight: '800', letterSpacing: '-1px', textShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>Start Your<br/>Journey.</h1>
        <p style={{ fontSize: '1.2rem', margin: 0, textShadow: '0 2px 8px rgba(0,0,0,0.4)', opacity: 0.9, lineHeight: 1.6 }}>
          Join us today to unlock the best resorts and exclusive travel experiences worldwide.
        </p>
      </div>
    </div>
  );
};

export default Register;
