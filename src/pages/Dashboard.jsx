import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Users, Calendar, Award, TrendingUp, Building, Loader2, RefreshCw } from 'lucide-react';
import { dashboardApi } from '../services/dashboardApi';
import AssociationMap from '../components/AssociationMap';
import PerformanceChart from '../components/PerformanceChart';
import TopAssociations from '../components/TopAssociations';
import { formatDateForDisplay, calculateAge } from '../utils/dateUtils';

import toast from 'react-hot-toast';

const Dashboard = () => {

  const [stats, setStats] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [associations, setAssociations] = useState([]);
const [monthlyMemberData, setMonthlyMemberData] = useState([]);
const [topAssociations, setTopAssociations] = useState([]);

  // Format time ago
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
    return `${Math.floor(diffInSeconds / 31536000)} years ago`;
  };



  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setError(null);
      const [statsResponse, membersResponse, associationsResponse, monthlyDataResponse, topAssociationsResponse] = await Promise.all([
        dashboardApi.getDashboardStats(),
        dashboardApi.getRecentMembers(8),
        dashboardApi.getAssociationsForMap(),
        dashboardApi.getMonthlyMemberGrowth(),
        dashboardApi.getTopAssociations(10)
      ]);

      // Transform stats data
      const transformedStats = [
        { 
          title: 'Total Vendors', 
          value: statsResponse.stats.vendors.total, 
          icon: Users, 
          color: 'bg-blue-500',
          subtitle: `${statsResponse.stats.vendors.active} Active`
        },
        { 
          title: 'Active Members', 
          value: statsResponse.stats.members.total, 
          icon: Building, 
          color: 'bg-green-500',
          subtitle: `${statsResponse.stats.members.active} Active`
        },
        { 
          title: 'Upcoming Events', 
          value: statsResponse.stats.events.total, 
          icon: Calendar, 
          color: 'bg-purple-500',
          subtitle: `${statsResponse.stats.events.upcoming} Upcoming`
        },
        { 
          title: 'BOD Members', 
          value: statsResponse.stats.bod.total, 
          icon: Award, 
          color: 'bg-yellow-500',
          subtitle: `${statsResponse.stats.bod.active} Active`
        },
        { 
          title: 'Associations', 
          value: statsResponse.stats.associations.total, 
          icon: Building, 
          color: 'bg-indigo-500',
          subtitle: `${statsResponse.stats.associations.active} Active`
        },
        { 
          title: 'Revenue', 
          value: '₹0', 
          icon: TrendingUp, 
          color: 'bg-emerald-500',
          subtitle: 'Total Revenue'
        }
      ];
      setAssociations(associationsResponse.associations || []);
      setMonthlyMemberData(monthlyDataResponse.monthlyData || []);
      setTopAssociations(topAssociationsResponse.associations || []);
      
      // Debug logging
      console.log('Top Associations Response:', topAssociationsResponse);
      console.log('Top Associations Response type:', typeof topAssociationsResponse);
      console.log('Top Associations Response keys:', Object.keys(topAssociationsResponse));
      console.log('Top Associations Data:', topAssociationsResponse.associations);
      console.log('Top Associations Data type:', typeof topAssociationsResponse.associations);
      console.log('Top Associations Data length:', topAssociationsResponse.associations?.length);
      console.log('Setting topAssociations state to:', topAssociationsResponse.associations || []);
      
      setStats(transformedStats);
      setRecentActivities(membersResponse.members || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refresh dashboard data
  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };



  // Load data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Loading state
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="h-12 w-12 text-primary-600 animate-spin mx-auto mb-4" />
            <p className="text-lg text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Error state
  if (error) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-2">Welcome to the Mandap Association Admin Portal</p>
            </div>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Retry</span>
            </button>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600 text-lg font-medium">{error}</p>
            <button
              onClick={handleRefresh}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header with refresh button */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-2">Welcome to the Mandap Association Admin Portal</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center">
                <div className={`p-3 rounded-full ${stat.color} text-white`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                  {stat.subtitle && (
                    <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
{/* Association Map */}
<AssociationMap associations={associations} />

{/* Performance Chart and Top Associations in single row */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <PerformanceChart monthlyMemberData={monthlyMemberData} />
  <TopAssociations topAssociations={topAssociations} />
</div>
        {/* Recent Members */}
<div className="bg-white rounded-lg shadow">
  <div className="px-6 py-4 border-b border-gray-200">
    <h3 className="text-lg font-medium text-gray-900">Recent Members</h3>
  </div>
  <div className="p-6">
    {recentActivities.length === 0 ? (
      <div className="text-center py-8">
        <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No recent members</p>
      </div>
    ) : (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Member Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Association Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Business Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Birth Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date Added
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {recentActivities.map((member, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      {member.profileImage ? (
                        <img 
                          className="h-10 w-10 rounded-full object-cover" 
                          src={`http://localhost:5000/uploads/${member.profileImage}`} 
                          alt={member.name}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            if (e.target.nextSibling) {
                              e.target.nextSibling.style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}
                      <div className={`h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center ${member.profileImage ? 'hidden' : 'flex'}`}>
                        <Building className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{member.name}</div>
                      <div className="text-sm text-gray-500">{member.city}, {member.state}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{member.associationName || 'N/A'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{member.businessName || 'N/A'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{formatDateForDisplay(member.birthDate)}</div>
                  {member.birthDate && (
                    <div className="text-xs text-gray-500">Age: {calculateAge(member.birthDate)} years</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{member.phone || 'N/A'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{formatTimeAgo(member.dateAdded)}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(member.dateAdded).toLocaleDateString()}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
</div>


      </div>
    </Layout>
  );
};

export default Dashboard;