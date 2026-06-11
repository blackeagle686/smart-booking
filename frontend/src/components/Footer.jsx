import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Building2 } from 'lucide-react';

const Footer = () => {
  return (
    <footer style={{ backgroundColor: '#1e293b', color: '#f8fafc', padding: '4rem 2rem 2rem 2rem', marginTop: 'auto' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '3rem' }}>
        
        {/* Brand Section */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>
            <Building2 size={28} color="var(--color-1)" />
            <span>HotelBooking</span>
          </div>
          <p style={{ color: '#cbd5e1', lineHeight: '1.6', marginBottom: '1.5rem' }}>
            Discover the perfect stay anywhere in Egypt. We provide the best hotels with exclusive deals and unforgettable experiences.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 style={{ color: 'white', marginBottom: '1.5rem', fontSize: '1.1rem' }}>Quick Links</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <li><Link to="/" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Home</Link></li>
            <li><Link to="/hotels" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Explore Hotels</Link></li>
            <li><Link to="/login" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Sign In</Link></li>
            <li><Link to="/register" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Register</Link></li>
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h3 style={{ color: 'white', marginBottom: '1.5rem', fontSize: '1.1rem' }}>Contact Us</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', color: '#cbd5e1' }}>
              <MapPin size={20} style={{ color: 'var(--color-1)', flexShrink: 0 }} />
              <span>123 Booking Street, Cairo, Egypt</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#cbd5e1' }}>
              <Phone size={20} style={{ color: 'var(--color-1)', flexShrink: 0 }} />
              <span>+20 123 456 7890</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#cbd5e1' }}>
              <Mail size={20} style={{ color: 'var(--color-1)', flexShrink: 0 }} />
              <span>support@hotelbooking.com</span>
            </li>
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h3 style={{ color: 'white', marginBottom: '1.5rem', fontSize: '1.1rem' }}>Newsletter</h3>
          <p style={{ color: '#cbd5e1', marginBottom: '1rem' }}>Subscribe to get special offers and updates.</p>
          <form style={{ display: 'flex', gap: '0.5rem' }} onSubmit={(e) => e.preventDefault()}>
            <input 
              type="email" 
              placeholder="Your email address" 
              style={{ padding: '0.75rem', borderRadius: '4px', border: 'none', outline: 'none', width: '100%', backgroundColor: '#334155', color: 'white' }}
            />
            <button 
              type="submit" 
              style={{ padding: '0.75rem 1rem', borderRadius: '4px', border: 'none', backgroundColor: 'var(--color-1)', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Join
            </button>
          </form>
        </div>

      </div>

      <div style={{ maxWidth: '1200px', margin: '3rem auto 0 auto', paddingTop: '2rem', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', color: '#94a3b8', fontSize: '0.9rem' }}>
        <p style={{ margin: 0 }}>&copy; {new Date().getFullYear()} HotelBooking. All rights reserved.</p>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <span style={{ cursor: 'pointer' }}>Privacy Policy</span>
          <span style={{ cursor: 'pointer' }}>Terms of Service</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
