
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Layout from '../components/Layout';
import { Upload, X, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const AddVendorForm = ({ vendor = null, isEditing = false, onSuccess = () => {}, onCancel = null }) => {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormReady, setIsFormReady] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm();

  const selectedState = watch('state');

  // Populate form when editing
  useEffect(() => {
    if (isEditing && vendor && typeof vendor === 'object') {
      // Add a small delay to ensure form is fully initialized
      const timer = setTimeout(() => {
        try {
          console.log('Populating form with vendor data:', vendor);
          
          // Validate vendor object structure
          if (!vendor._id) {
            console.warn('Vendor object missing _id:', vendor);
            return;
          }
        
        // Basic fields - only set if form is ready
        if (vendor.name && typeof vendor.name === 'string') setValue('name', vendor.name);
        if (vendor.businessName && typeof vendor.businessName === 'string') setValue('businessName', vendor.businessName);
        if (vendor.category && typeof vendor.category === 'string') setValue('category', vendor.category);
        if (vendor.status && typeof vendor.status === 'string') setValue('status', vendor.status);
        if (vendor.phone && typeof vendor.phone === 'string') setValue('phone', vendor.phone);
        if (vendor.email && typeof vendor.email === 'string') setValue('email', vendor.email);
        if (vendor.description && typeof vendor.description === 'string') setValue('description', vendor.description);
        
        // Address fields
        if (vendor.address && typeof vendor.address === 'object') {
          if (vendor.address.street && typeof vendor.address.street === 'string') setValue('street', vendor.address.street);
          if (vendor.address.city && typeof vendor.address.city === 'string') setValue('city', vendor.address.city);
          if (vendor.address.district && typeof vendor.address.district === 'string') setValue('district', vendor.address.district);
          if (vendor.address.state && typeof vendor.address.state === 'string') setValue('state', vendor.address.state);
          if (vendor.address.pincode && typeof vendor.address.pincode === 'string') setValue('pincode', vendor.address.pincode);
        }
        
        // Date field with safety check
        if (vendor.membershipExpiry) {
          try {
            const date = new Date(vendor.membershipExpiry);
            if (!isNaN(date.getTime())) {
              setValue('membershipExpiry', date.toISOString().split('T')[0]);
            }
          } catch (error) {
            console.warn('Invalid date format:', vendor.membershipExpiry);
          }
        }
        
        // Pricing field
        if (vendor.pricing && typeof vendor.pricing === 'object' && vendor.pricing.startingPrice !== undefined) {
          setValue('startingPrice', vendor.pricing.startingPrice);
        }
        
        console.log('Form populated successfully');
        setIsFormReady(true);
      } catch (error) {
        console.error('Error populating form:', error);
        setIsFormReady(false);
      }
        }, 100); // 100ms delay
      
      return () => clearTimeout(timer);
    } else if (!isEditing) {
      setIsFormReady(true);
    }
  }, [isEditing, vendor, setValue]);

  const states = [
    'Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'Gujarat', 'Rajasthan',
    'Uttar Pradesh', 'West Bengal', 'Telangana', 'Andhra Pradesh'
  ];

  const districts = {
    'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik'],
    'Delhi': ['New Delhi', 'Central Delhi', 'North Delhi', 'South Delhi'],
    'Karnataka': ['Bangalore', 'Mysore', 'Hubli', 'Mangalore'],
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Salem'],
    'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot'],
    'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota'],
    'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Varanasi', 'Agra'],
    'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol'],
    'Telangana': ['Hyderabad', 'Warangal', 'Karimnagar', 'Nizamabad'],
    'Andhra Pradesh': ['Vijayawada', 'Guntur', 'Visakhapatnam', 'Tirupati']
  };

  const categories = [
    'Catering', 'Decoration', 'Photography', 'Videography', 'Music', 
    'Transport', 'Venue', 'Makeup', 'Jewelry', 'Clothing', 'Other'
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

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const vendorData = {
        ...data,
        image: image?.name,
        addedBy: 'Admin'
      };
      
      console.log('Vendor Data:', vendorData);
      
      if (onSuccess) {
        onSuccess(vendorData);
      }
      
      if (!isEditing) {
        reset();
        removeImage();
      }
    } catch (error) {
      toast.error(`Failed to ${isEditing ? 'update' : 'add'} vendor. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while form is being prepared
  if (isEditing && !isFormReady) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading vendor data...</p>
        </div>
      </div>
    );
  }

  // Show error state if vendor data is invalid
  if (isEditing && (!vendor || !vendor._id)) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-8">
          <div className="text-red-600 text-lg font-semibold mb-2">Error</div>
          <p className="text-gray-600 mb-4">Invalid vendor data. Please try again.</p>
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{isEditing ? 'Edit Vendor' : 'Add New Vendor'}</h1>
        <p className="text-gray-600 mt-2">
          {isEditing ? 'Update vendor information' : 'Register a new vendor in the Mandapam Association'}
        </p>
      </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Basic Information */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Name *
                </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  {...register('category', { required: 'Category is required' })}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.category ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                {errors.category && (
                  <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  {...register('status', { required: 'Status is required' })}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.status ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Pending">Pending</option>
                  <option value="Suspended">Suspended</option>
                </select>
                {errors.status && (
                  <p className="text-red-500 text-sm mt-1">{errors.status.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Joining
                </label>
                <input
                  type="date"
                  {...register('dateOfJoining')}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Membership Expiry *
                </label>
                <input
                  type="date"
                  {...register('membershipExpiry', { required: 'Membership expiry is required' })}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.membershipExpiry ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.membershipExpiry && (
                  <p className="text-red-500 text-sm mt-1">{errors.membershipExpiry.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp Number
                </label>
                <input
                  type="tel"
                  {...register('whatsapp')}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter WhatsApp number (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
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
          </div>

          {/* Address Information */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Address Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address *
                </label>
                <input
                  type="text"
                  {...register('street', { required: 'Street address is required' })}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.street ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter street address"
                />
                {errors.street && (
                  <p className="text-red-500 text-sm mt-1">{errors.street.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State *
                </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  District *
                </label>
                <select
                  {...register('district', { required: 'District is required' })}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.district ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={!selectedState}
                >
                  <option value="">Select district</option>
                  {selectedState && districts[selectedState]?.map(district => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
                {errors.district && (
                  <p className="text-red-500 text-sm mt-1">{errors.district.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  {...register('city', { required: 'City is required' })}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.city ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter city name"
                />
                {errors.city && (
                  <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pincode *
                </label>
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

          {/* Business Details */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Business Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter business description (optional)"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Starting Price (₹)
                </label>
                <input
                  type="number"
                  {...register('startingPrice')}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter starting price"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Documents</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Logo/Image
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-primary-500 transition-colors">
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
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                    </>
                  ) : (
                    <div className="relative">
                      <img
                        src={preview}
                        alt="Preview"
                        className="mx-auto h-32 w-32 object-cover rounded-lg"
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
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => {
                reset();
                removeImage();
              }}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Reset Form
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>{isEditing ? 'Updating Vendor...' : 'Adding Vendor...'}</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>{isEditing ? 'Update Vendor' : 'Add Vendor'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
  );
};

export default AddVendorForm;
