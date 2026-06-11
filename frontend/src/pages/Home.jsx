import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Calendar, Users, Star } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import api from '../api';

const createCityIcon = (imageUrl) => {
  return L.divIcon({
    className: 'custom-city-marker',
    html: `<div style="width: 48px; height: 48px; border-radius: 50%; border: 3px solid white; box-shadow: 0 6px 16px rgba(0,0,0,0.3); background-image: url('${imageUrl || 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=150&q=80'}'); background-size: cover; background-position: center;"></div>`,
    iconSize: [48, 48],
    iconAnchor: [24, 48],
    popupAnchor: [0, -48]
  });
};

const Home = () => {
  const [cities, setCities] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [rooms, setRooms] = useState([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [citiesRes, hotelsRes, roomsRes] = await Promise.all([
          api.get('cities/'),
          api.get('hotels/'),
          api.get('rooms/')
        ]);
        setCities(citiesRes.data);
        setHotels(hotelsRes.data);
        setRooms(roomsRes.data);
      } catch (error) {
        console.error('Error fetching home data', error);
      }
    };
    fetchData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    let url = '/hotels?';
    const params = new URLSearchParams();
    if (searchQuery) params.append('search', searchQuery);
    if (checkIn) params.append('checkin', checkIn);
    if (checkOut) params.append('checkout', checkOut);
    navigate(`/hotels?${params.toString()}`);
  };

  return (
    <div style={{ animation: 'fadeIn 0.8s ease-out' }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUpHero { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes zoomInHero { from { transform: scale(1.05); } to { transform: scale(1); } }
        .hero-full {
          position: relative;
          width: 100vw;
          margin-left: calc(50% - 50vw);
          margin-right: calc(50% - 50vw);
          height: 85vh;
          margin-top: -2rem; /* Pull up to negate padding */
          margin-bottom: 4rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background-attachment: fixed;
          overflow: hidden;
          animation: zoomInHero 1.5s ease-out forwards;
        }
        .hero-content {
          text-align: center;
          color: white;
          z-index: 2;
          padding: 0 2rem;
          animation: slideUpHero 1s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
          animation-delay: 0.2s;
          opacity: 0;
          margin-top: -5rem;
        }
        .search-form-container {
          animation: slideUpHero 1s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
          animation-delay: 0.5s;
          opacity: 0;
        }
      `}</style>

      <div className="hero-full" style={{ 
        backgroundImage: "linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.7)), url('/hero-bg.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}>
        <div className="hero-content">
          <h1 style={{ fontWeight: '800', letterSpacing: '-1.5px', fontSize: 'clamp(3rem, 5vw, 5.5rem)', marginBottom: '1rem', textShadow: '0 4px 15px rgba(0,0,0,0.4)' }}>
            Find your perfect stay
          </h1>
          <p style={{ fontSize: '1.4rem', color: 'rgba(255,255,255,0.9)', margin: '0 auto', textShadow: '0 2px 8px rgba(0,0,0,0.5)', maxWidth: '750px', lineHeight: 1.6 }}>
            Discover the world's most breathtaking hotels with exclusive deals, stunning views, and unforgettable agentic experiences.
          </p>
        </div>
      </div>
        
      <form onSubmit={handleSearch} className="card search-form-container" style={{ 
        display: 'flex', gap: '1.5rem', maxWidth: '1050px', width: '90%', 
        alignItems: 'center', flexWrap: 'wrap', padding: '1.5rem 2rem',
        margin: '-8.5rem auto 5rem auto',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
        position: 'relative',
        zIndex: 10,
        borderRadius: '24px',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)'
      }}>
        <div style={{ flex: 1.2, minWidth: '220px', display: 'flex', alignItems: 'center', borderRight: '1px solid #e2e8f0', paddingRight: '1.5rem' }}>
          <MapPin color="var(--color-3)" size={22} style={{ marginRight: '0.75rem', flexShrink: 0 }}/>
          <input 
            type="text" 
            placeholder="Where are you going?" 
            style={{ border: 'none', width: '100%', outline: 'none', fontSize: '1.05rem', backgroundColor: 'transparent' }} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div style={{ flex: 1.8, minWidth: '300px', display: 'flex', alignItems: 'center', borderRight: '1px solid #e2e8f0', paddingRight: '1.5rem' }}>
          <Calendar color="var(--color-3)" size={22} style={{ marginRight: '0.75rem', flexShrink: 0 }}/>
          <input 
            type="date" 
            style={{ border: 'none', width: '100%', outline: 'none', fontSize: '1rem', backgroundColor: 'transparent', color: checkIn ? 'var(--text-primary)' : 'var(--text-secondary)' }} 
            value={checkIn}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setCheckIn(e.target.value)}
          />
          <span style={{ margin: '0 1rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>—</span>
          <input 
            type="date" 
            style={{ border: 'none', width: '100%', outline: 'none', fontSize: '1rem', backgroundColor: 'transparent', color: checkOut ? 'var(--text-primary)' : 'var(--text-secondary)' }} 
            value={checkOut}
            min={checkIn || new Date().toISOString().split('T')[0]}
            onChange={(e) => setCheckOut(e.target.value)}
          />
        </div>
        <div style={{ flex: 0.8, minWidth: '150px', display: 'flex', alignItems: 'center', paddingRight: '0.5rem' }}>
          <Users color="var(--color-3)" size={22} style={{ marginRight: '0.75rem', flexShrink: 0 }}/>
          <span style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>2 adults · 1 room</span>
        </div>
        <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.5rem', fontSize: '1.05rem' }}>
          <Search size={20} /> Search
        </button>
      </form>

      <h2 style={{ marginTop: '3rem' }}>Popular Destinations in Egypt</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginTop: '1rem' }}>
        {cities.slice(0, 8).map(city => (
          <Link 
            to={`/city/${city.id}`} 
            key={city.id} 
            style={{ textDecoration: 'none', color: 'inherit', cursor: 'grab' }}
            draggable="true"
            onDragStart={(e) => {
              e.dataTransfer.setData('oasis_bot', JSON.stringify({ action: 'ASK_ABOUT', query: `Tell me more about the city of ${city.name}. What are the popular attractions and best hotels there?` }));
            }}
          >
            <div className="card" style={{ padding: '0', overflow: 'hidden', pointerEvents: 'none' }}>
              <img 
                src={city.image || 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=500&q=80'} 
                alt={city.name} 
                style={{ width: '100%', height: '200px', objectFit: 'cover' }} 
              />
              <div style={{ padding: '1.5rem' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', textTransform: 'capitalize' }}>{city.name}</h3>
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Explore properties</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* EXPLORE BY MAP */}
      <div style={{ marginTop: '5rem' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>Explore by Map</h2>
        <div style={{ height: '450px', width: '100%', borderRadius: '24px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 15px 35px rgba(0,0,0,0.1)' }}>
          <MapContainer center={[26.8206, 30.8025]} zoom={7} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
            {cities.filter(c => c.lat && c.lon).map(city => (
              <Marker key={city.id} position={[city.lat, city.lon]} icon={createCityIcon(city.image)}>
                <Popup className="custom-popup">
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <img 
                      src={city.image || 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=500&q=80'} 
                      alt={city.name} 
                      style={{ width: '100%', height: '120px', objectFit: 'cover' }} 
                    />
                    <div style={{ padding: '1rem', textAlign: 'center' }}>
                      <h3 style={{ margin: '0 0 0.75rem 0', color: 'var(--text-primary)', fontSize: '1.2rem', textTransform: 'capitalize' }}>{city.name}</h3>
                      <Link to={`/city/${city.id}`} className="btn-primary" style={{ display: 'block', padding: '0.6rem 1rem', fontSize: '0.95rem', textDecoration: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold' }}>
                        Explore City
                      </Link>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      {/* FEATURED HOTELS */}
      <h2 style={{ marginTop: '4rem' }}>Featured Hotels</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginTop: '1rem' }}>
        {hotels.slice(0, 4).map(hotel => (
          <Link 
            to={`/hotels/${hotel.id}`} 
            key={hotel.id} 
            style={{ textDecoration: 'none', color: 'inherit', cursor: 'grab' }}
            draggable="true"
            onDragStart={(e) => {
              e.dataTransfer.setData('oasis_bot', JSON.stringify({ action: 'ASK_ABOUT', query: `Can you tell me more about the hotel ${hotel.title} in ${hotel.location}? What are its top features?` }));
            }}
          >
            <div className="card" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%', pointerEvents: 'none' }}>
              <img 
                src={hotel.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=500&q=80'} 
                alt={hotel.title} 
                style={{ width: '100%', height: '200px', objectFit: 'cover' }} 
              />
              <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', textTransform: 'capitalize' }}>{hotel.title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--color-1)', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>
                    {hotel.rate} <Star size={12} style={{ marginLeft: '2px', fill: 'white' }} />
                  </div>
                </div>
                <p style={{ color: 'var(--text-secondary)', margin: 0, flex: 1, fontSize: '0.9rem' }}>
                  <MapPin size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                  {hotel.location}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* TOP ROOMS */}
      <h2 style={{ marginTop: '4rem' }}>Top Rooms</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginTop: '1rem', marginBottom: '4rem' }}>
        {rooms.slice(0, 4).map(room => (
          <Link 
            to={`/book/${room.id}`} 
            key={room.id} 
            style={{ textDecoration: 'none', color: 'inherit', cursor: 'grab' }}
            draggable="true"
            onDragStart={(e) => {
              e.dataTransfer.setData('oasis_bot', JSON.stringify({ action: 'ASK_ABOUT', query: `Tell me about the room "${room.title}". What is the pricing and availability?` }));
            }}
          >
            <div className="card" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%', pointerEvents: 'none' }}>
              <img 
                src={room.image || 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=500&q=80'} 
                alt={room.title} 
                style={{ width: '100%', height: '200px', objectFit: 'cover' }} 
              />
              <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', textTransform: 'capitalize' }}>{room.title}</h3>
                <p style={{ color: 'var(--text-secondary)', margin: '0 0 1rem 0', flex: 1, fontSize: '0.9rem' }}>{room.description.substring(0, 80)}...</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--color-1)', fontSize: '1.2rem' }}>EGP {room.price_per_night}</span>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>/ night</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Home;
