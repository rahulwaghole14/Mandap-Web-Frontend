
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Search, Filter, Eye, Edit, Trash2, Plus, Download, Loader2 } from 'lucide-react';
import Modal from '../components/Modal';
import AddVendorForm from './AddVendorForm';
import { vendorApi } from '../services/vendorApi';
import toast from 'react-hot-toast';

const VendorList = () => {
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddVendorModal, setShowAddVendorModal] = useState(false);

  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch vendors from API on component mount
  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await vendorApi.getVendors();
      setVendors(response.vendors || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      setError('Failed to fetch vendors. Please try again.');
      toast.error('Failed to fetch vendors');
    } finally {
      setLoading(false);
    }
  };

  const filtered = vendors.filter(v =>
    (v.name.toLowerCase().includes(search.toLowerCase()) ||
     v.businessName.toLowerCase().includes(search.toLowerCase())) &&
    (city === '' || v.address?.city === city) &&
    (category === '' || v.category === category) &&
    (status === '' || v.status === status)
  );

  const cities = [...new Set(vendors.map(v => v.address?.city).filter(Boolean))];
  const categories = [...new Set(vendors.map(v => v.category).filter(Boolean))];
  const statuses = ['Pending', 'Active', 'Inactive', 'Suspended'];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Inactive': return 'bg-gray-100 text-gray-800';
      case 'Suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleView = (vendor) => {
    setSelectedVendor(vendor);
    setShowViewModal(true);
  };

  const handleEdit = (vendor) => {
    console.log('Edit vendor clicked:', vendor);
    if (vendor && vendor._id) {
      setSelectedVendor(vendor);
      setShowEditModal(true);
    } else {
      toast.error('Invalid vendor data for editing');
    }
  };

  const handleDelete = (vendor) => {
    setSelectedVendor(vendor);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      // Delete vendor via API
      await vendorApi.deleteVendor(selectedVendor._id);
      
      // Remove vendor from list
      setVendors(prevVendors => prevVendors.filter(v => v._id !== selectedVendor._id));
      
      toast.success(`Vendor ${selectedVendor.name} deleted successfully`);
      setShowDeleteModal(false);
      setSelectedVendor(null);
    } catch (error) {
      console.error('Error deleting vendor:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete vendor';
      toast.error(errorMessage);
    }
  };

  const exportVendors = () => {
    // Handle export logic here
    toast.success('Vendor list exported successfully');
  };

  const handleAddVendor = () => {
    setShowAddVendorModal(true);
  };

  const handleVendorAdded = async (newVendorData) => {
    try {
      // Transform form data to match backend schema
      const vendorData = {
        name: newVendorData.name,
        businessName: newVendorData.businessName,
        category: newVendorData.category,
        status: newVendorData.status || 'Active',
        phone: newVendorData.phone,
        email: newVendorData.email,
        address: {
          street: newVendorData.street || '',
          city: newVendorData.city,
          district: newVendorData.district,
          state: newVendorData.state,
          pincode: newVendorData.pincode
        },
        membershipExpiry: newVendorData.membershipExpiry || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        description: newVendorData.description || '',
        services: newVendorData.services || [],
        pricing: {
          startingPrice: newVendorData.startingPrice || 0
        }
      };

      // Create vendor via API
      const response = await vendorApi.createVendor(vendorData);
      
      // Add new vendor to the list
      setVendors(prevVendors => [...prevVendors, response.vendor]);
      
      // Close modal and show success message
      setShowAddVendorModal(false);
      toast.success('Vendor added successfully!');
    } catch (error) {
      console.error('Error adding vendor:', error);
      const errorMessage = error.response?.data?.message || 'Failed to add vendor';
      toast.error(errorMessage);
    }
  };

  const handleVendorUpdated = async (updatedVendorData) => {
    try {
      // Transform form data to match backend schema
      const vendorData = {
        name: updatedVendorData.name,
        businessName: updatedVendorData.businessName,
        category: updatedVendorData.category,
        status: updatedVendorData.status || 'Active',
        phone: updatedVendorData.phone,
        email: updatedVendorData.email,
        address: {
          street: updatedVendorData.street || '',
          city: updatedVendorData.city,
          district: updatedVendorData.district,
          state: updatedVendorData.state,
          pincode: updatedVendorData.pincode
        },
        membershipExpiry: updatedVendorData.membershipExpiry || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        description: updatedVendorData.description || '',
        services: updatedVendorData.services || [],
        pricing: {
          startingPrice: updatedVendorData.startingPrice || 0
        }
      };

      // Update vendor via API
      const response = await vendorApi.updateVendor(selectedVendor._id, vendorData);
      
      // Update vendor in the list
      setVendors(prevVendors => 
        prevVendors.map(v => v._id === selectedVendor._id ? response.vendor : v)
      );
      
      // Close modal and show success message
      setShowEditModal(false);
      setSelectedVendor(null);
      toast.success('Vendor updated successfully!');
    } catch (error) {
      console.error('Error updating vendor:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update vendor';
      toast.error(errorMessage);
    }
  };

  // Function to refresh vendors from API
  const refreshVendors = () => {
    fetchVendors();
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Vendor Management</h1>
            <p className="text-gray-600 mt-2">Manage all registered vendors in the association</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={refreshVendors}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </button>
            <button
              onClick={exportVendors}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
            <button 
              onClick={handleAddVendor}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Vendor</span>
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
                  placeholder="Search by name or business name"
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
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            
            <select 
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All Status</option>
              {statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex justify-between items-center">
          <p className="text-gray-600">
            Showing <span className="font-semibold">{filtered.length}</span> of <span className="font-semibold">{vendors.length}</span> vendors
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading vendors...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Vendors</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchVendors}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Vendor Table */}
        {!loading && !error && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Membership</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map(vendor => (
                  <tr key={vendor._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{vendor.name}</div>
                        <div className="text-sm text-gray-500">{vendor.businessName}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">{vendor.phone}</div>
                        <div className="text-sm text-gray-500">{vendor.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">{vendor.address?.city}</div>
                        <div className="text-sm text-gray-500">{vendor.address?.district}, {vendor.address?.state}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {vendor.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(vendor.status)}`}>
                        {vendor.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>Joined: {new Date(vendor.dateOfJoining).toLocaleDateString()}</div>
                      <div>Expires: {new Date(vendor.membershipExpiry).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleView(vendor)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(vendor)}
                          className="text-yellow-600 hover:text-yellow-900 p-1"
                          title="Edit Vendor"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(vendor)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Delete Vendor"
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

      {/* View Vendor Modal */}
      <Modal title="Vendor Details" isOpen={showViewModal} onClose={() => setShowViewModal(false)}>
        {selectedVendor && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="text-sm text-gray-900">{selectedVendor.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Business Name</label>
                <p className="text-sm text-gray-900">{selectedVendor.businessName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <p className="text-sm text-gray-900">{selectedVendor.phone}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="text-sm text-gray-900">{selectedVendor.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <p className="text-sm text-gray-900">{selectedVendor.category}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedVendor.status)}`}>
                  {selectedVendor.status}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">City</label>
                <p className="text-sm text-gray-900">{selectedVendor.address?.city}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">District</label>
                <p className="text-sm text-gray-900">{selectedVendor.address?.district}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">State</label>
                <p className="text-sm text-gray-900">{selectedVendor.address?.state}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date of Joining</label>
                <p className="text-sm text-gray-900">{new Date(selectedVendor.dateOfJoining).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Membership Expiry</label>
                <p className="text-sm text-gray-900">{new Date(selectedVendor.membershipExpiry).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Vendor Modal */}
      <Modal 
        title="Edit Vendor" 
        isOpen={showEditModal} 
        onClose={() => {
          setShowEditModal(false);
          setSelectedVendor(null);
        }}
        size="max-w-6xl"
      >
        {selectedVendor ? (
          <AddVendorForm 
            vendor={selectedVendor}
            isEditing={true}
            onSuccess={handleVendorUpdated}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedVendor(null);
            }}
          />
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading vendor data...</p>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal title="Confirm Delete" isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete <strong>{selectedVendor?.name}</strong>? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete Vendor
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Vendor Modal */}
      <Modal 
        title="Add New Vendor" 
        isOpen={showAddVendorModal} 
        onClose={() => setShowAddVendorModal(false)}
        size="max-w-6xl"
      >
        <AddVendorForm 
          onSuccess={handleVendorAdded}
          onCancel={() => setShowAddVendorModal(false)}
        />
      </Modal>
    </Layout>
  );
};

export default VendorList;
