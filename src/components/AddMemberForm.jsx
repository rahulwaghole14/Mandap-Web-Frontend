import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { memberApi } from '../services/memberApi';
import { uploadApi } from '../services/uploadApi';
import toast from 'react-hot-toast';
import { formatDateForAPI, getMaxDateForPicker, getMinDateForPicker, validateBirthDate } from '../utils/dateUtils';

const AddMemberForm = ({ onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [businessImages, setBusinessImages] = useState([]);
  const [businessImagePreviews, setBusinessImagePreviews] = useState([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm();



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

  const handleBusinessImages = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setBusinessImages(files);
      
      // Create previews
      const previews = files.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });
      });
      
      Promise.all(previews).then(setBusinessImagePreviews);
    }
  };

  const removeBusinessImage = (index) => {
    const newImages = businessImages.filter((_, i) => i !== index);
    const newPreviews = businessImagePreviews.filter((_, i) => i !== index);
    setBusinessImages(newImages);
    setBusinessImagePreviews(newPreviews);
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      let profileImage = null;
      let businessImageUrls = [];
      
      // Upload profile image if provided (using Cloudinary)
      if (image) {
        try {
          console.log('AddMemberForm - Uploading profile image to Cloudinary');
          const uploadResult = await uploadApi.uploadProfileImage(image);
          console.log('AddMemberForm - Profile image upload result:', uploadResult);
          // Get the Cloudinary URL (secure_url)
          profileImage = uploadResult.url || uploadResult.image || uploadResult.filename;
          console.log('AddMemberForm - Profile image URL:', profileImage);
        } catch (uploadError) {
          console.error('AddMemberForm - Profile image upload error:', uploadError);
          toast.error('Failed to upload profile image. Member will be created without profile image.');
        }
      }
      
      // Upload business images if provided (using Cloudinary)
      if (businessImages.length > 0) {
        try {
          console.log('AddMemberForm - Uploading', businessImages.length, 'business images to Cloudinary');
          const uploadPromises = businessImages.map(async (file, index) => {
            try {
              // Use uploadImage for business images (they go to mandap-events folder or we can use uploadImage)
              const uploadResult = await uploadApi.uploadImage(file);
              console.log(`AddMemberForm - Business image ${index + 1} upload result:`, uploadResult);
              // Get the Cloudinary URL (secure_url)
              return uploadResult.url || uploadResult.image || uploadResult.filename;
            } catch (error) {
              console.error(`AddMemberForm - Failed to upload business image ${index + 1}:`, error);
              throw new Error(`Failed to upload ${file.name}: ${error.message}`);
            }
          });
          
          businessImageUrls = await Promise.all(uploadPromises);
          console.log('AddMemberForm - All business images uploaded. URLs:', businessImageUrls);
        } catch (uploadError) {
          console.error('AddMemberForm - Business images upload error:', uploadError);
          toast.error(uploadError.message || 'Failed to upload business images. Member will be created without business images.');
        }
      }
      
      // Transform form data to match backend schema
      const memberData = {
        // Core required fields
        name: data.name.trim(),
        businessName: data.businessName.trim(),
        phone: data.phone.trim(),
        state: data.state || 'Maharashtra',
        businessType: data.businessType,
        city: data.city,
        district: data.district,
        pincode: data.pincode,
        associationName: data.associationName,
        // Optional fields - only include if they have values
        ...(data.birthDate && { birthDate: formatDateForAPI(data.birthDate) }),
        ...(data.email && { email: data.email }),
        ...(data.address && { address: data.address }),
        ...(data.gstNumber && { gstNumber: data.gstNumber }),
        ...(data.description && { description: data.description }),
        ...(data.experience && { experience: parseInt(data.experience) }),
        ...(profileImage && { profileImage: profileImage }),
        ...(businessImageUrls.length > 0 && { businessImages: businessImageUrls })
      };

      const response = await memberApi.createMember(memberData);
      onSuccess(response.member);
      reset();
      removeImage();
      setBusinessImages([]);
      setBusinessImagePreviews([]);
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
    { value: 'catering', label: 'Catering' },
    { value: 'sound', label: 'Sound' },
    { value: 'mandapam', label: 'Mandapam' },
    { value: 'light', label: 'Light' },
    { value: 'decorator', label: 'Decorator' },
    { value: 'photography', label: 'Photography' },
    { value: 'videography', label: 'Videography' },
    { value: 'transport', label: 'Transport' },
    { value: 'other', label: 'Other' }
  ];

  // Mock associations - in real app, this would come from API based on selected city
  const associations = [
    'Mumbai Mandapam Association',
    'Pune Mandapam Association', 
    'Nagpur Mandapam Association',
    'Thane Mandapam Association',
    'Nashik Mandapam Association'
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
          <label className="block text-sm font-medium text-gray-700 mb-2">District</label>
          <input
            type="text"
            {...register('district')}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Enter district"
          />
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Association Name *</label>
          <select
            {...register('associationName', { required: 'Association name is required' })}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
              errors.associationName ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select association</option>
            {associations.map(association => (
              <option key={association} value={association}>{association}</option>
            ))}
          </select>
          {errors.associationName && (
            <p className="text-red-500 text-sm mt-1">{errors.associationName.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input
            type="email"
            {...register('email', {
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">GST Number</label>
          <input
            type="text"
            {...register('gstNumber', {
              pattern: {
                value: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
                message: 'Please enter a valid GST number (e.g., 12ABCDE1234F1Z5)'
              }
            })}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
              errors.gstNumber ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter GST number (e.g., 12ABCDE1234F1Z5)"
          />
          {errors.gstNumber && (
            <p className="text-red-500 text-sm mt-1">{errors.gstNumber.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Experience (Years)</label>
          <input
            type="number"
            {...register('experience', {
              min: { value: 0, message: 'Experience cannot be negative' },
              max: { value: 100, message: 'Experience cannot exceed 100 years' }
            })}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
              errors.experience ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter years of experience (0-100)"
            min="0"
            max="100"
          />
          {errors.experience && (
            <p className="text-red-500 text-sm mt-1">{errors.experience.message}</p>
          )}
        </div>
      </div>

      {/* Full Address Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Full Address</label>
        <textarea
          {...register('address')}
          rows={3}
          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
            errors.address ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter complete address"
        />
        {errors.address && (
          <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>
        )}
      </div>

      {/* Business Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Business Description</label>
        <textarea
          {...register('description')}
          rows={3}
          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
            errors.description ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Describe your business and services"
        />
        {errors.description && (
          <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
        )}
      </div>





      {/* Profile Image */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Profile Image</label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
          <div className="space-y-1 text-center">
            {!preview ? (
              <>
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-4h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
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
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Business Images */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Business Images</label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
          <div className="space-y-1 text-center">
            {businessImagePreviews.length === 0 ? (
              <>
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-4h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="flex text-sm text-gray-600">
                  <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500">
                    <span>Upload business images</span>
                    <input
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      multiple
                      onChange={handleBusinessImages}
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB each (Multiple files allowed)</p>
              </>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {businessImagePreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        alt={`Business preview ${index + 1}`}
                        className="h-24 w-24 object-cover rounded-lg mx-auto"
                      />
                      <button
                        type="button"
                        onClick={() => removeBusinessImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex text-sm text-gray-600">
                  <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500">
                    <span>Add more images</span>
                    <input
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      multiple
                      onChange={handleBusinessImages}
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
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

export default AddMemberForm;
