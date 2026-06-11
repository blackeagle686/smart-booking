import React, { useState, useEffect } from 'react';
import { User, CheckCircle, Clock } from 'lucide-react';
import api from '../api';

const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) setUser(JSON.parse(userStr));
      
      const res = await api.get('bookings/');
      setBookings(res.data);
    } catch (error) {
      console.error('Error fetching profile data', error);
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div>
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2rem' }}>
        <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'var(--color-1)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white' }}>
          <User size={48} />
        </div>
        <div>
          <h1 style={{ margin: '0 0 0.5rem 0' }}>{user.first_name} {user.last_name}</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>@{user.username} | {user.email}</p>
          <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0 0' }}>Phone: {user.phone_number}</p>
        </div>
      </div>

      <h2>My Bookings</h2>
      {bookings.length === 0 ? (
        <p>You have no bookings yet.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {bookings.map(booking => (
            <div key={booking.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0, color: 'var(--color-1)' }}>{booking.hotel_name}</h3>
                  <p style={{ margin: '0.25rem 0', fontWeight: '500' }}>{booking.room_details?.title}</p>
                  {booking.city_name && <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{booking.city_name}</p>}
                </div>
                {booking.is_approved ? (
                  <span style={{ display: 'flex', alignItems: 'center', color: 'var(--color-3)', fontSize: '0.9rem', fontWeight: 'bold' }}><CheckCircle size={16} style={{ marginRight: '4px' }}/> Approved</span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', color: '#f59e0b', fontSize: '0.9rem', fontWeight: 'bold' }}><Clock size={16} style={{ marginRight: '4px' }}/> Pending</span>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)' }}>Check-in: <strong>{booking.check_in_date}</strong></p>
                  <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Check-out: <strong>{booking.check_out_date}</strong></p>
                </div>
                {booking.is_approved && booking.booking_code && (
                  <div style={{ textAlign: 'center', padding: '0.5rem', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${booking.booking_code}`} alt="Booking QR Code" style={{ display: 'block', margin: '0 auto' }} />
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--color-1)', fontWeight: 'bold' }}>Reception QR</p>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'monospace', background: '#f8fafc', padding: '0.2rem', borderRadius: '4px' }}>
                      {booking.booking_code.split('-')[0].toUpperCase()}
                    </p>
                  </div>
                )}
              </div>
              <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total Price</span>
                <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--color-1)' }}>EGP {booking.total_price}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserProfile;
