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
          
          {/* Development Routes - All Public for Testing */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/vendors" element={<VendorList />} />
          <Route path="/add-vendor" element={<AddVendorForm />} />
          <Route path="/bod" element={<BODList />} />
          <Route path="/events" element={<Events />} />
          <Route path="/members" element={<Members />} />
          <Route path="/associations" element={<Associations />} />
          <Route path="/associations/:associationId" element={<AssociationDetail />} />
          <Route path="/associations/:associationId/members" element={<AssociationMembers />} />
          <Route path="/settings" element={<Settings />} />
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;
