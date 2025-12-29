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
import EventRegistrations from './pages/EventRegistrations';
import AccountDeletion from './pages/AccountDeletion';
import { useAuth } from './contexts/AuthContext';

const DashboardRoute = () => {
  const { hasRole } = useAuth();

  if (hasRole('manager')) {
    return <Navigate to="/event-registrations" replace />;
  }

  return <Dashboard />;
};

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/delete-account" element={<AccountDeletion />} />
          
          {/* Test route to verify routing works */}
          <Route path="/test-route" element={<div style={{padding: '20px'}}><h1>Test Route Works!</h1></div>} />
          
          {/* Protected Routes - Require Authentication */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardRoute /></ProtectedRoute>} />
          <Route path="/vendors" element={<ProtectedRoute><VendorList /></ProtectedRoute>} />
          <Route path="/add-vendor" element={<ProtectedRoute><AddVendorForm /></ProtectedRoute>} />
          <Route path="/bod" element={<ProtectedRoute><BODList /></ProtectedRoute>} />
          <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
          <Route path="/events/new" element={<ProtectedRoute><EventForm /></ProtectedRoute>} />
          <Route path="/events/:eventId" element={<ProtectedRoute><EventDetails /></ProtectedRoute>} />
          <Route path="/events/:eventId/edit" element={<ProtectedRoute><EventForm /></ProtectedRoute>} />
          <Route path="/event-registrations" element={<ProtectedRoute requiredRoles={['manager']} requiredPermission="registrations:read"><EventRegistrations /></ProtectedRoute>} />
          <Route path="/members" element={<ProtectedRoute><Members /></ProtectedRoute>} />
          <Route path="/associations" element={<ProtectedRoute><Associations /></ProtectedRoute>} />
          <Route path="/associations/:associationId" element={<ProtectedRoute><AssociationDetail /></ProtectedRoute>} />
          <Route path="/associations/:associationId/members" element={<ProtectedRoute><AssociationMembers /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          
          {/* Public Event Registration Routes - Generic slug route handles all event slugs */}
          {/* The component handles slug to event ID mapping internally */}
          <Route path="/:slug" element={<EventRegistrationPage />} />
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;
