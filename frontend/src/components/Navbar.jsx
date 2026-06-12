import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, UserCircle, LogOut, Sparkles } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem('access');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <nav className="nav-bar">
      <Link to="/" style={{ textDecoration: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <img src="/smart-bookingIcon.png" alt="SmartBooking Logo" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
        <h2 style={{ margin: 0 }}>SmartBooking</h2>
      </Link>
      <div className="nav-links">
        {isAuthenticated && (
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-chatbot-fullscreen'))}
            style={{ background: 'linear-gradient(135deg, var(--color-1) 0%, var(--color-3) 100%)', color: 'white', border: 'none', padding: '0.45rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          >
            <Sparkles size={18} /> Agent First
          </button>
        )}
        <Link to="/cities">Explore Cities</Link>
        <Link to="/hotels">Explore Hotels</Link>
        {isAuthenticated ? (
          <>
            {user.is_staff && <Link to="/admin">Dashboard</Link>}
            <Link to="/profile">Profile</Link>
            <button onClick={handleLogout} className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>
              <LogOut size={18} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register" className="btn-secondary" style={{ textDecoration: 'none' }}>Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
