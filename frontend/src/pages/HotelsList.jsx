import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, MapPin, Star } from 'lucide-react';
import api from '../api';
import './pages.css';

const HotelsList = () => {
  const [hotels, setHotels] = useState([]);
  const [cities, setCities] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCities();
    
    // Parse query params for initial filtering
    const params = new URLSearchParams(location.search);
    const cityId = params.get('city') || '';
    const searchQ = params.get('search') || '';
    const checkInDate = params.get('checkin') || '';
    const checkOutDate = params.get('checkout') || '';
    
    setSelectedCity(cityId);
    setSearch(searchQ);
    fetchHotels(searchQ, cityId, checkInDate, checkOutDate);
  }, [location]);

  const fetchCities = async () => {
    try {
      const res = await api.get('cities/');
      setCities(res.data);
    } catch (error) {
      console.error('Error fetching cities', error);
    }
  };

  const fetchHotels = async (query = '', city = '', checkInDate = '', checkOutDate = '') => {
    try {
      let url = `hotels/?search=${query}`;
      if (city) {
        url += `&city=${city}`;
      }
      const res = await api.get(url);
      let fetchedHotels = res.data;
      
      if (checkInDate && checkOutDate) {
         const cIn = new Date(checkInDate);
         const cOut = new Date(checkOutDate);
         
         fetchedHotels = fetchedHotels.filter(hotel => {
            // A hotel is available if AT LEAST ONE room is available
            return hotel.rooms && hotel.rooms.some(room => {
               // 1. Check room's absolute available window
               if (room.available_from && new Date(room.available_from) > cIn) return false;
               if (room.available_to && new Date(room.available_to) < cOut) return false;
               
               // 2. Check room's existing booked dates
               if (room.booked_dates) {
                 for (let b of room.booked_dates) {
                   const bStart = new Date(b.check_in_date);
                   const bEnd = new Date(b.check_out_date);
                   // If booking overlaps with search dates
                   if (cIn < bEnd && cOut > bStart) {
                     return false;
                   }
                 }
               }
               return true; // The room is available for these dates!
            });
         });
      }

      setHotels(fetchedHotels);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error fetching hotels', error);
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentHotels = hotels.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(hotels.length / itemsPerPage);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(location.search);
    if (search) params.set('search', search);
    else params.delete('search');
    
    if (selectedCity) params.set('city', selectedCity);
    else params.delete('city');

    navigate(`/hotels?${params.toString()}`);
  };

  return (
    <div>
      <div className="page-header">
        <h2 style={{ margin: 0 }}>Available Hotels</h2>
        <form onSubmit={handleSearch} className="search-bar-form">
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              className="input-field" 
              style={{ paddingLeft: '2.5rem', marginBottom: 0, width: '250px' }} 
              placeholder="Search by name or location..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select 
            className="input-field" 
            style={{ marginBottom: 0, width: '200px' }} 
            value={selectedCity} 
            onChange={(e) => setSelectedCity(e.target.value)}
          >
            <option value="">All Cities</option>
            {cities.map(city => (
              <option key={city.id} value={city.id}>{city.name}</option>
            ))}
          </select>
          <button type="submit" className="btn-primary">Search</button>
        </form>
      </div>

      {hotels.length === 0 ? (
        <div className="empty-state">
          <Search size={48} className="empty-state-icon" />
          <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>No hotels found</h3>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Try adjusting your destination, dates, or search terms to find available properties.</p>
        </div>
      ) : (
        <div className="grid-auto-fill">
          {currentHotels.map(hotel => (
            <div key={hotel.id} className="card card-image-wrapper">
              <img 
                src={hotel.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'} 
                alt={hotel.title} 
                className="card-image"
              />
              <div className="card-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 className="card-title">{hotel.title}</h3>
                  <div className="rating-badge">
                    {hotel.rate} <Star size={14} style={{ marginLeft: '2px', fill: 'white' }} />
                  </div>
                </div>
                <p style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', fontSize: '0.9rem', marginBottom: '1rem' }}>
                  <MapPin size={16} style={{ marginRight: '0.25rem', flexShrink: 0 }} /> {hotel.city_details?.name ? `${hotel.city_details.name}, ` : ''}{hotel.location}
                </p>
                <p className="card-text-secondary" style={{ marginBottom: '1.5rem' }}>
                  {hotel.description ? `${hotel.description.substring(0, 100)}...` : 'No description available.'}
                </p>
                <button 
                  className="btn-primary" 
                  style={{ width: '100%', marginTop: 'auto' }} 
                  onClick={() => navigate(`/hotels/${hotel.id}`)}
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PAGINATION CONTROLS */}
      {totalPages > 1 && (
        <div className="pagination-container">
          <button 
            className="btn-secondary" 
            disabled={currentPage === 1} 
            onClick={() => {
              setCurrentPage(prev => Math.max(prev - 1, 1));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            Previous
          </button>
          
          <div className="pagination-numbers">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button 
                key={page} 
                onClick={() => {
                  setCurrentPage(page);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`page-btn ${currentPage === page ? 'active' : 'inactive'}`}
              >
                {page}
              </button>
            ))}
          </div>

          <button 
            className="btn-secondary" 
            disabled={currentPage === totalPages} 
            onClick={() => {
              setCurrentPage(prev => Math.min(prev + 1, totalPages));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default HotelsList;
