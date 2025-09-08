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
import Members from './pages/Members';
import Associations from './pages/Associations';
import AssociationDetail from './pages/AssociationDetail';
import AssociationMembers from './pages/AssociationMembers';
import Settings from './pages/Settings';

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          
          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/vendors" element={
            <ProtectedRoute requiredPermission="vendors:read">
              <VendorList />
            </ProtectedRoute>
          } />
          
          <Route path="/add-vendor" element={
            <ProtectedRoute requiredPermission="vendors:write">
              <AddVendorForm />
            </ProtectedRoute>
          } />
          
          <Route path="/bod" element={
            <ProtectedRoute requiredPermission="bod:read">
              <BODList />
            </ProtectedRoute>
          } />
          
          <Route path="/events" element={
            <ProtectedRoute requiredPermission="events:read">
              <Events />
            </ProtectedRoute>
          } />
          
          <Route path="/members" element={
            <ProtectedRoute requiredPermission="members:read">
              <Members />
            </ProtectedRoute>
          } />
          
          <Route path="/associations" element={
            <ProtectedRoute>
              <Associations />
            </ProtectedRoute>
          } />
          
          <Route path="/associations/:associationId" element={
            <ProtectedRoute>
              <AssociationDetail />
            </ProtectedRoute>
          } />
          
          <Route path="/associations/:associationId/members" element={
            <ProtectedRoute>
              <AssociationMembers />
            </ProtectedRoute>
          } />
          
          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;
