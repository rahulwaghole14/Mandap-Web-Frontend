import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { CheckCircle } from 'lucide-react';
import { associationApi } from '../services/associationApi';
import toast from 'react-hot-toast';

const EditAssociationForm = ({ association, onSuccess, onCancel }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue
  } = useForm();

  const cities = [
    'Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad', 'Solapur', 'Kolhapur',
    'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Ahmedabad', 'Jaipur', 'Lucknow'
  ];

  const districts = [
    'Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad', 'Solapur', 'Kolhapur',
    'New Delhi', 'Bangalore Urban', 'Chennai', 'Hyderabad', 'Ahmedabad', 'Jaipur', 'Lucknow'
  ];

  const states = [
    'Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'Telangana', 'Gujarat', 'Rajasthan',
    'Uttar Pradesh', 'West Bengal', 'Andhra Pradesh', 'Madhya Pradesh', 'Kerala'
  ];

  // Populate form with existing association data
  useEffect(() => {
    if (association) {
      setValue('name', association.name);
      setValue('city', association.city || '');
      setValue('district', association.district || '');
      setValue('state', association.state || '');
      setValue('pincode', association.pincode || '');
      // Convert establishedYear to date for the date picker
      if (association.establishedYear) {
        const date = new Date(association.establishedYear, 0, 1);
        setValue('establishedDate', date.toISOString().split('T')[0]);
      }
    }
  }, [association, setValue]);

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);

      const associationData = {
        name: data.name.trim(),
        city: data.city,
        state: data.state,
        pincode: data.pincode.toString(),
        establishedYear: new Date(data.establishedDate).getFullYear(),
        address: data.address || '' // Keep address as text field
      };

      const response = await associationApi.updateAssociation(association.id, associationData);
      
      toast.success('Association updated successfully!');
      
      if (onSuccess) {
        onSuccess(response.association);
      }
    } catch (error) {
      console.error('Error updating association:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to update association. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Association Name *</label>
            <input
              type="text"
              {...register('name', { required: 'Association name is required' })}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter association name"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Established Date *</label>
            <input
              type="date"
              {...register('establishedDate', { required: 'Established date is required' })}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.establishedDate ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.establishedDate && (
              <p className="text-red-500 text-sm mt-1">{errors.establishedDate.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Address Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Address Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
            <select
              {...register('state', { required: 'State is required' })}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.state ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select state</option>
              {states.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
            {errors.state && (
              <p className="text-red-500 text-sm mt-1">{errors.state.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">District *</label>
            <select
              {...register('district', { required: 'District is required' })}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.district ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select district</option>
              {districts.map(district => (
                <option key={district} value={district}>{district}</option>
              ))}
            </select>
            {errors.district && (
              <p className="text-red-500 text-sm mt-1">{errors.district.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
            <select
              {...register('city', { required: 'City is required' })}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.city ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select city</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            {errors.city && (
              <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pincode *</label>
            <input
              type="text"
              {...register('pincode', {
                required: 'Pincode is required',
                pattern: {
                  value: /^[0-9]{6}$/,
                  message: 'Please enter a valid 6-digit pincode'
                }
              })}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.pincode ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter 6-digit pincode"
            />
            {errors.pincode && (
              <p className="text-red-500 text-sm mt-1">{errors.pincode.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Updating...</span>
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              <span>Update Association</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default EditAssociationForm;
