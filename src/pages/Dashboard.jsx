import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Users, Calendar, Award, TrendingUp, Building, Loader2, RefreshCw } from 'lucide-react';
import { dashboardApi } from '../services/dashboardApi';
// import AssociationMap from '../components/AssociationMap'; // Hidden for now
import PerformanceChart from '../components/PerformanceChart';
import TopAssociations from '../components/TopAssociations';
import { formatDateForDisplay, calculateAge } from '../utils/dateUtils';
import ErrorBoundary from '../components/ErrorBoundary';
import { 
  StatCardSkeleton, 
  ChartSkeleton, 
  TableSkeleton, 
  TopAssociationsSkeleton,
  LoadingSpinner 
} from '../components/SkeletonLoader';
import LoadingProgress from '../components/LoadingProgress';
import useProgressiveLoading from '../hooks/useProgressiveLoading';

import toast from 'react-hot-toast';

const Dashboard = () => {
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);
  const hasLoadedRef = useRef(false);
  
  // Use progressive loading hook
  const {
    loadingStates,
    errors,
    data,
    setLoading,
    setError,
    setDataForSection,
    isCriticalDataLoading,
    isSecondaryDataLoading,
    isAllDataLoaded,
    hasErrors,
    getCriticalProgress,
    getOverallProgress,
    reset
  } = useProgressiveLoading();

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



  // Load specific critical data section
  const loadSpecificCriticalData = async (section) => {
    try {
      setLoading(section, true);
      setError(section, null);
      
      switch (section) {
        case 'stats':
          const statsResponse = await dashboardApi.getDashboardStats();
          
          const transformedStats = [
            { 
              title: 'Total Vendors', 
              value: statsResponse.stats.vendors.total, 
              icon: Users, 
              color: 'bg-blue-500',
              subtitle: `${statsResponse.stats.vendors.active} Active`,
              path: '/vendors'
            },
            { 
              title: 'Active Members', 
              value: statsResponse.stats.members.total, 
              icon: Building, 
              color: 'bg-green-500',
              subtitle: `${statsResponse.stats.members.active} Active`,
              path: '/members'
            },
            { 
              title: 'Upcoming Events', 
              value: statsResponse.stats.events.total, 
              icon: Calendar, 
              color: 'bg-purple-500',
              subtitle: `${statsResponse.stats.events.upcoming} Upcoming`,
              path: '/events'
            },
            { 
              title: 'BOD Members', 
              value: statsResponse.stats.bod.total, 
              icon: Award, 
              color: 'bg-yellow-500',
              subtitle: `${statsResponse.stats.bod.active} Active`,
              path: '/bod'
            },
            { 
              title: 'Associations', 
              value: statsResponse.stats.associations.total, 
              icon: Building, 
              color: 'bg-indigo-500',
              subtitle: `${statsResponse.stats.associations.active} Active`,
              path: '/associations'
            },
            { 
              title: 'Revenue', 
              value: '₹0', 
              icon: TrendingUp, 
              color: 'bg-emerald-500',
              subtitle: 'Total Revenue',
              path: null
            }
          ];
          
          setDataForSection('stats', transformedStats);
          break;
        case 'recentMembers':
          const membersResponse = await dashboardApi.getRecentMembers(8);
          setDataForSection('recentMembers', membersResponse.members || []);
          break;
        default:
          throw new Error(`Unknown critical section: ${section}`);
      }
      
      setLoading(section, false);
    } catch (error) {
      console.error(`Error loading ${section}:`, error);
      setError(section, error.message);
      setLoading(section, false);
      toast.error(`Failed to load ${section}`);
    }
  };

  // Load critical data first (stats and recent members)
  const loadCriticalData = async () => {
    try {
      // Load stats
      await loadSpecificCriticalData('stats');
      
      // Load recent members
      await loadSpecificCriticalData('recentMembers');
      
    } catch (error) {
      console.error('Error loading critical data:', error);
      toast.error('Failed to load critical dashboard data');
    }
  };

  // Load specific secondary data section
  const loadSpecificSecondaryData = async (section) => {
    try {
      setLoading(section, true);
      setError(section, null);
      
      switch (section) {
        case 'associations':
          const associationsResponse = await dashboardApi.getAssociationsForMap();
          setDataForSection('associations', associationsResponse.associations || []);
          break;
        case 'monthlyData':
          const monthlyDataResponse = await dashboardApi.getMonthlyMemberGrowth();
          setDataForSection('monthlyData', monthlyDataResponse.monthlyData || []);
          break;
        case 'topAssociations':
          const topAssociationsResponse = await dashboardApi.getTopAssociations(5);
          setDataForSection('topAssociations', topAssociationsResponse.associations || []);
          break;
        default:
          throw new Error(`Unknown section: ${section}`);
      }
      
      setLoading(section, false);
    } catch (error) {
      console.error(`Error loading ${section}:`, error);
      setError(section, error.message);
      setLoading(section, false);
      toast.error(`Failed to load ${section}`);
    }
  };

  // Load all secondary data (charts and associations)
  const loadSecondaryData = async () => {
    try {
      // Load associations for map
      await loadSpecificSecondaryData('associations');
      
      // Load monthly data
      await loadSpecificSecondaryData('monthlyData');
      
      // Load top associations
      await loadSpecificSecondaryData('topAssociations');
      
    } catch (error) {
      console.error('Error loading secondary data:', error);
      toast.error('Failed to load some dashboard data');
    }
  };

  // Main data loading function
  const fetchDashboardData = async () => {
    try {
      reset();
      
      // Load critical data first
      await loadCriticalData();
      
      // Small delay to show progressive loading
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Load secondary data
      await loadSecondaryData();
      
    } catch (error) {
      console.error('Error in fetchDashboardData:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setRefreshing(false);
    }
  };

  // Refresh dashboard data
  const handleRefresh = () => {
    setRefreshing(true);
    hasLoadedRef.current = false; // Reset the ref to allow reloading
    fetchDashboardData();
  };



  // Load data on component mount
  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      fetchDashboardData();
    }
  }, []);

  // Show progress indicator if critical data is still loading
  if (isCriticalDataLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-2">Welcome to the Mandapam Association Admin Portal</p>
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
          
          {/* Progress indicator */}
          <div className="bg-white rounded-lg shadow p-6">
            <LoadingProgress 
              progress={getCriticalProgress()} 
              message="Loading critical dashboard data..."
              size="large"
            />
          </div>
          
          {/* Skeleton for stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <StatCardSkeleton key={index} />
            ))}
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
            <p className="text-gray-600 mt-2">Welcome to the Mandapam Association Admin Portal</p>
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
        <ErrorBoundary title="Statistics Cards" message="Failed to load dashboard statistics">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loadingStates.stats ? (
              Array.from({ length: 6 }).map((_, index) => (
                <StatCardSkeleton key={index} />
              ))
            ) : errors.stats ? (
              <div className="col-span-full">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                  <p className="text-red-600">Failed to load statistics</p>
                  <button
                    onClick={() => loadSpecificCriticalData('stats')}
                    className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : (
              data.stats?.map((stat, index) => (
                <div 
                  key={index} 
                  className={`bg-white rounded-lg shadow p-6 transition-all ${
                    stat.path 
                      ? 'hover:shadow-lg hover:scale-105 cursor-pointer' 
                      : 'hover:shadow-lg'
                  }`}
                  onClick={() => stat.path && navigate(stat.path)}
                >
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
              ))
            )}
          </div>
        </ErrorBoundary>
{/* Association Map - Hidden for now */}
{/* <AssociationMap associations={associations} /> */}

        {/* Performance Chart and Top Associations in single row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ErrorBoundary title="Performance Chart" message="Failed to load performance chart">
            {loadingStates.monthlyData ? (
              <ChartSkeleton />
            ) : errors.monthlyData ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <p className="text-red-600">Failed to load performance chart</p>
                  <button
                    onClick={() => loadSpecificSecondaryData('monthlyData')}
                    className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Retry
                  </button>
              </div>
            ) : (
              <PerformanceChart monthlyData={data.monthlyData || []} />
            )}
          </ErrorBoundary>
          
          <ErrorBoundary title="Top Associations" message="Failed to load top associations">
            {loadingStates.topAssociations ? (
              <TopAssociationsSkeleton />
            ) : errors.topAssociations ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <p className="text-red-600">Failed to load top associations</p>
                  <button
                    onClick={() => loadSpecificSecondaryData('topAssociations')}
                    className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Retry
                  </button>
              </div>
            ) : (
              <TopAssociations associations={data.topAssociations || []} />
            )}
          </ErrorBoundary>
        </div>
        {/* Recent Members */}
        <ErrorBoundary title="Recent Members" message="Failed to load recent members">
          {loadingStates.recentMembers ? (
            <TableSkeleton />
          ) : errors.recentMembers ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-600">Failed to load recent members</p>
                <button
                  onClick={() => loadSpecificCriticalData('recentMembers')}
                  className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Retry
                </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Members</h3>
              </div>
              <div className="p-6">
                {(!data.recentMembers || data.recentMembers.length === 0) ? (
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
                        {data.recentMembers.map((member, index) => (
                          <tr key={index} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  {member.profileImage ? (
                                    <img 
                                      className="h-10 w-10 rounded-full object-cover" 
                                      src={`http://localhost:5000/uploads/${member.profileImage}`} 
                                      alt={member.name}
                                      crossOrigin="anonymous"
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
          )}
        </ErrorBoundary>


      </div>
    </Layout>
  );
};

export default Dashboard;