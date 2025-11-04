import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import VendorList from './pages/VendorList';
import AddVendorForm from './pages/AddVendorForm';
import BODList from './pages/BODList';
import Events from './pages/Events';
import EventForm from './pages/EventForm';
import EventDetails from './pages/EventDetails';
import Members from './pages/Members';
import Associations from './pages/Associations';
import AssociationDetail from './pages/AssociationDetail';
import AssociationMembers from './pages/AssociationMembers';
import Settings from './pages/Settings';
import EventRegistrationPage from './pages/EventRegistrationPage';

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          
          {/* Test route to verify routing works */}
          <Route path="/test-route" element={<div style={{padding: '20px'}}><h1>Test Route Works!</h1></div>} />
          
          {/* Protected Routes - Require Authentication */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/vendors" element={<ProtectedRoute><VendorList /></ProtectedRoute>} />
          <Route path="/add-vendor" element={<ProtectedRoute><AddVendorForm /></ProtectedRoute>} />
          <Route path="/bod" element={<ProtectedRoute><BODList /></ProtectedRoute>} />
          <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
          <Route path="/events/new" element={<ProtectedRoute><EventForm /></ProtectedRoute>} />
          <Route path="/events/:eventId" element={<ProtectedRoute><EventDetails /></ProtectedRoute>} />
          <Route path="/events/:eventId/edit" element={<ProtectedRoute><EventForm /></ProtectedRoute>} />
          <Route path="/members" element={<ProtectedRoute><Members /></ProtectedRoute>} />
          <Route path="/associations" element={<ProtectedRoute><Associations /></ProtectedRoute>} />
          <Route path="/associations/:associationId" element={<ProtectedRoute><AssociationDetail /></ProtectedRoute>} />
          <Route path="/associations/:associationId/members" element={<ProtectedRoute><AssociationMembers /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          
          {/* Public Event Registration Routes - Specific routes for known event slugs */}
          <Route path="/kolhapur-2026" element={<EventRegistrationPage />} />
          <Route path="/Kolhapur-2026" element={<EventRegistrationPage />} />
          
          {/* Generic slug route for other events - Must be after all other routes */}
          <Route path="/:slug" element={<EventRegistrationPage />} />
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;
