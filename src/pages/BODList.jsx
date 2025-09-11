
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { Plus, Edit, Trash2, Eye, Upload, X, CheckCircle, Loader2, User, Crown } from 'lucide-react';
import { bodApi } from '../services/bodApi';
import { memberApi } from '../services/memberApi';
import toast from 'react-hot-toast';

const BODList = () => {
  const [selected, setSelected] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showView, setShowView] = useState(false);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [bods, setBods] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddFromMembers, setShowAddFromMembers] = useState(false);
  const [selectedMember, setSelectedMember] = useState('');
  const [memberPosition, setMemberPosition] = useState('');
  const [memberBio, setMemberBio] = useState('');
  const [memberIsActive, setMemberIsActive] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm();

  // Fetch BOD members and all members from API on component mount
  useEffect(() => {
    fetchBODs();
    fetchMembers();
  }, []);

  const fetchBODs = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch only National BODs (NBODs) - those without associationId
      const response = await bodApi.getBODs({
        type: 'national'
      });
      setBods(response.bods || []);
    } catch (error) {
      console.error('Error fetching BOD members:', error);
      setError('Failed to fetch BOD members. Please try again.');
      toast.error('Failed to fetch BOD members');
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await memberApi.getMembers();
      setMembers(response.members || []);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error('Failed to fetch members');
    }
  };

  const designations = [
    'President', 'Vice President', 'Secretary', 'Joint Secretary', 
    'Treasurer', 'Joint Treasurer', 'Executive Member'
  ];

  const districts = [
    'Pune', 'Mumbai', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad', 'Solapur', 'Kolhapur'
  ];

  const states = [
    'Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'Gujarat', 'Rajasthan'
  ];

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size should be less than 5MB');
        return;
      }
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImage(null);
    setPreview(null);
  };

  const handleAdd = () => {
    setShowAdd(true);
    reset();
    removeImage();
  };

  const handleAddFromMembers = () => {
    setShowAddFromMembers(true);
    setSelectedMember('');
    setMemberPosition('');
    setMemberBio('');
    setMemberIsActive(true);
  };

  const handleEdit = (bod) => {
    setSelected(bod);
    setValue('name', bod.name);
    setValue('designation', bod.position || bod.designation);
    setValue('contactNumber', bod.phone || bod.contactNumber);
    setValue('email', bod.email);
    setValue('isActive', bod.isActive);
    setValue('street', bod.address?.street || '');
    setValue('city', bod.address?.city || '');
    setValue('district', bod.address?.district || '');
    setValue('state', bod.address?.state || '');
    setValue('pincode', bod.address?.pincode || '');
    setValue('bio', bod.bio || '');
    setValue('linkedin', bod.socialLinks?.linkedin || '');
    setValue('twitter', bod.socialLinks?.twitter || '');
    setValue('facebook', bod.socialLinks?.facebook || '');
    setShowEdit(true);
  };

  const handleView = (bod) => {
    setSelected(bod);
    setShowView(true);
  };

  const handleDelete = (bod) => {
    setSelected(bod);
    setShowDelete(true);
  };

  const onSubmitAdd = async (data) => {
    try {
      // Validate required fields
      if (!data.name || !data.designation || !data.contactNumber || !data.email) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Transform form data to match backend schema (National BOD - no associationId)
      const bodData = {
        name: data.name.trim(),
        position: data.designation,
        phone: data.contactNumber.trim(),
        email: data.email.trim(),
        isActive: data.isActive || true,
        address: {
          street: data.street?.trim() || '',
          city: data.city?.trim() || '',
          district: data.district?.trim() || '',
          state: data.state?.trim() || '',
          pincode: data.pincode?.trim() || ''
        },
        bio: data.bio?.trim() || '',
        socialLinks: {
          linkedin: data.linkedin?.trim() || '',
          twitter: data.twitter?.trim() || '',
          facebook: data.facebook?.trim() || ''
        },
        profileImage: image?.name || null
      };

      console.log('Form data:', data);
      console.log('Transformed BOD data:', bodData);

      // Create BOD member via API
      const response = await bodApi.createBOD(bodData);
      
      // Add new BOD member to the list
      setBods(prevBODs => [...prevBODs, response.bod]);
      
      // Close modal and show success message
      setShowAdd(false);
      reset();
      removeImage();
      toast.success('BOD member added successfully!');
    } catch (error) {
      console.error('Error adding BOD member:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Failed to add BOD member';
      toast.error(errorMessage);
    }
  };

  const onSubmitFromMembers = async () => {
    try {
      if (!selectedMember || !memberPosition) {
        toast.error('Please select a member and position');
        return;
      }

      const member = members.find(m => m.id == selectedMember || m._id == selectedMember);
      if (!member) {
        toast.error('Selected member not found');
        return;
      }

      // Check if member is already a BOD member
      const existingBOD = bods.find(bod => bod.name === member.name);
      if (existingBOD) {
        toast.error(`${member.name} is already a BOD member`);
        return;
      }

      const bodData = {
        name: member.name,
        position: memberPosition,
        phone: member.phone,
        email: member.email || `${member.name.toLowerCase().replace(/\s+/g, '.')}@mandapam.com`,
        bio: memberBio,
        isActive: memberIsActive,
        // No associationId for National BODs
        address: {
          city: member.city,
          state: member.state,
          pincode: member.pincode
        }
      };

      console.log('Adding BOD member from existing member:', bodData);

      const response = await bodApi.createBOD(bodData);
      
      // Add new BOD member to the list
      setBods(prevBODs => [...prevBODs, response.bod]);
      
      // Close modal and show success message
      setShowAddFromMembers(false);
      setSelectedMember('');
      setMemberPosition('');
      setMemberBio('');
      setMemberIsActive(true);
      toast.success(`${member.name} added as ${memberPosition} successfully!`);
    } catch (error) {
      console.error('Error adding BOD member from existing member:', error);
      const errorMessage = error.response?.data?.message || 'Failed to add BOD member';
      toast.error(errorMessage);
    }
  };

  const onSubmitEdit = async (data) => {
    try {
      // Transform form data to match backend schema
      const bodData = {
        name: data.name,
        position: data.designation,
        contactNumber: data.contactNumber,
        email: data.email,
        isActive: data.isActive || true,
        address: {
          street: data.street || '',
          city: data.city || '',
          district: data.district || '',
          state: data.state || '',
          pincode: data.pincode || ''
        },
        bio: data.bio || '',
        socialLinks: {
          linkedin: data.linkedin || '',
          twitter: data.twitter || '',
          facebook: data.facebook || ''
        },
        profileImage: image?.name || selected.profileImage
      };

      // Update BOD member via API
      const response = await bodApi.updateBOD(selected.id, bodData);
      
      // Update BOD member in the list
      setBods(prevBODs => 
        prevBODs.map(bod => 
          bod.id === selected.id ? response.bod : bod
        )
      );
      
      toast.success('BOD member updated successfully!');
      setShowEdit(false);
      setSelected(null);
      removeImage();
    } catch (error) {
      console.error('Error updating BOD member:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update BOD member';
      toast.error(errorMessage);
    }
  };

  const confirmDelete = async () => {
    try {
      // Delete BOD member via API
      await bodApi.deleteBOD(selected.id);
      
      // Remove BOD member from the list
      setBods(prevBODs => 
        prevBODs.filter(bod => bod.id !== selected.id)
      );
      
      toast.success(`BOD member ${selected.name} deleted successfully`);
      setShowDelete(false);
      setSelected(null);
    } catch (error) {
      console.error('Error deleting BOD member:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete BOD member';
      toast.error(errorMessage);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">National Board of Directors</h1>
                          <p className="text-gray-600 mt-2">Manage the association's national board members</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={fetchBODs}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </button>
            <button
              onClick={handleAddFromMembers}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
            >
              <User className="h-4 w-4" />
              <span>Add NBOD Member</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading BOD members...</p>
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading BOD Members</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchBODs}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* BOD Table */}
        {!loading && !error && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Added By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bods.map(bod => (
                  <tr key={bod.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          {bod.profileImage ? (
                            <img src={bod.profileImage} alt={bod.name} className="h-10 w-10 rounded-full object-cover" />
                          ) : (
                            <span className="text-sm font-medium text-gray-700">
                              {bod.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{bod.name}</div>
                          <div className="text-sm text-gray-500">Added: {new Date(bod.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {bod.position || bod.designation || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">{bod.phone || bod.contactNumber || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{bod.email || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        bod.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {bod.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {bod.createdBy?.name || 'Admin'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleView(bod)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(bod)}
                          className="text-yellow-600 hover:text-yellow-900 p-1"
                          title="Edit Member"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(bod)}
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

      {/* Add BOD Modal */}
      <Modal title="Add BOD Member" isOpen={showAdd} onClose={() => setShowAdd(false)}>
        <form onSubmit={handleSubmit(onSubmitAdd)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
              <input
                type="text"
                {...register('name', { required: 'Name is required' })}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter full name"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Designation *</label>
              <select
                {...register('designation', { required: 'Designation is required' })}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.designation ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select designation</option>
                {designations.map(designation => (
                  <option key={designation} value={designation}>{designation}</option>
                ))}
              </select>
              {errors.designation && (
                <p className="text-red-500 text-sm mt-1">{errors.designation.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number *</label>
              <input
                type="tel"
                {...register('contactNumber', { 
                  required: 'Contact number is required',
                  pattern: {
                    value: /^[0-9]{10}$/,
                    message: 'Please enter a valid 10-digit phone number'
                  }
                })}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.contactNumber ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter contact number"
              />
              {errors.contactNumber && (
                <p className="text-red-500 text-sm mt-1">{errors.contactNumber.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
              <input
                type="email"
                {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                    message: 'Please enter a valid email address'
                  }
                })}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter email address"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>
          </div>

          {/* Address Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
              <input
                type="text"
                {...register('street')}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter street address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
              <input
                type="text"
                {...register('city')}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter city"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">District</label>
              <select
                {...register('district')}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select district</option>
                {districts.map(district => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
              <select
                {...register('state')}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select state</option>
                {states.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
              <input
                type="text"
                {...register('pincode', {
                  pattern: {
                    value: /^[0-9]{6}$/,
                    message: 'Please enter a valid 6-digit pincode'
                  }
                })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter pincode"
              />
            </div>
          </div>

          {/* Bio and Social Links */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
            <textarea
              {...register('bio')}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter bio (optional)"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn</label>
              <input
                type="url"
                {...register('linkedin')}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="LinkedIn URL (optional)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Twitter</label>
              <input
                type="url"
                {...register('twitter')}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Twitter URL (optional)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Facebook</label>
              <input
                type="url"
                {...register('facebook')}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Facebook URL (optional)"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Profile Image</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
              <div className="space-y-1 text-center">
                {!preview ? (
                  <>
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500">
                        <span>Upload a file</span>
                        <input
                          type="file"
                          className="sr-only"
                          accept="image/*"
                          onChange={handleImage}
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                  </>
                ) : (
                  <div className="relative">
                    <img
                      src={preview}
                      alt="Preview"
                      className="mx-auto h-24 w-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              {...register('isActive')}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">Active Member</label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
            >
              <CheckCircle className="h-4 w-4" />
              <span>Add Member</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit BOD Modal */}
      <Modal title="Edit BOD Member" isOpen={showEdit} onClose={() => setShowEdit(false)}>
        <form onSubmit={handleSubmit(onSubmitEdit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
              <input
                type="text"
                {...register('name', { required: 'Name is required' })}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Designation *</label>
              <select
                {...register('designation', { required: 'Designation is required' })}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.designation ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                {designations.map(designation => (
                  <option key={designation} value={designation}>{designation}</option>
                ))}
              </select>
              {errors.designation && (
                <p className="text-red-500 text-sm mt-1">{errors.designation.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number *</label>
              <input
                type="tel"
                {...register('contactNumber', { 
                  required: 'Contact number is required',
                  pattern: {
                    value: /^[0-9]{10}$/,
                    message: 'Please enter a valid 10-digit phone number'
                  }
                })}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.contactNumber ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.contactNumber && (
                <p className="text-red-500 text-sm mt-1">{errors.contactNumber.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
              <input
                type="email"
                {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                    message: 'Please enter a valid email address'
                  }
                })}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter email address"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>
          </div>

          {/* Address Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
              <input
                type="text"
                {...register('street')}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter street address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
              <input
                type="text"
                {...register('city')}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter city"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">District</label>
              <select
                {...register('district')}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {districts.map(district => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
              <select
                {...register('state')}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {states.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
              <input
                type="text"
                {...register('pincode', {
                  pattern: {
                    value: /^[0-9]{6}$/,
                    message: 'Please enter a valid 6-digit pincode'
                  }
                })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter pincode"
              />
            </div>
          </div>

          {/* Bio and Social Links */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
            <textarea
              {...register('bio')}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter bio (optional)"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn</label>
              <input
                type="url"
                {...register('linkedin')}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="LinkedIn URL (optional)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Twitter</label>
              <input
                type="url"
                {...register('twitter')}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Twitter URL (optional)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Facebook</label>
              <input
                type="url"
                {...register('facebook')}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Facebook URL (optional)"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              {...register('isActive')}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">Active Member</label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setShowEdit(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Update Member
            </button>
          </div>
        </form>
      </Modal>

      {/* View BOD Modal */}
      <Modal title="BOD Member Details" isOpen={showView} onClose={() => setShowView(false)}>
        {selected && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="h-24 w-24 rounded-full bg-gray-300 flex items-center justify-center mx-auto mb-4">
                {selected.profileImage ? (
                  <img src={selected.profileImage} alt={selected.name} className="h-24 w-24 rounded-full object-cover" />
                ) : (
                  <span className="text-2xl font-medium text-gray-700">
                    {selected.name.split(' ').map(n => n[0]).join('')}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-medium text-gray-900">{selected.name}</h3>
              <p className="text-sm text-gray-500">{selected.position || selected.designation || 'N/A'}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                <p className="text-sm text-gray-900">{selected.phone}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="text-sm text-gray-900">{selected.email || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  selected.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {selected.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Added By</label>
                <p className="text-sm text-gray-900">{selected.createdBy?.name || 'Admin'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date Added</label>
                <p className="text-sm text-gray-900">{new Date(selected.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Address Information */}
            {selected.address && (selected.address.street || selected.address.city) && (
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Address</h4>
                <div className="grid grid-cols-2 gap-4">
                  {selected.address.street && (
                    <div>
                      <label className="block text-xs text-gray-500">Street</label>
                      <p className="text-sm text-gray-900">{selected.address.street}</p>
                    </div>
                  )}
                  {selected.address.city && (
                    <div>
                      <label className="block text-xs text-gray-500">City</label>
                      <p className="text-sm text-gray-900">{selected.address.city}</p>
                    </div>
                  )}
                  {selected.address.district && (
                    <div>
                      <label className="block text-xs text-gray-500">District</label>
                      <p className="text-sm text-gray-900">{selected.address.district}</p>
                    </div>
                  )}
                  {selected.address.state && (
                    <div>
                      <label className="block text-xs text-gray-500">State</label>
                      <p className="text-sm text-gray-900">{selected.address.state}</p>
                    </div>
                  )}
                  {selected.address.pincode && (
                    <div>
                      <label className="block text-xs text-gray-500">Pincode</label>
                      <p className="text-sm text-gray-900">{selected.address.pincode}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bio and Social Links */}
            {(selected.bio || selected.socialLinks) && (
              <div className="border-t border-gray-200 pt-4">
                {selected.bio && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Bio</h4>
                    <p className="text-sm text-gray-900">{selected.bio}</p>
                  </div>
                )}
                
                {(selected.socialLinks?.linkedin || selected.socialLinks?.twitter || selected.socialLinks?.facebook) && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Social Links</h4>
                    <div className="space-y-2">
                      {selected.socialLinks?.linkedin && (
                        <div>
                          <label className="block text-xs text-gray-500">LinkedIn</label>
                          <a href={selected.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                            {selected.socialLinks.linkedin}
                          </a>
                        </div>
                      )}
                      {selected.socialLinks?.twitter && (
                        <div>
                          <label className="block text-xs text-gray-500">Twitter</label>
                          <a href={selected.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                            {selected.socialLinks.twitter}
                          </a>
                        </div>
                      )}
                      {selected.socialLinks?.facebook && (
                        <div>
                          <label className="block text-xs text-gray-500">Facebook</label>
                          <a href={selected.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                            {selected.socialLinks.facebook}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Add from Existing Members Modal */}
      <Modal title="Add NBOD Member from Existing Members" isOpen={showAddFromMembers} onClose={() => setShowAddFromMembers(false)}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Member *</label>
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            >
              <option value="">Choose a member</option>
              {members
                .filter(member => !bods.some(bod => bod.name === member.name)) // Filter out existing BOD members
                .map(member => (
                  <option key={member.id} value={member.id}>
                    {member.name} - {member.businessName} ({member.city}, {member.state})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Position *</label>
            <select
              value={memberPosition}
              onChange={(e) => setMemberPosition(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            >
              <option value="">Select position</option>
              {designations.map(position => (
                <option key={position} value={position}>{position}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
            <textarea
              value={memberBio}
              onChange={(e) => setMemberBio(e.target.value)}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Brief description about the member..."
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="memberIsActive"
              checked={memberIsActive}
              onChange={(e) => setMemberIsActive(e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="memberIsActive" className="text-sm text-gray-700">
              Active NBOD Member
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setShowAddFromMembers(false)}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSubmitFromMembers}
              disabled={!selectedMember || !memberPosition}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Crown className="h-4 w-4" />
              <span>Add as NBOD Member</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal title="Confirm Delete" isOpen={showDelete} onClose={() => setShowDelete(false)}>
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete <strong>{selected?.name}</strong> from the Board of Directors? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowDelete(false)}
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
    </Layout>
  );
};

export default BODList;
