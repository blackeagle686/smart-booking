import React, { useState, useEffect } from 'react';
import { Plus, Check, X, Hotel, Trash2, Edit, ChevronLeft, MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
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

const LocationPicker = ({ lat, lon, onChange }) => {
  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        onChange(e.latlng.lat, e.latlng.lng);
      },
    });
    return null;
  };

  return (
    <div style={{ width: '100%', marginBottom: '1rem' }}>
      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>Pin Exact Location</label>
      <div style={{ height: '250px', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
        <MapContainer center={[lat || 30.0444, lon || 31.2357]} zoom={lat ? 13 : 6} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap'
          />
          {lat && lon && <Marker position={[lat, lon]} />}
          <MapClickHandler />
        </MapContainer>
      </div>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>Click anywhere on the map to place the pin.</p>
    </div>
  );
};

const PaginationControls = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
      <button 
        className="btn-secondary" 
        style={{ padding: '0.5rem 1rem' }}
        disabled={currentPage === 1} 
        onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
      >
        Prev
      </button>
      <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
          <button 
            key={page} 
            onClick={() => onPageChange(page)}
            style={{ 
              padding: '0.5rem 0.75rem', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer', 
              background: currentPage === page ? 'var(--color-1)' : '#e2e8f0', 
              color: currentPage === page ? 'white' : 'var(--text-primary)',
              fontWeight: currentPage === page ? 'bold' : 'normal'
            }}
          >
            {page}
          </button>
        ))}
      </div>
      <button 
        className="btn-secondary" 
        style={{ padding: '0.5rem 1rem' }}
        disabled={currentPage === totalPages} 
        onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
      >
        Next
      </button>
    </div>
  );
};

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('hotels');
  const [hotels, setHotels] = useState([]);
  const [cities, setCities] = useState([]);
  const [bookings, setBookings] = useState([]);
  
  // Modals & Views State
  const [selectedHotel, setSelectedHotel] = useState(null); // For detailed view
  
  const [showCityModal, setShowCityModal] = useState(false);
  const [editCityData, setEditCityData] = useState(null);

  const [showHotelModal, setShowHotelModal] = useState(false);
  const [editHotelData, setEditHotelData] = useState(null);

  const [showRoomModal, setShowRoomModal] = useState(false);
  const [editRoomData, setEditRoomData] = useState(null);

  // Form states
  const [cityForm, setCityForm] = useState({ name: '', description: '', lat: 30.0444, lon: 31.2357, image: null, gallery: [] });
  const [hotelForm, setHotelForm] = useState({ title: '', description: '', city: '', location: '', lat: 30.0444, lon: 31.2357, rate: 0, image: null });
  const [roomForm, setRoomForm] = useState({ title: '', description: '', price_per_night: '', rate: 0, image: null, available_from: '', available_to: '' });

  // Pagination states
  const [citiesPage, setCitiesPage] = useState(1);
  const [hotelsPage, setHotelsPage] = useState(1);
  const [bookingsPage, setBookingsPage] = useState(1);
  const itemsPerPage = 8;

  const paginate = (data, page) => {
    const indexOfLast = page * itemsPerPage;
    const indexOfFirst = indexOfLast - itemsPerPage;
    return data.slice(indexOfFirst, indexOfLast);
  };
  const getPageCount = (data) => Math.ceil(data.length / itemsPerPage);

  const currentCities = paginate(cities, citiesPage);
  const currentHotels = paginate(hotels, hotelsPage);
  const currentBookings = paginate(bookings, bookingsPage);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [hotelsRes, bookingsRes, citiesRes] = await Promise.all([
        api.get('hotels/'),
        api.get('bookings/'),
        api.get('cities/')
      ]);
      setHotels(hotelsRes.data);
      setBookings(bookingsRes.data);
      setCities(citiesRes.data);
      
      // Update selected hotel if it is currently open
      if (selectedHotel) {
        const updatedHotel = hotelsRes.data.find(h => h.id === selectedHotel.id);
        setSelectedHotel(updatedHotel);
      }
    } catch (error) {
      console.error('Error fetching admin data', error);
    }
  };

  // --- CITIES CRUD ---
  const handleSaveCity = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', cityForm.name);
    if (cityForm.description) formData.append('description', cityForm.description);
    if (cityForm.lat) formData.append('lat', cityForm.lat);
    if (cityForm.lon) formData.append('lon', cityForm.lon);
    if (cityForm.image instanceof File) formData.append('image', cityForm.image);
    
    if (cityForm.gallery && cityForm.gallery.length > 0) {
      Array.from(cityForm.gallery).forEach(file => {
        formData.append('gallery', file);
      });
    }

    try {
      if (editCityData) {
        await api.patch(`cities/${editCityData.id}/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post('cities/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      setShowCityModal(false);
      setEditCityData(null);
      fetchData();
    } catch (error) {
      alert('Error saving city');
    }
  };

  const handleRemoveCityImage = async (cityId, imageUrl, isMain = false) => {
    if(!window.confirm('Are you sure you want to permanently delete this image?')) return;
    try {
      await api.post(`cities/${cityId}/remove_image/`, { image_url: imageUrl });
      // Update local state to instantly remove it from the UI
      setEditCityData(prev => {
        if (isMain) {
          return { ...prev, image: null };
        } else {
          return {
            ...prev,
            gallery: prev.gallery.filter(g => (g.image || g) !== imageUrl)
          };
        }
      });
      fetchData();
    } catch (error) {
      alert('Error deleting image');
    }
  };

  const handleDeleteCity = async (id) => {
    if(window.confirm('Are you sure you want to delete this city? This may affect linked hotels.')) {
      try {
        await api.delete(`cities/${id}/`);
        fetchData();
      } catch (error) {
        alert('Error deleting city');
      }
    }
  };

  // --- HOTELS CRUD ---
  const handleSaveHotel = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.keys(hotelForm).forEach(key => {
      if (hotelForm[key] !== null && hotelForm[key] !== '') formData.append(key, hotelForm[key]);
    });
    
    try {
      if (editHotelData) {
        await api.patch(`hotels/${editHotelData.id}/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post('hotels/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      setShowHotelModal(false);
      setEditHotelData(null);
      fetchData();
    } catch (error) {
      console.error(error);
      alert(`Error saving hotel: ${JSON.stringify(error.response?.data || error.message)}`);
    }
  };

  const handleDeleteHotel = async (id) => {
    if(window.confirm('Are you sure you want to delete this hotel?')) {
      try {
        await api.delete(`hotels/${id}/`);
        if (selectedHotel?.id === id) setSelectedHotel(null);
        fetchData();
      } catch (error) {
        alert('Error deleting hotel');
      }
    }
  };

  // --- ROOMS CRUD ---
  const handleSaveRoom = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('hotel', selectedHotel.id);
    Object.keys(roomForm).forEach(key => {
      if (roomForm[key] !== null && roomForm[key] !== '') formData.append(key, roomForm[key]);
    });
    
    try {
      if (editRoomData) {
        await api.patch(`rooms/${editRoomData.id}/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post('rooms/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      setShowRoomModal(false);
      setEditRoomData(null);
      fetchData();
    } catch (error) {
      alert('Error saving room');
    }
  };

  const handleDeleteRoom = async (id) => {
    if(window.confirm('Are you sure you want to delete this room?')) {
      try {
        await api.delete(`rooms/${id}/`);
        fetchData();
      } catch (error) {
        alert('Error deleting room');
      }
    }
  };

  // --- BOOKINGS ---
  const approveBooking = async (id, currentStatus) => {
    try {
      await api.patch(`bookings/${id}/approve/`, { is_approved: !currentStatus });
      fetchData();
    } catch (error) {
      alert('Error updating booking');
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Admin Dashboard</h1>
      
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
        <button className={activeTab === 'hotels' ? 'btn-primary' : 'btn-secondary'} onClick={() => { setActiveTab('hotels'); setSelectedHotel(null); }}>Manage Hotels</button>
        <button className={activeTab === 'cities' ? 'btn-primary' : 'btn-secondary'} onClick={() => setActiveTab('cities')}>Manage Cities</button>
        <button className={activeTab === 'bookings' ? 'btn-primary' : 'btn-secondary'} onClick={() => setActiveTab('bookings')}>Manage Bookings</button>
      </div>

      {/* --- CITIES TAB --- */}
      {activeTab === 'cities' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2>Cities Listing</h2>
            <button className="btn-primary" onClick={() => { setCityForm({ name: '', description: '', lat: 30.0444, lon: 31.2357, image: null, gallery: [] }); setEditCityData(null); setShowCityModal(true); }}>
              <Plus size={18} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}/> Add City
            </button>
          </div>

          {showCityModal && (
            <div className="card" style={{ marginBottom: '2rem' }}>
              <h3>{editCityData ? 'Edit City' : 'Add New City'}</h3>
              <form onSubmit={handleSaveCity}>
                <input className="input-field" placeholder="City Name" value={cityForm.name} required onChange={e => setCityForm({...cityForm, name: e.target.value})} />
                <textarea className="input-field" placeholder="City Description" rows="3" value={cityForm.description} onChange={e => setCityForm({...cityForm, description: e.target.value})}></textarea>
                
                <LocationPicker lat={cityForm.lat} lon={cityForm.lon} onChange={(lat, lon) => setCityForm({...cityForm, lat, lon})} />
                
                {editCityData && editCityData.image && (
                  <div style={{ marginBottom: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.75rem', fontWeight: 'bold' }}>Current Main Image</label>
                    <div style={{ position: 'relative', width: '160px', height: '100px', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                      <img src={editCityData.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Main" />
                      <button type="button" onClick={() => handleRemoveCityImage(editCityData.id, editCityData.image, true)} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(239, 68, 68, 0.95)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(4px)' }} title="Delete Main Image">
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Upload New Main Image (Thumbnail)</label>
                  <input className="input-field" type="file" accept="image/*" onChange={e => setCityForm({...cityForm, image: e.target.files[0]})} />
                </div>
                
                {editCityData && editCityData.gallery && editCityData.gallery.length > 0 && (
                  <div style={{ marginBottom: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.75rem', fontWeight: 'bold' }}>Current Gallery Images</label>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      {editCityData.gallery.map((g, idx) => {
                        const imgUrl = g.image || g;
                        return (
                          <div key={idx} style={{ position: 'relative', width: '90px', height: '90px', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                            <img src={imgUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Gallery" />
                            <button type="button" onClick={() => handleRemoveCityImage(editCityData.id, imgUrl)} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(239, 68, 68, 0.95)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(4px)' }} title="Delete Image">
                              <X size={14} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Upload New Gallery Images (Multiple)</label>
                  <input className="input-field" type="file" accept="image/*" multiple onChange={e => setCityForm({...cityForm, gallery: e.target.files})} />
                </div>
                
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="button" className="btn-secondary" onClick={() => { setShowCityModal(false); setEditCityData(null); }}>Cancel</button>
                  <button type="submit" className="btn-primary">Save City</button>
                </div>
              </form>
            </div>
          )}

          <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <tr>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>City</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentCities.map(city => (
                  <tr key={city.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#e2e8f0', overflow: 'hidden' }}>
                        {city.image ? <img src={city.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <MapPin size={20} style={{ margin: '10px' }} color="#94a3b8" />}
                      </div>
                      <span style={{ fontWeight: '500' }}>{city.name}</span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <button onClick={() => { setEditCityData(city); setCityForm({ name: city.name, description: city.description || '', lat: city.lat || 30.0444, lon: city.lon || 31.2357, image: null, gallery: [] }); setShowCityModal(true); }} style={{ background: 'none', border: 'none', color: 'var(--color-3)', cursor: 'pointer', padding: '0.5rem' }}>
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDeleteCity(city.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem' }}>
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PaginationControls currentPage={citiesPage} totalPages={getPageCount(cities)} onPageChange={setCitiesPage} />
        </div>
      )}

      {/* --- HOTELS TAB --- */}
      {activeTab === 'hotels' && !selectedHotel && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2>Hotels Listing</h2>
            <button className="btn-primary" onClick={() => { setHotelForm({ title: '', description: '', city: '', location: '', lat: 30.0444, lon: 31.2357, rate: 0, image: null }); setEditHotelData(null); setShowHotelModal(true); }}>
              <Plus size={18} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}/> Add Hotel
            </button>
          </div>

          {showHotelModal && (
            <div className="card" style={{ marginBottom: '2rem' }}>
              <h3>{editHotelData ? 'Edit Hotel' : 'Add New Hotel'}</h3>
              <form onSubmit={handleSaveHotel}>
                <input className="input-field" placeholder="Title" value={hotelForm.title} required onChange={e => setHotelForm({...hotelForm, title: e.target.value})} />
                <textarea className="input-field" placeholder="Description" rows="3" value={hotelForm.description} required onChange={e => setHotelForm({...hotelForm, description: e.target.value})}></textarea>
                <select className="input-field" required value={hotelForm.city} onChange={e => setHotelForm({...hotelForm, city: e.target.value})}>
                  <option value="">Select City</option>
                  {cities.map(city => (
                    <option key={city.id} value={city.id}>{city.name}</option>
                  ))}
                </select>
                <input className="input-field" placeholder="Location/Address Details" value={hotelForm.location} required onChange={e => setHotelForm({...hotelForm, location: e.target.value})} />
                
                <LocationPicker lat={hotelForm.lat} lon={hotelForm.lon} onChange={(lat, lon) => setHotelForm({...hotelForm, lat, lon})} />

                <input className="input-field" type="number" step="0.1" placeholder="Rate (0-10)" value={hotelForm.rate} onChange={e => setHotelForm({...hotelForm, rate: e.target.value})} />
                <input className="input-field" type="file" accept="image/*" onChange={e => setHotelForm({...hotelForm, image: e.target.files[0]})} />
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="button" className="btn-secondary" onClick={() => { setShowHotelModal(false); setEditHotelData(null); }}>Cancel</button>
                  <button type="submit" className="btn-primary">Save Hotel</button>
                </div>
              </form>
            </div>
          )}

          <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <tr>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Hotel</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Location</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>Rooms</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentHotels.map(hotel => (
                  <tr key={hotel.id} style={{ borderBottom: '1px solid #e2e8f0', cursor: 'pointer' }} onClick={() => setSelectedHotel(hotel)}>
                    <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#e2e8f0', overflow: 'hidden' }}>
                        {hotel.image ? <img src={hotel.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Hotel size={20} style={{ margin: '10px' }} color="#94a3b8" />}
                      </div>
                      <span style={{ fontWeight: '500', color: 'var(--color-1)' }}>{hotel.title}</span>
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                      {hotel.city_details?.name ? `${hotel.city_details.name}, ` : ''}{hotel.location}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>{hotel.rooms?.length || 0}</td>
                    <td style={{ padding: '1rem', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => { setEditHotelData(hotel); setHotelForm({ title: hotel.title, description: hotel.description, city: hotel.city_details?.id || '', location: hotel.location, lat: hotel.lat || 30.0444, lon: hotel.lon || 31.2357, rate: hotel.rate, image: null }); setShowHotelModal(true); }} style={{ background: 'none', border: 'none', color: 'var(--color-3)', cursor: 'pointer', padding: '0.5rem' }}>
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDeleteHotel(hotel.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem' }}>
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PaginationControls currentPage={hotelsPage} totalPages={getPageCount(hotels)} onPageChange={setHotelsPage} />
        </div>
      )}

      {/* --- HOTEL DETAILS VIEW (Inside Hotels Tab) --- */}
      {activeTab === 'hotels' && selectedHotel && (
        <div>
          <button onClick={() => setSelectedHotel(null)} className="btn-secondary" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
            <ChevronLeft size={18} /> Back to Hotels
          </button>

          <div className="card" style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
            {selectedHotel.image && <img src={selectedHotel.image} style={{ width: '300px', height: '200px', objectFit: 'cover', borderRadius: '12px' }} />}
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: '0 0 0.5rem 0' }}>{selectedHotel.title}</h2>
              <p style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)' }}><MapPin size={16} style={{ verticalAlign: 'text-bottom' }}/> {selectedHotel.city_details?.name}, {selectedHotel.location}</p>
              <p style={{ margin: '0 0 1rem 0', lineHeight: 1.6 }}>{selectedHotel.description}</p>
              <p style={{ margin: 0 }}><strong>Rate:</strong> {selectedHotel.rate}/10 | <strong>Reviews:</strong> {selectedHotel.reviews}</p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3>Rooms in {selectedHotel.title}</h3>
            <button className="btn-primary" onClick={() => { setRoomForm({ title: '', description: '', price_per_night: '', rate: 0, image: null, available_from: '', available_to: '' }); setEditRoomData(null); setShowRoomModal(true); }}>
              <Plus size={18} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}/> Add Room
            </button>
          </div>

          {showRoomModal && (
            <div className="card" style={{ marginBottom: '2rem' }}>
              <h3>{editRoomData ? 'Edit Room' : 'Add Room'}</h3>
              <form onSubmit={handleSaveRoom}>
                <input className="input-field" placeholder="Room Title (e.g. Deluxe Double)" value={roomForm.title} required onChange={e => setRoomForm({...roomForm, title: e.target.value})} />
                <textarea className="input-field" placeholder="Description" rows="2" value={roomForm.description} required onChange={e => setRoomForm({...roomForm, description: e.target.value})}></textarea>
                <input className="input-field" type="number" step="0.01" placeholder="Price Per Night (EGP)" value={roomForm.price_per_night} required onChange={e => setRoomForm({...roomForm, price_per_night: e.target.value})} />
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Available From</label>
                    <input className="input-field" type="date" value={roomForm.available_from || ''} onChange={e => setRoomForm({...roomForm, available_from: e.target.value})} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Available To</label>
                    <input className="input-field" type="date" value={roomForm.available_to || ''} onChange={e => setRoomForm({...roomForm, available_to: e.target.value})} />
                  </div>
                </div>
                <input className="input-field" type="number" step="0.1" placeholder="Rate (0-10)" value={roomForm.rate} onChange={e => setRoomForm({...roomForm, rate: e.target.value})} />
                <input className="input-field" type="file" accept="image/*" onChange={e => setRoomForm({...roomForm, image: e.target.files[0]})} />
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="button" className="btn-secondary" onClick={() => { setShowRoomModal(false); setEditRoomData(null); }}>Cancel</button>
                  <button type="submit" className="btn-primary">Save Room</button>
                </div>
              </form>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {selectedHotel.rooms?.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No rooms added yet.</p>}
            {selectedHotel.rooms?.map(room => (
              <div key={room.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                {room.image && <img src={room.image} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px', marginBottom: '1rem' }} />}
                <h4 style={{ margin: '0 0 0.5rem 0' }}>{room.title}</h4>
                <p style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)', flex: 1, fontSize: '0.9rem' }}>{room.description}</p>
                {room.available_from && room.available_to && (
                  <p style={{ margin: '0 0 1rem 0', color: 'var(--color-3)', fontSize: '0.85rem' }}>
                    Available: {room.available_from} to {room.available_to}
                  </p>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--color-1)' }}>EGP {room.price_per_night}/nt</span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => { setEditRoomData(room); setRoomForm({ title: room.title, description: room.description, price_per_night: room.price_per_night, rate: room.rate, image: null, available_from: room.available_from || '', available_to: room.available_to || '' }); setShowRoomModal(true); }} style={{ background: 'none', border: 'none', color: 'var(--color-3)', cursor: 'pointer' }}>
                      <Edit size={18} />
                    </button>
                    <button onClick={() => handleDeleteRoom(room.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- BOOKINGS TAB --- */}
      {activeTab === 'bookings' && (
        <div>
          <h2>Booking Requests</h2>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {bookings.length === 0 && <p>No bookings found.</p>}
            {currentBookings.map(booking => (
              <div key={booking.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <h3 style={{ margin: 0 }}>{booking.hotel_name} - {booking.room_details?.title}</h3>
                    {booking.booking_code && (
                      <span style={{ fontSize: '0.8rem', background: '#e2e8f0', color: 'var(--text-secondary)', padding: '0.1rem 0.5rem', borderRadius: '4px', fontFamily: 'monospace' }}>
                        ID: {booking.booking_code.split('-')[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                  <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)' }}>By: <strong>{booking.user_details?.username}</strong> ({booking.user_details?.email}) | Phone: {booking.user_details?.phone_number}</p>
                  <p style={{ margin: '0 0 0.25rem 0', color: 'var(--text-secondary)' }}>{booking.city_name ? `${booking.city_name} | ` : ''}Check-in: {booking.check_in_date} | Check-out: {booking.check_out_date}</p>
                  <p style={{ margin: 0, fontWeight: 'bold', color: 'var(--color-1)' }}>Total: EGP {booking.total_price}</p>
                </div>
                {booking.payment_screenshot && (
                  <div>
                    <a href={booking.payment_screenshot} target="_blank" rel="noreferrer" style={{ color: 'var(--color-3)', textDecoration: 'none', fontSize: '0.9rem', display: 'block', marginBottom: '0.5rem' }}>View Payment Screenshot</a>
                  </div>
                )}
                <div>
                  {booking.is_approved ? (
                    <button onClick={() => approveBooking(booking.id, true)} className="btn-secondary" style={{ color: '#ef4444', borderColor: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <X size={16} /> Revoke
                    </button>
                  ) : (
                    <button onClick={() => approveBooking(booking.id, false)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Check size={16} /> Approve
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <PaginationControls currentPage={bookingsPage} totalPages={getPageCount(bookings)} onPageChange={setBookingsPage} />
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
