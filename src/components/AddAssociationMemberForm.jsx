import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { memberApi } from '../services/memberApi';
import toast from 'react-hot-toast';
import { formatDateForAPI, getMaxDateForPicker, getMinDateForPicker, validateBirthDate } from '../utils/dateUtils';

const AddAssociationMemberForm = ({ association, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm({
    defaultValues: {
      state: 'Maharashtra',
      associationName: association?.name || ''
    }
  });

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setPreview(null);
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      // Transform form data to match backend schema
      const memberData = {
        name: data.name.trim(),
        businessName: data.businessName.trim(),
        phone: data.phone.trim(),
        state: data.state || 'Maharashtra',
        businessType: data.businessType,
        city: data.city,
        pincode: data.pincode,
        associationName: association?.name || data.associationName,
        profileImage: image?.name || null,
        birthDate: data.birthDate ? formatDateForAPI(data.birthDate) : null
      };

      const response = await memberApi.createMember(memberData);
      onSuccess(response.member);
      reset();
      removeImage();
      toast.success('Member added successfully!');
    } catch (error) {
      console.error('Error adding member:', error);
      const errorMessage = error.response?.data?.message || 'Failed to add member';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const cities = [
    'Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad', 'Solapur', 'Kolhapur',
    'Amravati', 'Nanded', 'Sangli', 'Jalgaon', 'Akola', 'Latur', 'Dhule', 'Ahmednagar',
    'Chandrapur', 'Parbhani', 'Beed', 'Gondia', 'Wardha', 'Yavatmal', 'Buldhana', 'Hingoli',
    'Washim', 'Gadchiroli', 'Bhandara', 'Osmanabad', 'Satara', 'Ratnagiri', 'Sindhudurg'
  ];

  const businessTypes = [
    { value: 'sound', label: 'Sound' },
    { value: 'decorator', label: 'Decorator' },
    { value: 'catering', label: 'Catering' },
    { value: 'generator', label: 'Generator' },
    { value: 'madap', label: 'Madap' },
    { value: 'light', label: 'Light' }
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Association Info Display */}
      {association && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center space-x-2">
            <div className="text-blue-600 font-medium">Adding member to:</div>
            <div className="text-blue-800 font-semibold">{association.name}</div>
          </div>
          <div className="text-blue-600 text-sm mt-1">
            {association.address?.city}, {association.address?.district}, {association.address?.state}
          </div>
        </div>
      )}

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
          <label className="block text-sm font-medium text-gray-700 mb-2">Business Name *</label>
          <input
            type="text"
            {...register('businessName', { required: 'Business name is required' })}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
              errors.businessName ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter business name"
          />
          {errors.businessName && (
            <p className="text-red-500 text-sm mt-1">{errors.businessName.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
          <input
            type="text"
            {...register('phone', { 
              required: 'Phone number is required',
              pattern: {
                value: /^[0-9]{10}$/,
                message: 'Please enter a valid 10-digit phone number'
              }
            })}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
              errors.phone ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter 10-digit phone number"
          />
          {errors.phone && (
            <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Birth Date</label>
          <input
            type="date"
            {...register('birthDate', {
              validate: (value) => {
                if (!value) return true; // Optional field
                const validation = validateBirthDate(value);
                return validation.isValid || validation.message;
              }
            })}
            min={getMinDateForPicker()}
            max={getMaxDateForPicker()}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
              errors.birthDate ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.birthDate && (
            <p className="text-red-500 text-sm mt-1">{errors.birthDate.message}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">Optional - Member must be at least 18 years old</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
          <select
            {...register('state', { required: 'State is required' })}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
              errors.state ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="Maharashtra">Maharashtra</option>
            <option value="Delhi">Delhi</option>
            <option value="Karnataka">Karnataka</option>
            <option value="Tamil Nadu">Tamil Nadu</option>
            <option value="Telangana">Telangana</option>
            <option value="Gujarat">Gujarat</option>
            <option value="Uttar Pradesh">Uttar Pradesh</option>
            <option value="West Bengal">West Bengal</option>
            <option value="Rajasthan">Rajasthan</option>
            <option value="Andhra Pradesh">Andhra Pradesh</option>
            <option value="Madhya Pradesh">Madhya Pradesh</option>
            <option value="Kerala">Kerala</option>
            <option value="Odisha">Odisha</option>
            <option value="Punjab">Punjab</option>
            <option value="Haryana">Haryana</option>
            <option value="Bihar">Bihar</option>
            <option value="Jharkhand">Jharkhand</option>
            <option value="Assam">Assam</option>
            <option value="Chhattisgarh">Chhattisgarh</option>
            <option value="Uttarakhand">Uttarakhand</option>
          </select>
          {errors.state && (
            <p className="text-red-500 text-sm mt-1">{errors.state.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Business Type *</label>
          <select
            {...register('businessType', { required: 'Business type is required' })}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
              errors.businessType ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select business type</option>
            {businessTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
          {errors.businessType && (
            <p className="text-red-500 text-sm mt-1">{errors.businessType.message}</p>
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

      {/* Profile Image Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture</label>
        <div className="flex items-center space-x-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleImage}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
          />
          {preview && (
            <div className="relative">
              <img src={preview} alt="Preview" className="h-16 w-16 rounded-lg object-cover" />
              <button
                type="button"
                onClick={removeImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
              >
                ×
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
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
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Adding...</span>
            </>
          ) : (
            <span>Add Member</span>
          )}
        </button>
      </div>
    </form>
  );
};

export default AddAssociationMemberForm;





