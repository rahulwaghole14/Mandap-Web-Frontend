import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Search, Filter, Eye, Edit, Trash2, Plus, Download, UserCheck, UserX, Loader2 } from 'lucide-react';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { memberApi } from '../services/memberApi';
import AddMemberForm from '../components/AddMemberForm';
import EditMemberForm from '../components/EditMemberForm';
import { formatDateForDisplay, calculateAge } from '../utils/dateUtils';

const Members = () => {
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  // Fetch members from API
  useEffect(() => {
    fetchMembers();
    fetchStats();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await memberApi.getMembers({
        search,
        city,
        status
      });
      setMembers(response.members || []);
    } catch (error) {
      console.error('Error fetching members:', error);
      setError('Failed to fetch members');
      toast.error('Failed to fetch members');
    } finally {
      setLoading(false);
    }
  };

  // Refresh members when filters change
  useEffect(() => {
    fetchMembers();
  }, [search, city, businessType]);

  const fetchStats = async () => {
    try {
      const response = await memberApi.getMemberStats();
      setStats(response.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const filtered = members.filter(member =>
    (member.name.toLowerCase().includes(search.toLowerCase()) ||
     member.businessName.toLowerCase().includes(search.toLowerCase())) &&
    (city === '' || member.city === city) &&
    (businessType === '' || member.businessType === businessType)
  );

  const cities = [...new Set(members.map(m => m.city).filter(Boolean))];
  const businessTypes = ['sound', 'decorator', 'catering', 'generator', 'madap', 'light'];

  const getBusinessTypeColor = (type) => {
    switch (type) {
      case 'sound': return 'bg-blue-100 text-blue-800';
      case 'decorator': return 'bg-purple-100 text-purple-800';
      case 'catering': return 'bg-green-100 text-green-800';
      case 'generator': return 'bg-yellow-100 text-yellow-800';
      case 'madap': return 'bg-red-100 text-red-800';
      case 'light': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleView = (member) => {
    setSelectedMember(member);
    setShowViewModal(true);
  };

  const handleEdit = (member) => {
    setSelectedMember(member);
    setShowEditModal(true);
  };

  const handleDelete = (member) => {
    setSelectedMember(member);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await memberApi.deleteMember(selectedMember._id);
      toast.success(`Member ${selectedMember.name} deleted successfully`);
      setShowDeleteModal(false);
      setSelectedMember(null);
      fetchMembers(); // Refresh the list
    } catch (error) {
      toast.error('Failed to delete member');
    }
  };

  const exportMembers = () => {
    toast.success('Members list exported successfully');
  };



  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Members Management</h1>
            <p className="text-gray-600 mt-2">Manage association members and their status</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={exportMembers}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>

          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search by name or email"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
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
                 <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
               ))}
             </select>
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex justify-between items-center">
          <p className="text-gray-600">
            Showing <span className="font-semibold">{filtered.length}</span> of <span className="font-semibold">{members.length}</span> members
          </p>
          <button
            onClick={fetchMembers}
            className="px-3 py-1 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Refresh
          </button>
        </div>

        {/* Loading and Error States */}
        {loading && (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary-600" />
            <p className="mt-2 text-gray-600">Loading members...</p>
          </div>
        )}

        {error && !loading && (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchMembers}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Members Table */}
        {!loading && !error && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                                 <tr>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business</th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Birth Date</th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business Type</th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Association</th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                 </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map(member => (
                  <tr key={member._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{member.name}</div>
                          <div className="text-sm text-gray-500">ID: {member.id}</div>
                        </div>
                      </div>
                    </td>
                                         <td className="px-6 py-4 whitespace-nowrap">
                       <div>
                         <div className="text-sm text-gray-900">{member.businessName}</div>
                         <div className="text-sm text-gray-500">{member.phone}</div>
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
                       </div>
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap">
                       <div className="space-y-1">
                         <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getBusinessTypeColor(member.businessType)}`}>
                           {member.businessType ? member.businessType.charAt(0).toUpperCase() + member.businessType.slice(1) : 'N/A'}
                         </span>
                       </div>
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap">
                       <div className="text-sm text-gray-900">{member.associationName}</div>
                     </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleView(member)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(member)}
                          className="text-yellow-600 hover:text-yellow-900 p-1"
                          title="Edit Member"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(member)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Delete Member"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}
      </div>

      {/* View Member Modal */}
      <Modal title="Member Details" isOpen={showViewModal} onClose={() => setShowViewModal(false)}>
        {selectedMember && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="h-20 w-20 rounded-full bg-gray-300 flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-medium text-gray-700">
                  {selectedMember.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <h3 className="text-lg font-medium text-gray-900">{selectedMember.name}</h3>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getBusinessTypeColor(selectedMember.businessType)}`}>
                {selectedMember.businessType ? selectedMember.businessType.charAt(0).toUpperCase() + selectedMember.businessType.slice(1) : 'N/A'}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Member ID</label>
                <p className="text-sm text-gray-900">{selectedMember._id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Business Name</label>
                <p className="text-sm text-gray-900">{selectedMember.businessName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <p className="text-sm text-gray-900">{selectedMember.phone}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Business Type</label>
                <p className="text-sm text-gray-900">{selectedMember.businessType ? selectedMember.businessType.charAt(0).toUpperCase() + selectedMember.businessType.slice(1) : 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">City</label>
                <p className="text-sm text-gray-900">{selectedMember.city}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">State</label>
                <p className="text-sm text-gray-900">{selectedMember.state}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Pincode</label>
                <p className="text-sm text-gray-900">{selectedMember.pincode}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Association Name</label>
                <p className="text-sm text-gray-900">{selectedMember.associationName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Birth Date</label>
                <p className="text-sm text-gray-900">{formatDateForDisplay(selectedMember.birthDate)}</p>
                {selectedMember.birthDate && (
                  <p className="text-xs text-gray-500">Age: {calculateAge(selectedMember.birthDate)} years</p>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal title="Confirm Delete" isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete <strong>{selectedMember?.name}</strong>? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete Member
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Member Modal */}
      <Modal title="Add New Member" isOpen={showAddModal} onClose={() => setShowAddModal(false)} size="lg">
        <AddMemberForm 
          onSuccess={(newMember) => {
            setMembers(prev => [newMember, ...prev]);
            setShowAddModal(false);
            toast.success('Member added successfully!');
          }}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>

      {/* Edit Member Modal */}
      <Modal title="Edit Member" isOpen={showEditModal} onClose={() => setShowEditModal(false)} size="lg">
        {selectedMember && (
          <EditMemberForm 
            member={selectedMember}
            onSuccess={(updatedMember) => {
              setMembers(prev => prev.map(m => m._id === updatedMember._id ? updatedMember : m));
              setShowEditModal(false);
              setSelectedMember(null);
              toast.success('Member updated successfully!');
            }}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedMember(null);
            }}
          />
        )}
      </Modal>
    </Layout>
  );
};

export default Members;
