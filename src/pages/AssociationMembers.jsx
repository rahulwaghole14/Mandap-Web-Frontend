import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { ArrowLeft, Search, User, Building, Loader2, MapPin, Phone, Mail, CalendarDays, Plus, Crown } from 'lucide-react';
import { memberApi } from '../services/memberApi';
import { associationApi } from '../services/associationApi';
import Modal from '../components/Modal';
import AddAssociationMemberForm from '../components/AddAssociationMemberForm';
import AssociationBODManager from '../components/AssociationBODManager';
import toast from 'react-hot-toast';
import { formatDateForDisplay, calculateAge } from '../utils/dateUtils';

const AssociationMembers = () => {
  const { associationId } = useParams();
  const navigate = useNavigate();
  const [association, setAssociation] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [activeTab, setActiveTab] = useState('members'); // 'members' or 'bod'

  useEffect(() => {
    if (associationId) {
      fetchAssociationDetails();
    }
  }, [associationId]);

  useEffect(() => {
    if (association) {
      fetchAssociationMembers();
    }
  }, [association]);

  const fetchAssociationDetails = async () => {
    try {
      const response = await associationApi.getAssociation(associationId);
      setAssociation(response.association);
    } catch (error) {
      console.error('Error fetching association details:', error);
      toast.error('Failed to fetch association details');
    }
  };

  const fetchAssociationMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get all members and filter by association name
      const response = await memberApi.getMembers();
      const allMembers = response.members || [];
      
      console.log('All members from API:', allMembers);
      console.log('Current association:', association);
      console.log('Association name to filter by:', association?.name);
      
      // Debug: Check what association names exist in members
      const memberAssociationNames = allMembers.map(m => m?.associationName).filter(Boolean);
      console.log('All member association names:', [...new Set(memberAssociationNames)]);
      
      // Filter members by association name and ensure they have required properties
      const associationMembers = allMembers.filter(member => {
        const matches = member && 
          member.associationName === association?.name &&
          (member._id || member.id);
        console.log(`Member ${member?.name}: associationName="${member?.associationName}", matches=${matches}`);
        return matches;
      });

      // If no members found with exact name match, try case-insensitive match
      if (associationMembers.length === 0 && association?.name) {
        console.log('No exact match found, trying case-insensitive match...');
        const caseInsensitiveMembers = allMembers.filter(member => {
          const matches = member && 
            member.associationName?.toLowerCase() === association?.name?.toLowerCase() &&
            (member._id || member.id);
          console.log(`Case-insensitive match for ${member?.name}: associationName="${member?.associationName}", matches=${matches}`);
          return matches;
        });
        console.log('Case-insensitive filtered members:', caseInsensitiveMembers);
        setMembers(caseInsensitiveMembers);
        return;
      }
      
      console.log('Filtered association members:', associationMembers);
      
      setMembers(associationMembers);
    } catch (error) {
      console.error('Error fetching association members:', error);
      setError('Failed to fetch association members. Please try again.');
      toast.error('Failed to fetch association members');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMemberSuccess = (newMember) => {
    setShowAddMemberModal(false);
    fetchAssociationMembers(); // Refresh the members list
    toast.success(`Member ${newMember.name} added successfully to ${association?.name}`);
  };

  const handleBODUpdate = () => {
    // Refresh members list when BOD is updated
    fetchAssociationMembers();
  };

  const filteredMembers = members.filter(member =>
    member &&
    member.name &&
    member.name.toLowerCase().includes(search.toLowerCase()) &&
    (city === '' || member.city === city) &&
    (businessType === '' || member.businessType === businessType)
  );

  console.log('Members state:', members);
  console.log('Filtered members:', filteredMembers);
  console.log('Search term:', search);
  console.log('City filter:', city);
  console.log('Business type filter:', businessType);

  const cities = [...new Set(members.filter(m => m && m.city).map(m => m.city))];
  const businessTypes = [...new Set(members.filter(m => m && m.businessType).map(m => m.businessType))];

  const getBusinessTypeColor = (type) => {
    const colors = {
      'sound': 'bg-blue-100 text-blue-800',
      'decorator': 'bg-purple-100 text-purple-800',
      'catering': 'bg-orange-100 text-orange-800',
      'generator': 'bg-green-100 text-green-800',
      'madap': 'bg-red-100 text-red-800',
      'light': 'bg-yellow-100 text-yellow-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-red-600 text-lg font-semibold mb-2">Error</div>
            <div className="text-gray-600 mb-4">{error}</div>
            <button
              onClick={() => navigate('/associations')}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Back to Associations
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/associations')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {association?.name}
                </h1>
                <p className="text-gray-600 mt-1">
                  {activeTab === 'members' 
                    ? `${members.length} member${members.length !== 1 ? 's' : ''} in this association`
                    : 'Manage Board of Directors'
                  }
                </p>
              </div>
            </div>
            {activeTab === 'members' && (
              <button
                onClick={() => setShowAddMemberModal(true)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Member</span>
              </button>
            )}
          </div>

          {/* Association Info Card */}
          {association && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                    <Building className="h-6 w-6 text-primary-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {association.name}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {association.city || 'N/A'}, {association.district || 'N/A'}, {association.state || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CalendarDays className="h-4 w-4" />
                      <span>
                        Established: {association.establishedYear || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        association.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {association.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('members')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'members'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Members ({members.length})</span>
                </div>
              </button>
                                   <button
                       onClick={() => setActiveTab('bod')}
                       className={`py-2 px-1 border-b-2 font-medium text-sm ${
                         activeTab === 'bod'
                           ? 'border-primary-500 text-primary-600'
                           : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                       }`}
                     >
                       <div className="flex items-center space-x-2">
                         <Crown className="h-4 w-4" />
                         <span>Board of Directors</span>
                       </div>
                     </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'members' ? (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search members by name..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
                
                <select 
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                >
                  <option value="">All Cities</option>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                
                <select 
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                >
                  <option value="">All Business Types</option>
                  {businessTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Results Summary */}
            <div className="flex justify-between items-center">
              <p className="text-gray-600">
                Showing <span className="font-semibold">{filteredMembers.length}</span> of <span className="font-semibold">{members.length}</span> members
              </p>
            </div>

            {/* Members Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Birth Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(() => {
                      const validMembers = filteredMembers.filter(member => member && (member._id || member.id));
                      console.log('Valid members for table rendering:', validMembers);
                      return validMembers.map(member => (
                      <tr key={member._id || member.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                                <User className="h-5 w-5 text-primary-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{member.name}</div>
                              <div className="text-sm text-gray-500">Member ID: {member._id ? member._id.slice(-8) : member.id || 'N/A'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{member.businessName}</div>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getBusinessTypeColor(member.businessType)}`}>
                              {member.businessType || 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm text-gray-900">{formatDateForDisplay(member.birthDate)}</div>
                            {member.birthDate && (
                              <div className="text-sm text-gray-500">Age: {calculateAge(member.birthDate)} years</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm text-gray-900">{member.city}</div>
                            <div className="text-sm text-gray-500">{member.state}</div>
                            <div className="text-sm text-gray-500">{member.pincode}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{member.phone}</div>
                        </td>
                      </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            {filteredMembers.length === 0 && (
              <div className="text-center py-12">
                <User className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No members found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {search || city || businessType 
                    ? 'Try adjusting your search criteria.'
                    : 'This association has no members yet.'
                  }
                </p>
                {!search && !city && !businessType && (
                  <div className="mt-6">
                    <button
                      onClick={() => setShowAddMemberModal(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                    >
                      <Plus className="-ml-1 mr-2 h-5 w-5" />
                      Add First Member
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <AssociationBODManager
            association={association}
            members={members}
            onBODUpdate={handleBODUpdate}
          />
        )}
      </div>

      {/* Add Member Modal */}
      <Modal 
        title="Add New Member" 
        isOpen={showAddMemberModal} 
        onClose={() => setShowAddMemberModal(false)}
        size="lg"
      >
        <AddAssociationMemberForm
          association={association}
          onSuccess={handleAddMemberSuccess}
          onCancel={() => setShowAddMemberModal(false)}
        />
      </Modal>
    </Layout>
  );
};

export default AssociationMembers;
