import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Chatbot from './components/Chatbot';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import HotelsList from './pages/HotelsList';
import HotelDetails from './pages/HotelDetails';
import CityDetails from './pages/CityDetails';
import CitiesList from './pages/CitiesList';
import RoomBookingPage from './pages/RoomBookingPage';
import UserProfile from './pages/UserProfile';
import AdminDashboard from './pages/AdminDashboard';
import './index.css';

// ScrollToTop and Title Component
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Set dynamic page title
    const pathParts = pathname.split('/').filter(Boolean);
    let pageName = 'Home';
    if (pathParts.length > 0) {
      pageName = pathParts[0].charAt(0).toUpperCase() + pathParts[0].slice(1);
    }
    document.title = `${pageName} | SmartHotel`;
  }, [pathname]);

  return null;
};

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const token = localStorage.getItem('access');
  const userStr = localStorage.getItem('user');
  const location = useLocation();
  
  if (!token) return <Navigate to="/login" state={{ from: location }} replace />;
  
  if (adminOnly && userStr) {
    const user = JSON.parse(userStr);
    if (!user.is_staff) return <Navigate to="/" />;
  }
  
  return children;
};

function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/cities" element={<CitiesList />} />
            <Route path="/hotels" element={<HotelsList />} />
            <Route path="/hotels/:id" element={<HotelDetails />} />
            <Route path="/city/:id" element={<CityDetails />} />
            <Route 
              path="/book/:roomId" 
              element={
                <ProtectedRoute>
                  <RoomBookingPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute adminOnly={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </main>
        <Chatbot />
        <Footer />
      </div>
    </Router>
  );
}

export default App;

