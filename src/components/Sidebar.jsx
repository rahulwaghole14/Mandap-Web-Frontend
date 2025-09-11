
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Award, 
  Building, 
  MapPin, 
  LogOut, 
  User,
  Settings
} from 'lucide-react';
import toast from 'react-hot-toast';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, hasRole, hasPermission } = useAuth();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: null, show: true },
    { name: 'Vendors', href: '/vendors', icon: Users, permission: 'vendors:read', show: true },
    { name: 'Events', href: '/events', icon: Calendar, permission: 'events:read', show: true },
    { name: 'NBOD', href: '/bod', icon: Award, permission: 'bod:read', show: true },
    { name: 'Members', href: '/members', icon: Building, permission: 'members:read', show: true },
    { name: 'Associations', href: '/associations', icon: MapPin, permission: null, show: true },
  ];

  const isActive = (href) => {
    if (href === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname === href;
  };

  const shouldShowNavigationItem = (item) => {
    // If no permission required, always show
    if (!item.permission) {
      return true;
    }
    
    // Admin has access to everything
    if (hasRole('admin')) {
      return true;
    }
    
    // Sub-admin needs specific permission
    if (hasRole('sub-admin')) {
      return hasPermission(item.permission);
    }
    
    // Regular users need specific permission
    return hasPermission(item.permission);
  };

  return (
    <div className="w-64 bg-gray-900 text-white h-screen flex flex-col sticky top-0 flex-shrink-0" style={{ width: '256px', minWidth: '256px', maxWidth: '256px' }}>
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <h2 className="text-xl font-semibold text-white">Mandapam Admin</h2>
        <p className="text-sm text-gray-400 mt-1">Association Platform</p>
      </div>

      {/* User Info */}
      {user && (
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-primary-600 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user.name || user.email}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          // Check if user should see this navigation item
          const shouldShow = shouldShowNavigationItem(item);
          
          if (!shouldShow) {
            return null;
          }
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                isActive(item.href)
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700 space-y-2">
        {user && (
          <>
            <Link
              to="/settings"
              className="flex items-center space-x-3 px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
            >
              <Settings className="h-5 w-5" />
              <span className="text-sm font-medium">Settings</span>
            </Link>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
