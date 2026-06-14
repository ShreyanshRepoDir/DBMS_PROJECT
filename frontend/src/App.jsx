import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import PropertyList from './pages/PropertyList';
import PropertyDetails from './pages/PropertyDetails';
import AddProperty from './pages/AddProperty';
import EditProperty from './pages/EditProperty';
import BookingPage from './pages/BookingPage';
import PaymentPage from './pages/PaymentPage';
import Favorites from './pages/Favorites';
import AgentDashboard from './pages/AgentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Marketplace from './pages/Marketplace';
import MyBookings from './pages/MyBookings';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <div className="container mt-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/properties" element={<PropertyList />} />
            <Route path="/properties/:id" element={<PropertyDetails />} />
            <Route path="/marketplace" element={<Marketplace />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute allowedRoles={['customer', 'agent', 'admin']} />}>
              <Route path="/book/:id" element={<BookingPage />} />
              <Route path="/payment/:bookingId" element={<PaymentPage />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/my-bookings" element={<MyBookings />} />
            </Route>

            {/* Agent Routes */}
            <Route element={<ProtectedRoute allowedRoles={['agent', 'admin']} />}>
              <Route path="/agent/dashboard" element={<AgentDashboard />} />
              <Route path="/agent/add-property" element={<AddProperty />} />
              <Route path="/agent/edit-property/:id" element={<EditProperty />} />
            </Route>

            {/* Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
            </Route>
          </Routes>
        </div>
        <ToastContainer position="top-right" autoClose={3000} />
      </Router>
    </AuthProvider>
  );
}

export default App;
