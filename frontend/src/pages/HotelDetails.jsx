import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Star, CreditCard } from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;
import api from '../api';

const HotelDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hotel, setHotel] = useState(null);

  useEffect(() => {
    const fetchHotel = async () => {
      try {
        const res = await api.get(`hotels/${id}/`);
        setHotel(res.data);
      } catch (error) {
        console.error('Error fetching hotel', error);
      }
    };
    fetchHotel();
  }, [id]);

  const handleBook = (room) => {
    const isAuth = localStorage.getItem('access');
    if (!isAuth) {
      alert('Please login to book a room.');
      navigate('/login');
      return;
    }
    navigate(`/book/${room.id}`);
  };

  if (!hotel) return <div>Loading...</div>;

  return (
    <div>
      <div style={{ position: 'relative', height: '400px', borderRadius: '24px', overflow: 'hidden', marginBottom: '2rem' }}>
        <img 
          src={hotel.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80'} 
          alt={hotel.title} 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
        />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', padding: '2rem', color: 'white' }}>
          <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2.5rem' }}>{hotel.title}</h1>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center' }}>
              <MapPin size={20} style={{ marginRight: '0.5rem' }}/> 
              {hotel.city_details?.name ? `${hotel.city_details.name}, ` : ''}{hotel.location}
            </span>
            <span style={{ display: 'flex', alignItems: 'center' }}><Star size={20} style={{ marginRight: '0.5rem', fill: 'var(--color-10)' }} color="var(--color-10)"/> {hotel.rate} ({hotel.reviews} reviews)</span>
          </div>
        </div>
      </div>

      {/* ABOUT & MAP SECTION */}
      <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap', marginBottom: '4rem' }}>
        {/* LEFT COLUMN: ABOUT */}
        <div style={{ flex: 1, minWidth: '300px' }}>
          <h2>About {hotel.title}</h2>
          <p style={{ lineHeight: '1.6', color: 'var(--text-secondary)', fontSize: '1.1rem' }}>{hotel.description}</p>
        </div>
        
        {/* RIGHT COLUMN: MAP */}
        {(hotel.lat && hotel.lon) ? (
          <div style={{ flex: 1, minWidth: '300px' }}>
            <h2 style={{ marginBottom: '1rem' }}>Location</h2>
            <div style={{ height: '300px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
              <MapContainer center={[hotel.lat, hotel.lon]} zoom={14} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap'
                />
                <Marker position={[hotel.lat, hotel.lon]} />
              </MapContainer>
            </div>
          </div>
        ) : null}
      </div>

      {/* ROOMS SECTION */}
      <div>
        <h2 style={{ margin: '0 0 1.5rem 0' }}>Available Rooms</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
          {hotel.rooms?.map(room => (
            <div 
              key={room.id} 
              className="card" 
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem', cursor: 'grab' }}
              draggable="true"
              onDragStart={(e) => {
                e.dataTransfer.setData('oasis_bot', JSON.stringify({ action: 'ASK_ABOUT', query: `Tell me about the room "${room.title}" at the hotel "${hotel.title}". What is its availability and pricing?` }));
              }}
            >
              <img 
                src={room.image || 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=500&q=80'} 
                alt={room.title} 
                style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '12px' }} 
              />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ margin: '0 0 0.5rem 0' }}>{room.title}</h3>
                <p style={{ color: 'var(--text-secondary)', margin: '0 0 0.5rem 0', fontSize: '0.9rem', flex: 1 }}>{room.description}</p>
                
                {room.available_from && room.available_to && (
                  <div style={{ margin: '0.5rem 0', fontSize: '0.85rem', color: 'var(--color-1)', fontWeight: '500' }}>
                    Allowed Dates: {room.available_from} to {room.available_to}
                  </div>
                )}

                {room.booked_dates && room.booked_dates.length > 0 && (
                  <div style={{ margin: '0.5rem 0', padding: '0.5rem', background: '#fef2f2', borderRadius: '4px', fontSize: '0.85rem', color: '#ef4444' }}>
                    <strong>Unavailable Dates: </strong>
                    {room.booked_dates.map((b, i) => (
                      <span key={i} style={{ display: 'inline-block', marginRight: '0.5rem' }}>{b.check_in_date} to {b.check_out_date}</span>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                  <p style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--color-1)', margin: 0 }}>EGP {room.price_per_night} <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>/ nt</span></p>
                  <button onClick={() => handleBook(room)} className="btn-primary">Book Now</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HotelDetails;
