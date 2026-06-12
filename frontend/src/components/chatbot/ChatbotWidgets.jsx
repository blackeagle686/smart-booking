import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Calendar, Sparkles, Image as ImageIcon } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './Chatbot.css';

export const InlineCarousel = ({ title, images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) return null;

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % images.length);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);

  return (
    <div className="widget-container">
      <div className="widget-header">
        <div className="widget-icon success">
          <ImageIcon size={14} />
        </div>
        <h4 className="widget-title">{title} Gallery</h4>
      </div>
      
      <div className="carousel-wrapper">
        {images.map((img, idx) => (
          <img 
            key={idx}
            src={img.trim().startsWith('http') ? img.trim() : `http://localhost:8000${img.trim()}`} 
            alt={`Gallery ${idx + 1}`}
            className="carousel-img"
            style={{
              opacity: idx === currentIndex ? 1 : 0,
              zIndex: idx === currentIndex ? 1 : 0
            }}
          />
        ))}
        
        {images.length > 1 && (
          <>
            <button onClick={prevSlide} className="carousel-btn prev"><ChevronLeft size={20}/></button>
            <button onClick={nextSlide} className="carousel-btn next"><ChevronRight size={20}/></button>
            <div className="carousel-dots">
              {images.map((_, idx) => (
                <div key={idx} className="carousel-dot" style={{ background: idx === currentIndex ? 'white' : 'rgba(255,255,255,0.5)' }} onClick={() => setCurrentIndex(idx)} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export const InlineMap = ({ markers, onNavigate }) => {
  const validMarkers = markers?.filter(m => !isNaN(m.lat) && !isNaN(m.lon)) || [];
  if (validMarkers.length === 0) return null;
  const centerLat = validMarkers[0].lat;
  const centerLon = validMarkers[0].lon;
  
  return (
    <div className="widget-container map-widget">
      <div className="widget-header">
        <div className="widget-icon danger">
          <MapPin size={14} />
        </div>
        <h4 className="widget-title">Map Overview</h4>
      </div>
      <div className="map-wrapper">
        <MapContainer center={[centerLat, centerLon]} zoom={validMarkers.length > 1 ? 5 : 10} style={{ height: '250px', width: '100%', zIndex: 1 }} scrollWheelZoom={false}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          {validMarkers.map((m, idx) => (
            <Marker key={idx} position={[m.lat, m.lon]}>
              <Popup>
                <div style={{ textAlign: 'center', minWidth: '140px' }}>
                  {m.image && m.image.trim() !== '' && (
                    <img src={m.image.trim().startsWith('http') ? m.image.trim() : `http://localhost:8000${m.image.trim()}`} alt={m.title} className="popup-img" />
                  )}
                  <h4 className="popup-title">{m.title}</h4>
                  {m.link && m.link.trim() !== '' && (
                    <a 
                      href={m.link.trim()}
                      onClick={(e) => {
                        e.preventDefault();
                        if (onNavigate) onNavigate(m.link.trim());
                      }}
                      className="popup-btn"
                    >
                      View Details
                    </a>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export const InlineBookingForm = ({ roomId, initialInDate, initialOutDate, onSubmit }) => {
  const [inDate, setInDate] = useState(initialInDate && initialInDate !== 'undefined' ? initialInDate : '');
  const [outDate, setOutDate] = useState(initialOutDate && initialOutDate !== 'undefined' ? initialOutDate : '');
  const [file, setFile] = useState(null);

  const handleSubmit = () => {
    if (!inDate || !outDate || !file) {
      alert("Please select check-in/out dates and attach your Vodafone Cash payment screenshot.");
      return;
    }
    onSubmit(roomId, inDate, outDate, file);
  };

  return (
    <div className="widget-container">
      <div className="widget-header">
        <div className="widget-icon info">
          <Calendar size={16} />
        </div>
        <h4 className="widget-title md">Booking Confirmation</h4>
      </div>
      
      <p className="booking-form-desc">
        Please transfer the room amount to our Vodafone Cash number: <strong style={{color: 'var(--color-1)', fontSize: '1rem'}}>010 1234 5678</strong>. Then, attach your screenshot below to submit your request.
      </p>
      
      <div className="form-row">
        <div className="form-col">
          <label className="form-label">Check In</label>
          <input type="date" value={inDate} onChange={e => setInDate(e.target.value)} className="form-input" />
        </div>
        <div className="form-col">
          <label className="form-label">Check Out</label>
          <input type="date" value={outDate} onChange={e => setOutDate(e.target.value)} className="form-input" />
        </div>
      </div>
      
      <div style={{ marginBottom: '1.25rem' }}>
        <label className="form-label">Payment Proof</label>
        <div style={{ position: 'relative', overflow: 'hidden' }}>
          <input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} className="form-file-input" />
        </div>
      </div>

      <button onClick={handleSubmit} className="btn-submit">
        Confirm & Book Room
      </button>
    </div>
  );
};

export const InlineBookingWidget = ({ roomId, inDate, outDate, price, onConfirm }) => {
  return (
    <div className="booking-widget">
      <div className="widget-header" style={{ position: 'relative', zIndex: 2 }}>
        <div className="bw-icon">
          <Sparkles size={20} />
        </div>
        <h3 className="bw-title">1-Click Reservation</h3>
      </div>
      <div className="bw-details">
        <div className="bw-row">
          <span className="bw-label">Check In</span>
          <span className="bw-value">{inDate}</span>
        </div>
        <div className="bw-row">
          <span className="bw-label">Check Out</span>
          <span className="bw-value">{outDate}</span>
        </div>
        <div className="bw-divider" />
        <div className="bw-row" style={{ alignItems: 'center' }}>
          <span className="bw-price-label">Total Price</span>
          <span className="bw-price">EGP {price}</span>
        </div>
      </div>
      <button onClick={() => onConfirm(roomId, inDate, outDate)} className="btn-bw-submit">
        Confirm & Book Now
      </button>
    </div>
  );
};

export const InlineItinerary = ({ title, daysData }) => {
  return (
    <div className="itinerary-widget">
       <h3 className="itinerary-title">
         🗺️ Trip to {title}
       </h3>
       <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
         {daysData.map((dayObj, dIdx) => (
           <div key={dIdx} className="timeline-row">
             <div className="timeline-col">
               <div className="timeline-circle">{dIdx + 1}</div>
               {dIdx < daysData.length - 1 && <div className="timeline-line" />}
             </div>
             <div style={{ flex: 1, paddingBottom: dIdx < daysData.length - 1 ? '2rem' : '0' }}>
               <h4 className="day-title">{dayObj.label}</h4>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                 {dayObj.activities.map((act, aIdx) => (
                   <div 
                     key={aIdx} 
                     className="activity-card"
                     draggable="true"
                     onDragStart={(e) => {
                        e.dataTransfer.setData('oasis_bot', JSON.stringify({ action: 'ASK_ABOUT', query: `Tell me more about the attraction/activity "${act}" in ${title}. How do I book it?` }));
                     }}
                   >
                     <span className="activity-icon">✦</span>
                     <span className="activity-text">{act}</span>
                   </div>
                 ))}
               </div>
             </div>
           </div>
         ))}
       </div>
    </div>
  );
};
