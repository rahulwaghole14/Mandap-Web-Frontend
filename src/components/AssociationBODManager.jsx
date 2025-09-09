import React, { useState, useEffect } from 'react';
import { User, Crown, Edit, Trash2, Plus, Loader2 } from 'lucide-react';
import { bodApi } from '../services/bodApi';
import toast from 'react-hot-toast';

const AssociationBODManager = ({ association, members, onBODUpdate }) => {
  const [bodMembers, setBodMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBOD, setEditingBOD] = useState(null);
     const [formData, setFormData] = useState({
     memberId: '',
     position: '',
     bio: '',
     isActive: true
   });

  const positions = [
    'President',
    'Vice President',
    'Secretary',
    'Joint Secretary',
    'Treasurer',
    'Joint Treasurer',
    'Executive Member'
  ];

  useEffect(() => {
    if (association) {
      console.log('Association changed:', association);
      console.log('Members prop:', members);
      fetchBODMembers();
    }
  }, [association, members]);

  const fetchBODMembers = async () => {
    try {
      setLoading(true);
      const response = await bodApi.getBODs();
      console.log('BOD API response:', response);
      
      // Backend returns 'bods' not 'bodMembers'
      const allBOD = response.bods || [];
      console.log('All BOD members:', allBOD);
      
      // Filter BOD members by association (if associationName field exists)
      // For now, let's show all BOD members since association filtering might not be implemented yet
      const associationBOD = allBOD; // Remove filtering temporarily
      
      console.log('Filtered association BOD:', associationBOD);
      setBodMembers(associationBOD);
    } catch (error) {
      console.error('Error fetching BOD members:', error);
      toast.error('Failed to fetch BOD members');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBOD = async (e) => {
    e.preventDefault();
    
    if (!formData.memberId || !formData.position) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      // Get member details
      const selectedMember = members.find(m => m.id == formData.memberId || m._id == formData.memberId);
      if (!selectedMember) {
        toast.error('Selected member not found');
        return;
      }

             const bodData = {
         name: selectedMember.name,
         position: formData.position, // Backend expects position
         phone: selectedMember.phone, // Backend expects phone
         email: selectedMember.email || `${selectedMember.name.toLowerCase().replace(/\s+/g, '.')}@${association.name.toLowerCase().replace(/\s+/g, '')}.com`, // Generate email if not provided
         bio: formData.bio,
         isActive: formData.isActive,
         associationId: association.id, // Include association ID for Association BODs
         address: {
           city: selectedMember.city,
           state: selectedMember.state,
           pincode: selectedMember.pincode
         }
       };
       
       console.log('Sending BOD data to backend:', bodData);

      const response = await bodApi.createBOD(bodData);
      
      toast.success(`${selectedMember.name} added as ${formData.position}`);
      setShowAddForm(false);
      resetForm();
      fetchBODMembers();
      if (onBODUpdate) onBODUpdate();
    } catch (error) {
      console.error('Error adding BOD member:', error);
      const errorMessage = error.response?.data?.message || 'Failed to add BOD member';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEditBOD = async (e) => {
    e.preventDefault();
    
    if (!formData.position) {
      toast.error('Position is required');
      return;
    }

    try {
      setLoading(true);
      
             const updateData = {
         position: formData.position, // Backend expects position
         bio: formData.bio,
         isActive: formData.isActive
       };

      await bodApi.updateBOD(editingBOD.id, updateData);
      
      toast.success('BOD member updated successfully');
      setEditingBOD(null);
      resetForm();
      fetchBODMembers();
      if (onBODUpdate) onBODUpdate();
    } catch (error) {
      console.error('Error updating BOD member:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update BOD member';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBOD = async (bodId, memberName) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from BOD?`)) {
      return;
    }

    try {
      setLoading(true);
      await bodApi.deleteBOD(bodId);
      
      toast.success(`${memberName} removed from BOD`);
      fetchBODMembers();
      if (onBODUpdate) onBODUpdate();
    } catch (error) {
      console.error('Error deleting BOD member:', error);
      toast.error('Failed to remove BOD member');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (bod) => {
    setEditingBOD(bod);
    setFormData({
      memberId: '',
      position: bod.position, // Backend uses position
      bio: bod.bio || '',
      isActive: bod.isActive
    });
  };

  const resetForm = () => {
    setFormData({
      memberId: '',
      position: '',
      bio: '',
      isActive: true
    });
    setEditingBOD(null);
  };

  const getPositionColor = (position) => {
    const colors = {
      'President': 'bg-red-100 text-red-800',
      'Vice President': 'bg-orange-100 text-orange-800',
      'Secretary': 'bg-blue-100 text-blue-800',
      'Joint Secretary': 'bg-indigo-100 text-indigo-800',
      'Treasurer': 'bg-green-100 text-green-800',
      'Joint Treasurer': 'bg-emerald-100 text-emerald-800',
      'Executive Member': 'bg-purple-100 text-purple-800'
    };
    return colors[position] || 'bg-gray-100 text-gray-800';
  };

  // Get available members (not already in BOD)
  const availableMembers = members.filter(member => 
    !bodMembers.some(bod => bod.name === member.name)
  );
  
  console.log('Debug - Members:', members);
  console.log('Debug - BOD Members:', bodMembers);
  console.log('Debug - Available Members:', availableMembers);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Crown className="h-6 w-6 text-yellow-600" />
                     <h3 className="text-lg font-semibold text-gray-900">National Board of Directors</h3>
        </div>
                 <button
           onClick={() => setShowAddForm(true)}
           disabled={availableMembers.length === 0}
           className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
         >
           <Plus className="h-4 w-4" />
           <span>Add NBOD Member ({availableMembers.length} available)</span>
         </button>
      </div>

      {/* Add/Edit BOD Form */}
      {(showAddForm || editingBOD) && (
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
                     <h4 className="text-lg font-medium text-gray-900 mb-4">
             {editingBOD ? 'Edit NBOD Member' : 'Add New NBOD Member'}
           </h4>
          
          <form onSubmit={editingBOD ? handleEditBOD : handleAddBOD} className="space-y-4">
            {!editingBOD && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Member *
                </label>
                <select
                  value={formData.memberId}
                  onChange={(e) => setFormData({ ...formData, memberId: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  <option value="">Choose a member</option>
                  {availableMembers.map(member => (
                    <option key={member.id || member._id} value={member.id || member._id}>
                      {member.name} - {member.businessName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Position *
              </label>
              <select
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              >
                <option value="">Select position</option>
                {positions.map(position => (
                  <option key={position} value={position}>{position}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Brief description about the member..."
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="text-sm text-gray-700">
                Active BOD Member
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                                     <span>{editingBOD ? 'Update' : 'Add'} NBOD Member</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* BOD Members List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
                     <h4 className="text-lg font-medium text-gray-900">
             Current NBOD Members ({bodMembers.length})
           </h4>
        </div>
        
        {bodMembers.length === 0 ? (
          <div className="text-center py-8">
            <Crown className="mx-auto h-12 w-12 text-gray-400" />
                         <h3 className="mt-2 text-sm font-medium text-gray-900">No NBOD members</h3>
             <p className="mt-1 text-sm text-gray-500">
               Start building your national board of directors by adding members.
             </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bodMembers.map(bod => (
                  <tr key={bod._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary-600" />
                          </div>
                        </div>
                                                 <div className="ml-4">
                           <div className="text-sm font-medium text-gray-900">{bod.name}</div>
                           <div className="text-sm text-gray-500">{bod.phone || 'N/A'}</div>
                         </div>
                      </div>
                    </td>
                                         <td className="px-6 py-4 whitespace-nowrap">
                       <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPositionColor(bod.position)}`}>
                         {bod.position}
                       </span>
                     </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        bod.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {bod.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(bod)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Edit BOD Member"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteBOD(bod.id, bod.name)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Remove from BOD"
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
        )}
      </div>
    </div>
  );
};

export default AssociationBODManager;
