import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, CreditCard, ChevronLeft, ShieldCheck, CheckCircle } from 'lucide-react';
import api from '../api';

const RoomBookingPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [dates, setDates] = useState({ checkIn: '', checkOut: '' });
  const [screenshot, setScreenshot] = useState(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [nights, setNights] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchRoom = async () => {
      try {
        const res = await api.get(`rooms/${roomId}/`);
        setRoom(res.data);
      } catch (error) {
        console.error('Error fetching room details', error);
      }
    };
    fetchRoom();
  }, [roomId]);

  useEffect(() => {
    if (dates.checkIn && dates.checkOut) {
      const start = new Date(dates.checkIn);
      const end = new Date(dates.checkOut);
      
      const utcStart = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
      const utcEnd = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
      const diffDays = Math.floor((utcEnd - utcStart) / (1000 * 60 * 60 * 24));
      
      if (diffDays > 0) {
        setNights(diffDays);
        if (room) setTotalPrice(diffDays * parseFloat(room.price_per_night));
      } else {
        setNights(0);
        setTotalPrice(0);
      }
    }
  }, [dates, room]);

  const submitPayment = async (e) => {
    e.preventDefault();
    if (!screenshot) {
      alert('Please upload your payment screenshot.');
      return;
    }
    if (nights <= 0) {
      alert('Invalid dates selected.');
      return;
    }

    const checkInDate = new Date(dates.checkIn);
    const checkOutDate = new Date(dates.checkOut);

    if (room.available_from && checkInDate < new Date(room.available_from)) {
      alert(`This room is only available starting from ${room.available_from}.`);
      return;
    }
    if (room.available_to && checkOutDate > new Date(room.available_to)) {
      alert(`This room is only available until ${room.available_to}.`);
      return;
    }

    let isOverlap = false;
    if (room.booked_dates) {
      for (let booking of room.booked_dates) {
        const bStart = new Date(booking.check_in_date);
        const bEnd = new Date(booking.check_out_date);
        if (checkInDate < bEnd && checkOutDate > bStart) {
          isOverlap = true;
          break;
        }
      }
    }

    if (isOverlap) {
      alert('This room is already booked during the selected dates. Please select different dates.');
      return;
    }

    const formData = new FormData();
    formData.append('room', room.id);
    formData.append('check_in_date', dates.checkIn);
    formData.append('check_out_date', dates.checkOut);
    formData.append('total_price', totalPrice);
    formData.append('payment_screenshot', screenshot);

    try {
      await api.post('bookings/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Booking request submitted successfully! Awaiting admin approval.');
      navigate('/profile');
    } catch (error) {
      console.error(error);
      alert('Error submitting booking.');
    }
  };

  if (!room) return (
    <div style={{ padding: '5rem 2rem', textAlign: 'center', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <h3 style={{ color: 'var(--text-secondary)' }}>Loading booking details...</h3>
    </div>
  );

  const getFutureBookings = () => {
    if (!room.booked_dates) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Sort by check-in date
    return room.booked_dates
      .filter(b => new Date(b.check_out_date) >= today)
      .sort((a, b) => new Date(a.check_in_date) - new Date(b.check_in_date));
  };
  const futureBookings = getFutureBookings();

  return (
    <div>
      <button onClick={() => navigate(-1)} className="btn-secondary" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
        <ChevronLeft size={18} /> Back
      </button>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Left Column: Room Details & Availability */}
        <div style={{ flex: 1.5, minWidth: '300px' }}>
          <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '2rem' }}>
            <img 
              src={room.image || 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80'} 
              alt={room.title} 
              style={{ width: '100%', height: '350px', objectFit: 'cover' }} 
            />
            <div style={{ padding: '2rem' }}>
              <h1 style={{ margin: '0 0 1rem 0' }}>{room.title}</h1>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '1.1rem' }}>{room.description}</p>
              
              <div style={{ display: 'flex', gap: '2rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', flex: 1 }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-1)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle size={18} /> Allowed Booking Window
                  </h4>
                  {room.available_from && room.available_to ? (
                    <p style={{ margin: 0, fontWeight: '500' }}>{room.available_from} <span style={{ color: 'var(--text-secondary)' }}>to</span> {room.available_to}</p>
                  ) : (
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Always Available</p>
                  )}
                </div>

                <div style={{ background: '#fef2f2', padding: '1rem', borderRadius: '8px', flex: 1 }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={18} /> Upcoming Booked Dates
                  </h4>
                  {futureBookings.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#b91c1c', fontSize: '0.9rem' }}>
                      {futureBookings.map((b, i) => (
                        <li key={i}>{b.check_in_date} <span style={{ color: '#ef4444' }}>to</span> {b.check_out_date}</li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ margin: 0, color: '#b91c1c' }}>No upcoming bookings.</p>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Right Column: Booking & Payment Form */}
        <div style={{ flex: 1, minWidth: '350px' }}>
          <div className="card" style={{ position: 'sticky', top: '2rem' }}>
            <h2 style={{ margin: '0 0 1.5rem 0', borderBottom: '2px solid #e2e8f0', paddingBottom: '1rem' }}>Complete Booking</h2>
            
            <form onSubmit={submitPayment}>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Check-in</label>
                  <input 
                    type="date" 
                    className="input-field" 
                    value={dates.checkIn}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setDates({...dates, checkIn: e.target.value})}
                    required
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Check-out</label>
                  <input 
                    type="date" 
                    className="input-field" 
                    value={dates.checkOut}
                    min={dates.checkIn || new Date().toISOString().split('T')[0]}
                    onChange={(e) => setDates({...dates, checkOut: e.target.value})}
                    required
                  />
                </div>
              </div>

              {nights > 0 && (
                <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ margin: '0 0 1rem 0' }}>Booking Summary</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>EGP {room.price_per_night} x {nights} nights</span>
                    <span>EGP {totalPrice}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #e2e8f0', paddingTop: '1rem', marginTop: '1rem' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Total</span>
                    <span style={{ fontWeight: 'bold', fontSize: '1.4rem', color: 'var(--color-1)' }}>EGP {totalPrice}</span>
                  </div>
                </div>
              )}

              <div style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(0,127,95,0.1) 0%, rgba(128,185,24,0.1) 100%)', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid rgba(0,127,95,0.2)' }}>
                <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-1)' }}>
                  <ShieldCheck size={20} /> Payment Details
                </h3>
                <p style={{ margin: '0 0 1rem 0', fontSize: '0.95rem' }}>Please send the total amount via <strong>Vodafone Cash</strong> to the following number:</p>
                <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', textAlign: 'center', marginBottom: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                  <h2 style={{ margin: 0, color: 'var(--color-1)', letterSpacing: '2px' }}>01012345678</h2>
                </div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.95rem' }}>Upload Transfer Screenshot</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="input-field" 
                  style={{ background: 'white' }}
                  onChange={(e) => setScreenshot(e.target.files[0])}
                  required
                />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', padding: '1rem' }}>
                <CreditCard size={20} /> Request Booking
              </button>
            </form>

          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomBookingPage;
