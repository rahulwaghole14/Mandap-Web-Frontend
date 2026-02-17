import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { ArrowLeft, Building, MapPin, Phone, Mail, CalendarDays, Users, Crown, Edit, Trash2 } from 'lucide-react';
import { associationApi } from '../services/associationApi';
import Modal from '../components/Modal';
import EditAssociationForm from '../components/EditAssociationForm';
import toast from 'react-hot-toast';

const AssociationDetail = () => {
  const { associationId } = useParams();
  const navigate = useNavigate();
  const [association, setAssociation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (associationId) {
      fetchAssociationDetails();
    }
  }, [associationId]);

  const fetchAssociationDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await associationApi.getAssociation(associationId);
      setAssociation(response.association);
    } catch (error) {
      console.error('Error fetching association details:', error);
      setError('Failed to fetch association details');
      toast.error('Failed to fetch association details');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await associationApi.deleteAssociation(associationId);
      toast.success('Association deleted successfully');
      navigate('/associations');
    } catch (error) {
      console.error('Error deleting association:', error);
      toast.error('Failed to delete association');
    }
    setShowDeleteModal(false);
  };

  const handleEditSuccess = (updatedAssociation) => {
    setAssociation(updatedAssociation);
    setShowEditModal(false);
    toast.success('Association updated successfully');
  };

  const getStatusColor = (status) => {
    if (status === 'Active') {
      return 'bg-green-100 text-green-800';
    } else if (status === 'Inactive') {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading association details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !association) {
    return (
      <Layout>
        <div className="text-center py-12">
          <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Association not found</h3>
          <p className="text-gray-600 mb-4">{error || 'The association you are looking for does not exist.'}</p>
          <button
            onClick={() => navigate('/associations')}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
          >
            Back to Associations
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/associations')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Association Details</h1>
              <p className="text-gray-600">View and manage association information</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => navigate(`/associations/${association.id}/members`)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Users className="h-4 w-4" />
              <span>View Members</span>
            </button>
            <button
              onClick={handleEdit}
              className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 flex items-center space-x-2"
            >
              <Edit className="h-4 w-4" />
              <span>Edit</span>
            </button>
            <button
              onClick={handleDelete}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center space-x-2"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* Association Details Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            {/* Association Header */}
            <div className="text-center mb-8">
              <div className="h-24 w-24 mx-auto mb-4">
                <div className="h-24 w-24 rounded-lg bg-primary-100 flex items-center justify-center">
                  <Building className="h-12 w-12 text-primary-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{association.name}</h2>
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(association.isActive ? 'Active' : 'Inactive')}`}>
                {association.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            {/* Association Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Basic Information</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Association Name</label>
                    <p className="text-sm text-gray-900 mt-1">{association.name}</p>
                  </div>
                  
                  {association.description && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <p className="text-sm text-gray-900 mt-1">{association.description}</p>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Established Year</label>
                    <p className="text-sm text-gray-900 mt-1">{association.establishedYear}</p>
                  </div>
                  
                  {/* <div>
                    <label className="block text-sm font-medium text-gray-700">Registration Number</label>
                    <p className="text-sm text-gray-900 mt-1">{association.registrationNumber || 'Not provided'}</p>
                  </div> */}
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Contact Information</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">District</label>
                    <p className="text-sm text-gray-900 mt-1">{association.district || 'Not provided'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">City</label>
                    <p className="text-sm text-gray-900 mt-1">{association.city || 'Not provided'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">State</label>
                    <p className="text-sm text-gray-900 mt-1">{association.state || 'Not provided'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Pincode</label>
                    <p className="text-sm text-gray-900 mt-1">{association.pincode || 'Not provided'}</p>
                  </div>
                  
                  {association.phone && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <p className="text-sm text-gray-900 mt-1">{association.phone}</p>
                    </div>
                  )}
                  
                  {association.email && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="text-sm text-gray-900 mt-1">{association.email}</p>
                    </div>
                  )}
                  
                  {association.website && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Website</label>
                      <a href={association.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline mt-1">
                        {association.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-blue-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-blue-900">Total Members</p>
                      <p className="text-2xl font-bold text-blue-600">{association.totalMembers || 0}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Building className="h-8 w-8 text-green-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-900">Total Vendors</p>
                      <p className="text-2xl font-bold text-green-600">{association.totalVendors || 0}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <CalendarDays className="h-8 w-8 text-purple-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-purple-900">Years Active</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {association.establishedYear ? new Date().getFullYear() - association.establishedYear : 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal title="Edit Association" isOpen={showEditModal} onClose={() => setShowEditModal(false)}>
        <EditAssociationForm
          association={association}
          onSuccess={handleEditSuccess}
          onCancel={() => setShowEditModal(false)}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal title="Confirm Delete" isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete <strong>{association.name}</strong>? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default AssociationDetail;
