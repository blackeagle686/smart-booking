import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Star, ChevronLeft, ChevronRight, Camera, X, Trash2, UploadCloud } from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import api from '../api';

let DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const CityDetails = () => {
  const { id } = useParams();
  const [city, setCity] = useState(null);
  const [hotels, setHotels] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMediaManagerOpen, setIsMediaManagerOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) setIsAdmin(true);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cityRes = await api.get(`cities/${id}/`);
        setCity(cityRes.data);
        
        const hotelsRes = await api.get(`hotels/?city=${id}`);
        setHotels(hotelsRes.data);
      } catch (error) {
        console.error('Error fetching city details', error);
      }
    };
    fetchData();
  }, [id]);

  if (!city) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;

  // Generate images array: Use gallery if available, otherwise use main image, otherwise use fallbacks
  const images = city.gallery && city.gallery.length > 0 
    ? city.gallery.map(g => g.image)
    : [
        city.image || 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1553913861-c0fddf2619ee?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?auto=format&fit=crop&w=1200&q=80'
      ];

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % images.length);
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);

  // Calculate center of city based on city data, or fallback to hotels/default
  let centerLat = city.lat || 30.0444;
  let centerLon = city.lon || 31.2357;
  if (!city.lat && hotels.length > 0) {
    const validHotels = hotels.filter(h => h.lat && h.lon);
    if (validHotels.length > 0) {
      centerLat = validHotels.reduce((sum, h) => sum + h.lat, 0) / validHotels.length;
      centerLon = validHotels.reduce((sum, h) => sum + h.lon, 0) / validHotels.length;
    }
  }

  // Use real description or mock
  const description = city.description || `Welcome to ${city.name}, one of the most vibrant and beautiful destinations. Experience the rich culture, stunning architecture, and breathtaking landscapes. Whether you are looking for a relaxing getaway or an adventurous journey, ${city.name} offers unforgettable memories for every traveler. Explore top-rated hotels, enjoy local cuisine, and immerse yourself in the unique heritage of this amazing city.`;

  return (
    <div style={{ animation: 'fadeIn 0.8s ease-out' }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUpCity { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes zoomPan { 
          0% { transform: scale(1.02) translate3d(0, 0, 0); } 
          100% { transform: scale(1.15) translate3d(-1%, -1%, 0); } 
        }
        .city-hero-full {
          position: relative;
          width: 100vw;
          margin-left: calc(50% - 50vw);
          margin-right: calc(50% - 50vw);
          height: 85vh;
          margin-top: -2rem; /* Pull up to negate padding */
          margin-bottom: 5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #000;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        }
        .city-hero-content {
          position: absolute;
          bottom: 5rem;
          left: 5rem;
          color: white;
          z-index: 10;
          animation: slideUpCity 1s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
          animation-delay: 0.3s;
          opacity: 0;
        }
        .carousel-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          position: absolute;
          top: 0;
          left: 0;
          transition: opacity 1.2s ease-in-out;
          will-change: transform, opacity;
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
          transform: translateZ(0);
        }
        .carousel-img.active {
          opacity: 1;
          animation: zoomPan 25s infinite alternate linear;
          z-index: 2;
        }
        .carousel-img.inactive {
          opacity: 0;
          z-index: 1;
        }
        @media (max-width: 768px) {
          .city-hero-content {
            left: 2rem;
            bottom: 3rem;
          }
        }
      `}</style>

      {/* HERO CAROUSEL */}
      <div className="city-hero-full">
        {images.map((img, idx) => (
          <img 
            key={idx}
            src={img} 
            alt={`${city.name} view ${idx + 1}`} 
            className={`carousel-img ${idx === currentImageIndex ? 'active' : 'inactive'}`}
          />
        ))}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.3) 100%)', zIndex: 5, pointerEvents: 'none' }} />
        
        {/* Carousel Controls */}
        <button onClick={prevImage} style={{ position: 'absolute', left: '2.5rem', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)', zIndex: 10 }} onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'; }} onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; }}>
          <ChevronLeft size={36} strokeWidth={1.5} />
        </button>
        <button onClick={nextImage} style={{ position: 'absolute', right: '2.5rem', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)', zIndex: 10 }} onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'; }} onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; }}>
          <ChevronRight size={36} strokeWidth={1.5} />
        </button>

        {/* Admin Media Button */}
        {isAdmin && (
          <button 
            onClick={() => setIsMediaManagerOpen(true)}
            style={{ position: 'absolute', top: '2rem', right: '2rem', background: 'rgba(0,0,0,0.4)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '0.75rem 1.25rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', backdropFilter: 'blur(8px)', zIndex: 15, transition: 'all 0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.6)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.4)'}
          >
            <Camera size={18} /> Manage Media
          </button>
        )}

        <div className="city-hero-content">
          <h1 style={{ fontSize: 'clamp(4rem, 8vw, 7rem)', fontWeight: '800', letterSpacing: '-3px', margin: '0 0 0.5rem 0', textTransform: 'capitalize', textShadow: '0 10px 40px rgba(0,0,0,0.8)' }}>{city.name}</h1>
          <p style={{ fontSize: '1.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', textShadow: '0 4px 15px rgba(0,0,0,0.6)', opacity: 0.95, fontWeight: '500' }}>
            <MapPin size={26} color="var(--color-1)" style={{ filter: 'drop-shadow(0 0 10px var(--color-1))' }} /> {hotels.length} Premium Hotels Available
          </p>
        </div>
      </div>

      {/* Media Manager Overlay */}
      {isAdmin && isMediaManagerOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
          <div style={{ background: 'white', width: '90%', maxWidth: '800px', borderRadius: '24px', padding: '2.5rem', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
              <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.8rem', color: '#1e293b' }}><Camera color="var(--color-1)" size={28} /> Manage Media for {city.name}</h2>
              <button onClick={() => setIsMediaManagerOpen(false)} style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', transition: 'all 0.2s' }} onMouseOver={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; }} onMouseOut={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}><X size={20} /></button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1.5rem' }}>
              {images.map((img, idx) => (
                <div key={idx} style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', aspectRatio: '1', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                  <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={`Media ${idx}`} />
                  <button 
                    onClick={async () => {
                      if (!window.confirm('Permanently delete this image?')) return;
                      try {
                        const token = localStorage.getItem('access_token');
                        await api.post(`cities/${id}/remove_image/`, { image_url: img }, { headers: { Authorization: `Bearer ${token}` } });
                        // Refetch city data
                        const res = await api.get(`cities/${id}/`);
                        setCity(res.data);
                      } catch (e) {
                        alert('Failed to delete image: ' + (e.response?.data?.error || e.message));
                      }
                    }}
                    style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: 'rgba(239, 68, 68, 0.95)', color: 'white', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(4px)', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                    title="Delete Image"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              
              <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '16px', cursor: 'pointer', aspectRatio: '1', color: '#64748b', transition: 'all 0.2s' }} onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--color-1)'; e.currentTarget.style.color = 'var(--color-1)'; e.currentTarget.style.background = '#f0fdf4'; }} onMouseOut={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = '#f8fafc'; }}>
                <input type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                  if (!e.target.files.length) return;
                  const formData = new FormData();
                  for (let i = 0; i < e.target.files.length; i++) {
                    formData.append('gallery', e.target.files[i]);
                  }
                  try {
                    const token = localStorage.getItem('access_token');
                    await api.patch(`cities/${id}/`, formData, { headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` } });
                    const res = await api.get(`cities/${id}/`);
                    setCity(res.data);
                  } catch (err) {
                    alert('Upload failed: ' + err.message);
                  }
                }} />
                <UploadCloud size={36} style={{ marginBottom: '0.75rem' }} />
                <span style={{ fontWeight: '600' }}>Upload Media</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ABOUT & MAP SECTION */}
      <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap', marginBottom: '4rem' }}>
        {/* LEFT COLUMN: ABOUT */}
        <div style={{ flex: 1, minWidth: '300px' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>About {city.name}</h2>
          <p style={{ lineHeight: '1.8', color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
            {description}
          </p>
        </div>
        
        {/* RIGHT COLUMN: MAP */}
        <div style={{ flex: 1, minWidth: '300px' }}>
          <div style={{ height: '350px', width: '100%', borderRadius: '16px', overflow: 'hidden', border: '4px solid white', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <MapContainer center={[centerLat, centerLon]} zoom={11} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap'
              />
              {city.lat && city.lon && (
                <Marker position={[city.lat, city.lon]} />
              )}
              {hotels.map(h => h.lat && h.lon && (
                <Marker key={h.id} position={[h.lat, h.lon]} />
              ))}
            </MapContainer>
          </div>
        </div>
      </div>

      {/* HOTELS 3x3 GRID SECTION */}
      <h2 style={{ fontSize: '2rem', marginBottom: '2rem', textAlign: 'center' }}>Where to stay in {city.name}</h2>
      
      {hotels.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No hotels available in this city right now.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
          {hotels.map(hotel => (
            <Link to={`/hotels/${hotel.id}`} key={hotel.id} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
                <img 
                  src={hotel.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'} 
                  alt={hotel.title} 
                  style={{ width: '100%', height: '220px', objectFit: 'cover' }} 
                />
                <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>{hotel.title}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--color-1)', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                      {hotel.rate} <Star size={14} style={{ marginLeft: '4px', fill: 'white' }} />
                    </div>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', fontSize: '0.9rem', marginBottom: '1rem' }}>
                    <MapPin size={16} style={{ marginRight: '0.25rem' }} /> {hotel.location}
                  </p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem', flex: 1, lineHeight: '1.5' }}>
                    {hotel.description.substring(0, 120)}...
                  </p>
                  <button className="btn-secondary" style={{ width: '100%' }}>View Hotel</button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default CityDetails;
