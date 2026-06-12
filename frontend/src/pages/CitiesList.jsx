import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Compass } from 'lucide-react';
import api from '../api';
import './pages.css';

const CitiesList = () => {
  const [cities, setCities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await api.get('cities/');
        setCities(response.data);
      } catch (error) {
        console.error("Error fetching cities", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCities();
  }, []);

  return (
    <div style={{ margin: '-2rem' }}>
      {/* Premium Hero Section */}
      <div className="hero-section" style={{ 
        backgroundImage: "linear-gradient(to bottom, rgba(15, 23, 42, 0.5), rgba(15, 23, 42, 0.9)), url('https://images.unsplash.com/photo-1572252009286-268acec5ca0a?auto=format&fit=crop&w=1920&q=80')",
        minHeight: '40vh',
        padding: '6rem 2rem',
        borderRadius: '0 0 24px 24px',
        marginBottom: '4rem',
        marginTop: 0
      }}>
        <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', textShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
          <Compass size={48} color="var(--color-3)" />
          Explore Destinations
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#cbd5e1', maxWidth: '600px', margin: '0 auto', textAlign: 'center', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
          Discover the most breathtaking cities, rich in history, culture, and unmatched luxury across Egypt.
        </p>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem 4rem 2rem' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)' }}>
            <h2>Loading cities...</h2>
          </div>
        ) : (
          <div className="grid-auto-fill">
            {cities.map(city => (
              <Link 
                to={`/city/${city.id}`} 
                key={city.id} 
                style={{ textDecoration: 'none', color: 'inherit', display: 'block', cursor: 'grab' }}
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
                  <div className="card-content" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: 'none', padding: '1.25rem' }}>
                    <div>
                      <h3 className="card-title" style={{ margin: '0 0 0.25rem 0', fontSize: '1.2rem' }}>{city.name}</h3>
                      <p className="card-text-secondary" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.9rem', color: 'var(--color-1)' }}>
                        <MapPin size={14} color="var(--color-1)" /> View properties & attractions
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CitiesList;
