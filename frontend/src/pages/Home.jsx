import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Calendar, Users, Star } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import api from '../api';
import './pages.css';

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
    <div className="home-container">
      <div className="hero-full" style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.7)), url('/hero-bg.png')" }}>
        <div className="hero-content">
          <h1 className="hero-title">
            Find your perfect stay
          </h1>
          <p className="hero-subtitle">
            Discover the world's most breathtaking hotels with exclusive deals, stunning views, and unforgettable agentic experiences.
          </p>
        </div>
      </div>
        
      <form onSubmit={handleSearch} className="card search-form-container">
        <div className="search-input-group" style={{ flex: 1.2, minWidth: '220px' }}>
          <MapPin color="var(--color-3)" size={22} style={{ marginRight: '0.75rem', flexShrink: 0 }}/>
          <input 
            type="text" 
            placeholder="Where are you going?" 
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="search-input-group" style={{ flex: 1.8, minWidth: '300px' }}>
          <Calendar color="var(--color-3)" size={22} style={{ marginRight: '0.75rem', flexShrink: 0 }}/>
          <input 
            type="date" 
            className="search-input"
            style={{ color: checkIn ? 'var(--text-primary)' : 'var(--text-secondary)' }} 
            value={checkIn}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setCheckIn(e.target.value)}
          />
          <span style={{ margin: '0 1rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>—</span>
          <input 
            type="date" 
            className="search-input"
            style={{ color: checkOut ? 'var(--text-primary)' : 'var(--text-secondary)' }} 
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

      <h2 className="section-title">Popular Destinations in Egypt</h2>
      <div className="grid-auto-fit">
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
            <div className="card card-image-wrapper">
              <img 
                src={city.image || 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=500&q=80'} 
                alt={city.name} 
                className="card-image"
              />
              <div className="card-content">
                <h3 className="card-title">{city.name}</h3>
                <p className="card-text-secondary">Explore properties</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* EXPLORE BY MAP */}
      <div style={{ marginTop: '5rem' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>Explore by Map</h2>
        <div className="map-container-wrapper">
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
                      className="popup-image"
                    />
                    <div className="popup-content">
                      <h3 className="popup-title">{city.name}</h3>
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
      <h2 className="section-title">Featured Hotels</h2>
      <div className="grid-auto-fit">
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
            <div className="card card-image-wrapper">
              <img 
                src={hotel.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=500&q=80'} 
                alt={hotel.title} 
                className="card-image"
              />
              <div className="card-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 className="card-title">{hotel.title}</h3>
                  <div className="rating-badge">
                    {hotel.rate} <Star size={12} style={{ marginLeft: '2px', fill: 'white' }} />
                  </div>
                </div>
                <p className="card-text-secondary">
                  <MapPin size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                  {hotel.location}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* TOP ROOMS */}
      <h2 className="section-title">Top Rooms</h2>
      <div className="grid-auto-fit" style={{ marginBottom: '4rem' }}>
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
            <div className="card card-image-wrapper">
              <img 
                src={room.image || 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=500&q=80'} 
                alt={room.title} 
                className="card-image"
              />
              <div className="card-content">
                <h3 className="card-title">{room.title}</h3>
                <p className="card-text-secondary" style={{ marginBottom: '1rem' }}>{room.description.substring(0, 80)}...</p>
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
