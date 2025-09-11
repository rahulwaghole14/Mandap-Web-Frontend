import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Search, Eye, Edit, Trash2, Plus, Download, Building, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import Modal from '../components/Modal';
import AddAssociationForm from '../components/AddAssociationForm';
import EditAssociationForm from '../components/EditAssociationForm';
import { associationApi } from '../services/associationApi';
import toast from 'react-hot-toast';

const Associations = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [status, setStatus] = useState('');
  const [selectedAssociation, setSelectedAssociation] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [associations, setAssociations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAssociations, setTotalAssociations] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Fetch associations from API on component mount
  useEffect(() => {
    fetchAssociations(1);
  }, []);

  const fetchAssociations = async (pageNum = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      // Build params object, only including non-empty values
      const params = {
        page: pageNum,
        limit: pageSize
      };
      
      if (search && search.trim()) {
        params.search = search.trim();
      }
      
      if (city && city.trim()) {
        params.city = city.trim();
      }
      
      if (state && state.trim()) {
        params.state = state.trim();
      }
      
      if (status && status.trim()) {
        params.status = status.trim();
      }
      
      const response = await associationApi.getAssociations(params);
      
      // Handle pagination response
      if (response.success) {
        setAssociations(response.associations || []);
        setTotalAssociations(response.pagination?.total || 0);
        setTotalPages(response.pagination?.totalPages || 1);
        setCurrentPage(response.pagination?.currentPage || 1);
      } else {
        // Fallback for old API response format
        setAssociations(response.associations || []);
        setTotalAssociations(response.associations?.length || 0);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching associations:', error);
      setError('Failed to fetch associations. Please try again.');
      toast.error('Failed to fetch associations');
    } finally {
      setLoading(false);
    }
  };

  // No need for client-side filtering since backend handles it
  const filtered = associations;

  const cities = [...new Set(associations.map(a => a.city).filter(Boolean))];
  const states = [...new Set(associations.map(a => a.state).filter(Boolean))];
  const statuses = ['Active', 'Pending', 'Inactive'];

  // Pagination handlers
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      fetchAssociations(newPage);
    }
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
    fetchAssociations(1);
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  // Refresh associations when filters change
  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
    fetchAssociations(1);
  }, [search, city, state, status]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleView = (association) => {
    navigate(`/associations/${association.id}`);
  };

  const handleEdit = (association) => {
    setSelectedAssociation(association);
    setShowEditModal(true);
  };

  const handleDelete = (association) => {
    setSelectedAssociation(association);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await associationApi.deleteAssociation(selectedAssociation.id);
      toast.success(`Association ${selectedAssociation.name} deleted successfully`);
      setShowDeleteModal(false);
      setSelectedAssociation(null);
      fetchAssociations(currentPage); // Refresh the list
    } catch (error) {
      console.error('Error deleting association:', error);
      toast.error('Failed to delete association');
    }
  };

  const handleAddSuccess = (newAssociation) => {
    setShowAddModal(false);
    fetchAssociations(); // Refresh the list
  };

  const handleEditSuccess = (updatedAssociation) => {
    setShowEditModal(false);
    setSelectedAssociation(null);
    fetchAssociations(); // Refresh the list
  };

  const exportAssociations = () => {
    toast.success('Associations list exported successfully');
  };


  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Associations Management</h1>
            <p className="text-gray-600 mt-2">Manage different association branches and districts</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={exportAssociations}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Association</span>
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
                  placeholder="Search by association name"
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
              value={state}
              onChange={(e) => setState(e.target.value)}
            >
              <option value="">All States</option>
              {states.map(state => (
                <option key={state} value={state}>{state}</option>
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
          <div className="flex items-center space-x-4">
            <p className="text-gray-600">
              Showing <span className="font-semibold">{((currentPage - 1) * pageSize) + 1}</span> to <span className="font-semibold">{Math.min(currentPage * pageSize, totalAssociations)}</span> of <span className="font-semibold">{totalAssociations}</span> associations
            </p>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>
          <button
            onClick={() => fetchAssociations(currentPage)}
            className="px-3 py-1 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Refresh
          </button>
        </div>

        {/* Associations Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Association</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Members</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
                        <span className="text-gray-600">Loading associations...</span>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="text-center">
                        <p className="text-red-600 mb-4">{error}</p>
                        <button
                          onClick={() => fetchAssociations(currentPage)}
                          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                        >
                          Try Again
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map(association => (
                  <tr key={association.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <Building className="h-5 w-5 text-primary-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{association.name}</div>
                          <div className="text-sm text-gray-500">Est. {association.establishedYear || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">{association.city || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{association.state || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{association.pincode || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(association.isActive ? 'Active' : 'Inactive')}`}>
                        {association.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => navigate(`/associations/${association.id}/members`)}
                        className="text-primary-600 hover:text-primary-900 hover:underline font-medium cursor-pointer"
                        title="View Members"
                      >
                        {association.totalMembers || 0} member{(association.totalMembers || 0) !== 1 ? 's' : ''}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleView(association)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(association)}
                          className="text-yellow-600 hover:text-yellow-900 p-1"
                          title="Edit Association"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(association)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Delete Association"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    
                    {getPageNumbers().map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pageNum === currentPage
                            ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Building className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No associations found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {search || city || state || status 
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by creating a new association.'
              }
            </p>
            {!search && !city && !state && !status && (
              <div className="mt-6">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  <Plus className="-ml-1 mr-2 h-5 w-5" />
                  Add Association
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Association Modal */}
      <Modal title="Add New Association" isOpen={showAddModal} onClose={() => setShowAddModal(false)}>
        <AddAssociationForm
          onSuccess={handleAddSuccess}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>

      {/* Edit Association Modal */}
      <Modal title="Edit Association" isOpen={showEditModal} onClose={() => setShowEditModal(false)}>
        {selectedAssociation && (
          <EditAssociationForm
            association={selectedAssociation}
            onSuccess={handleEditSuccess}
            onCancel={() => setShowEditModal(false)}
          />
        )}
      </Modal>


      {/* Delete Confirmation Modal */}
      <Modal title="Confirm Delete" isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete <strong>"{selectedAssociation?.name}"</strong>? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete Association
            </button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default Associations;
