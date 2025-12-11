import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Modal from './Modal';
import { eventApi, publicAssociationApi } from '../services/eventApi';
import { uploadApi } from '../services/uploadApi';
import toast from 'react-hot-toast';
import {
  Loader2,
  User,
  Phone,
  Mail,
  Building2,
  MapPin,
  Camera,
  X,
  CreditCard,
  IndianRupee,
  CheckCircle,
  Download
} from 'lucide-react';

const BUSINESS_TYPES = [
  { value: 'catering', label: 'Catering' },
  { value: 'sound', label: 'Sound' },
  { value: 'mandap', label: 'Mandap' },
  { value: 'light', label: 'Light' },
  { value: 'decorator', label: 'Decorator' },
  { value: 'photography', label: 'Photography' },
  { value: 'videography', label: 'Videography' },
  { value: 'transport', label: 'Transport' },
  { value: 'other', label: 'Other' }
];

const PROFILE_PLACEHOLDER =
  'data:image/svg+xml;utf8,<svg xmlns=%27http://www.w3.org/2000/svg%27 width=%27256%27 height=%27256%27 viewBox=%270 0 256 256%27><rect width=%27256%27 height=%27256%27 rx=%2760%27 fill=%27%23f3f4f6%27/><circle cx=%27128%27 cy=%2796%27 r=%2760%27 fill=%27%23d1d5db%27/><path d=%27M56 220c0-46 36-84 72-84s72 38 72 84%27 fill=%27%239ca3af%27/></svg>';

const ManualRegistrationModal = ({ isOpen, onClose, eventId, event, onSuccess }) => {
  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm({
    mode: 'onSubmit'
  });
  
  const [associations, setAssociations] = useState([]);
  const [loadingAssociations, setLoadingAssociations] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoError, setPhotoError] = useState('');
  const [registering, setRegistering] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash'); // Default to cash
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registrationData, setRegistrationData] = useState(null);
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  
  const selectedCity = watch('city');
  const phoneNumber = watch('phone');
  
  useEffect(() => {
    if (selectedCity && selectedCity.length >= 2) {
      loadAssociations(selectedCity);
    } else {
      setAssociations([]);
      setValue('associationId', '');
    }
  }, [selectedCity, setValue]);
  
  useEffect(() => {
    if (!isOpen) {
      reset();
      setPhoto(null);
      setPhotoPreview(null);
      setPhotoError('');
      setPaymentMethod('cash');
      setRegistrationSuccess(false);
      setRegistrationData(null);
      setAssociations([]);
      setIsAlreadyRegistered(false);
      setPhoneError('');
      setCheckingPhone(false);
    }
  }, [isOpen, reset]);

  // Check registration status when phone number changes
  useEffect(() => {
    const checkPhoneRegistration = async () => {
      if (!phoneNumber || !eventId) {
        setIsAlreadyRegistered(false);
        setPhoneError('');
        return;
      }

      const cleanedPhone = phoneNumber.replace(/\D/g, '');
      if (cleanedPhone.length !== 10) {
        setIsAlreadyRegistered(false);
        setPhoneError('');
        return;
      }

      try {
        setCheckingPhone(true);
        setPhoneError('');
        const status = await eventApi.checkPublicRegistrationStatus(eventId, cleanedPhone);
        
        if (status.isRegistered) {
          setIsAlreadyRegistered(true);
          setPhoneError('This phone number is already registered for this event. Please use a different number.');
        } else {
          setIsAlreadyRegistered(false);
          setPhoneError('');
        }
      } catch (err) {
        console.error('Error checking registration status:', err);
        setIsAlreadyRegistered(false);
        setPhoneError('');
      } finally {
        setCheckingPhone(false);
      }
    };

    // Debounce the check to avoid too many API calls
    const timeoutId = setTimeout(() => {
      checkPhoneRegistration();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [phoneNumber, eventId]);
  
  const loadAssociations = async (city) => {
    try {
      setLoadingAssociations(true);
      const data = await publicAssociationApi.getAssociationsByCity(city);
      setAssociations(data.associations || []);
    } catch (err) {
      console.error('Error loading associations:', err);
      toast.error('Failed to load associations');
      setAssociations([]);
    } finally {
      setLoadingAssociations(false);
    }
  };
  
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    
    if (!file) {
      setPhoto(null);
      setPhotoPreview(null);
      return;
    }
    
    const maxSizeBeforeOptimization = 30 * 1024 * 1024; // 30MB
    if (file.size > maxSizeBeforeOptimization) {
      toast.error('Image is too large. Please choose an image smaller than 30MB.');
      e.target.value = '';
      return;
    }
    
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload an image (JPG, PNG, GIF, or WEBP).');
      e.target.value = '';
      return;
    }
    
    setPhoto(file);
    setPhotoError('');
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoPreview(event.target.result);
    };
    reader.readAsDataURL(file);
  };
  
  const removePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    setPhotoError('Profile photo is required');
    const fileInput = document.getElementById('manual-reg-photo');
    if (fileInput) {
      fileInput.value = '';
    }
  };
  
  const onSubmit = async (formData) => {
    try {
      setRegistering(true);
      setPhotoError('');
      
      // Check if already registered before proceeding
      if (isAlreadyRegistered) {
        toast.error('This phone number is already registered for this event. Please use a different number.');
        setRegistering(false);
        return;
      }
      
      if (!photo) {
        setPhotoError('Profile photo is required');
        toast.error('Profile photo is required');
        setRegistering(false);
        return;
      }
      
      // Upload photo to Cloudinary
      let photoUrl = null;
      if (photo) {
        try {
          const optimizedPhoto = await uploadApi.optimizeImage(photo, {
            maxWidth: 800,
            maxHeight: 800,
            quality: 0.85,
            maxSizeMB: 1,
          });
          
          const uploadResult = await uploadApi.uploadProfileImage(optimizedPhoto);
          photoUrl = uploadResult.url || uploadResult.image || uploadResult.filename || null;
        } catch (uploadError) {
          console.error('Photo upload error:', uploadError);
          toast.error('Failed to upload photo. Please try again.');
          setRegistering(false);
          return;
        }
      }
      
      // Prepare registration payload
      const registrationPayload = {
        name: formData.name.trim(),
        phone: formData.phone.replace(/\D/g, ''),
        email: formData.email?.trim() || null,
        businessName: formData.businessName.trim(),
        businessType: formData.businessType,
        city: formData.city?.trim() || null,
        associationId: formData.associationId ? parseInt(formData.associationId, 10) : null,
        photo: photoUrl,
        paymentMethod: paymentMethod // Include payment method
      };
      
      if (paymentMethod === 'cash') {
        // For cash payment, create registration directly with paid status
        const response = await eventApi.createManualRegistration(eventId, registrationPayload);
        setRegistrationData(response);
        setRegistrationSuccess(true);
        toast.success('Registration created successfully with cash payment!');
        if (onSuccess) {
          onSuccess(response);
        }
      } else {
        // For Razorpay, initiate payment flow
        const paymentData = await eventApi.initiatePublicRegistration(eventId, registrationPayload);
        
        // Open Razorpay checkout
        const options = {
          ...paymentData.paymentOptions,
          handler: async function (response) {
            try {
              const confirmData = await eventApi.confirmPublicPayment(
                eventId,
                {
                  memberId: paymentData.member.id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature
                }
              );
              
              setRegistrationData(confirmData);
              setRegistrationSuccess(true);
              toast.success('Registration completed successfully!');
              if (onSuccess) {
                onSuccess(confirmData);
              }
            } catch (err) {
              console.error('Payment confirmation error:', err);
              toast.error(err.response?.data?.message || err.message || 'Payment confirmation failed');
            } finally {
              setRegistering(false);
            }
          },
          modal: {
            ondismiss: function() {
              console.log('Payment cancelled');
              setRegistering(false);
            }
          }
        };
        
        if (typeof window.Razorpay === 'undefined') {
          throw new Error('Payment gateway not loaded. Please refresh the page.');
        }
        
        const rzp = new window.Razorpay(options);
        rzp.open();
        
        rzp.on('payment.failed', function (response) {
          console.error('Payment failed:', response);
          toast.error('Payment failed. Please try again.');
          setRegistering(false);
        });
      }
      
    } catch (err) {
      console.error('Registration error:', err);
      toast.error(err.response?.data?.message || err.message || 'Registration failed');
      setRegistering(false);
    }
  };
  
  const registrationFee = parseFloat(event?.registrationFee ?? event?.fee) || 0;
  const isFree = registrationFee === 0;
  
  if (registrationSuccess) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Registration Successful" size="lg">
        <div className="p-6">
          <div className="text-center mb-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Registration Completed!</h3>
            <p className="text-gray-600">
              {paymentMethod === 'cash' 
                ? 'Registration has been created with cash payment.'
                : 'Payment has been confirmed and registration is complete.'}
            </p>
          </div>
          
          {registrationData && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Registration ID:</span>
                  <span className="ml-2 font-semibold">#{registrationData.registration?.id || registrationData.registrationId}</span>
                </div>
                <div>
                  <span className="text-gray-500">Payment Status:</span>
                  <span className="ml-2 font-semibold capitalize">{registrationData.registration?.paymentStatus || 'paid'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Amount:</span>
                  <span className="ml-2 font-semibold">₹ {registrationData.registration?.amountPaid || registrationFee}</span>
                </div>
                <div>
                  <span className="text-gray-500">Payment Method:</span>
                  <span className="ml-2 font-semibold capitalize">{paymentMethod}</span>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-3">
            {registrationData?.registration?.id && (
              <button
                onClick={async () => {
                  try {
                    const registrationId = registrationData.registration?.id || registrationData.registrationId;
                    if (!registrationId || !eventId) {
                      toast.error('Registration ID or Event ID not found');
                      return;
                    }
                    toast.loading('Downloading visitor pass...', { id: `download-pass-${registrationId}` });
                    const pdfBlob = await eventApi.downloadRegistrationPdf(eventId, registrationId);
                    const url = window.URL.createObjectURL(pdfBlob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `mandapam-visitor-pass-${registrationId}.pdf`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                    toast.success('Visitor pass downloaded successfully.', { id: `download-pass-${registrationId}` });
                  } catch (error) {
                    console.error('Download pass error:', error);
                    toast.error(
                      error.response?.data?.message || error.message || 'Failed to download visitor pass.',
                      { id: `download-pass-${registrationData.registration?.id || registrationData.registrationId}` }
                    );
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-primary-700 bg-white border border-primary-300 rounded-lg hover:bg-primary-50 inline-flex items-center"
              >
                <Download className="h-4 w-4 mr-2" /> Download Pass
              </button>
            )}
            <button
              onClick={() => {
                setRegistrationSuccess(false);
                setRegistrationData(null);
                reset();
                setPhoto(null);
                setPhotoPreview(null);
                setPaymentMethod('cash');
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Register Another
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    );
  }
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manual Registration" size="xl">
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
        {/* Payment Method Selection */}
        <div className="bg-gray-50 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-3">Payment Method *</label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setPaymentMethod('cash')}
              className={`p-4 border-2 rounded-lg transition-colors ${
                paymentMethod === 'cash'
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-300 bg-white hover:border-gray-400'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <IndianRupee className="h-5 w-5" />
                <span className="font-medium">Cash Payment</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Mark as paid immediately</p>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('razorpay')}
              className={`p-4 border-2 rounded-lg transition-colors ${
                paymentMethod === 'razorpay'
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-300 bg-white hover:border-gray-400'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <CreditCard className="h-5 w-5" />
                <span className="font-medium">Razorpay</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Online payment gateway</p>
            </button>
          </div>
        </div>
        
        {/* Registration Fee Display */}
        {!isFree && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">Registration Fee:</span>
              <span className="text-lg font-bold text-blue-900">₹ {registrationFee.toFixed(2)}</span>
            </div>
            {paymentMethod === 'cash' && (
              <p className="text-xs text-blue-700 mt-1">This registration will be marked as paid immediately</p>
            )}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="h-4 w-4 inline mr-1" />
              Full Name *
            </label>
            <input
              type="text"
              {...register('name', { 
                required: 'Name is required',
                minLength: { value: 2, message: 'Name must be at least 2 characters' }
              })}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter full name"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>
          
          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Phone className="h-4 w-4 inline mr-1" />
              Phone Number *
            </label>
            <div className="relative">
              <input
                type="tel"
                {...register('phone', { 
                  required: 'Phone number is required',
                  pattern: {
                    value: /^[0-9]{10}$/,
                    message: 'Phone must be exactly 10 digits'
                  }
                })}
                maxLength={10}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.phone || isAlreadyRegistered ? 'border-red-500' : 'border-gray-300'
                } ${isAlreadyRegistered ? 'bg-red-50' : ''}`}
                placeholder="9876543210"
                disabled={checkingPhone}
              />
              {checkingPhone && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                </div>
              )}
            </div>
            {checkingPhone && (
              <p className="text-gray-500 text-sm mt-1">Checking registration status...</p>
            )}
            {errors.phone && (
              <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
            )}
            {phoneError && !errors.phone && (
              <p className="text-red-500 text-sm mt-1 font-medium">{phoneError}</p>
            )}
          </div>
          
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="h-4 w-4 inline mr-1" />
              Email (Optional)
            </label>
            <input
              type="email"
              {...register('email', { 
                validate: (value) => {
                  if (!value) return true;
                  return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value) || 'Invalid email address';
                }
              })}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="your@email.com"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>
          
          {/* Business Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Building2 className="h-4 w-4 inline mr-1" />
              Business Name *
            </label>
            <input
              type="text"
              {...register('businessName', { 
                required: 'Business name is required',
                minLength: { value: 2, message: 'Business name must be at least 2 characters' }
              })}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.businessName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Your business name"
            />
            {errors.businessName && (
              <p className="text-red-500 text-sm mt-1">{errors.businessName.message}</p>
            )}
          </div>
          
          {/* Business Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Type *
            </label>
            <select
              {...register('businessType', { required: 'Business type is required' })}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.businessType ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select business type</option>
              {BUSINESS_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
            {errors.businessType && (
              <p className="text-red-500 text-sm mt-1">{errors.businessType.message}</p>
            )}
          </div>
          
          {/* City */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="h-4 w-4 inline mr-1" />
              City (Optional)
            </label>
            <input
              type="text"
              {...register('city', { 
                validate: (value) => {
                  if (!value) return true;
                  return value.length >= 2 || 'City must be at least 2 characters';
                }
              })}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.city ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter city name (optional)"
            />
            {errors.city && (
              <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>
            )}
          </div>
          
          {/* Association */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Association (Optional)
            </label>
            {loadingAssociations ? (
              <div className="flex items-center p-3 border border-gray-300 rounded-lg">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-gray-600">Loading associations...</span>
              </div>
            ) : (
              <select
                {...register('associationId')}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.associationId ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={!selectedCity || associations.length === 0}
              >
                <option value="">
                  {!selectedCity 
                    ? 'Enter city to view associations (optional)' 
                    : associations.length === 0 
                      ? 'No associations found for this city' 
                      : 'Select association (optional)'}
                </option>
                {associations.map(assoc => (
                  <option key={assoc.id} value={String(assoc.id)}>{assoc.name}</option>
                ))}
              </select>
            )}
          </div>
          
          {/* Photo Upload */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Camera className="h-4 w-4 inline mr-1" />
              Profile Photo *
            </label>
            <div
              className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-lg transition-colors ${
                photoError ? 'border-red-500 hover:border-red-600' : 'border-gray-300 hover:border-primary-400'
              }`}
            >
              <div className="space-y-1 text-center w-full">
                {!photoPreview ? (
                  <>
                    <label
                      htmlFor="manual-reg-photo"
                      className="cursor-pointer flex flex-col items-center space-y-2 text-gray-600 hover:text-primary-600"
                    >
                      <Camera className="h-10 w-10" />
                      <span className="bg-white rounded-md font-medium">
                        Capture Photo from Camera
                      </span>
                    </label>
                    <input
                      id="manual-reg-photo"
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      capture="user"
                      onChange={handlePhotoChange}
                    />
                    <p className="text-xs text-gray-500">Max 30MB - JPG, PNG, GIF, WEBP</p>
                  </>
                ) : (
                  <div className="relative inline-block">
                    <img 
                      src={photoPreview} 
                      alt="Photo preview" 
                      className="h-32 w-32 object-cover rounded-lg border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
            {photoError && (
              <p className="text-red-500 text-sm mt-2">{photoError}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="text-gray-600">
            <span className="font-semibold">Registration Fee: </span>
            {isFree ? (
              <span className="text-green-600 font-bold">Free</span>
            ) : (
              <span className="text-gray-900">₹ {registrationFee.toFixed(2)}</span>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={registering}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={registering || isAlreadyRegistered || checkingPhone}
              className={`inline-flex items-center px-6 py-2 text-sm font-semibold rounded-lg transition-all ${
                registering || isAlreadyRegistered || checkingPhone
                  ? 'bg-primary-400 text-white cursor-not-allowed'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              {registering ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  {paymentMethod === 'cash' ? 'Creating...' : 'Processing...'}
                </>
              ) : (
                <>
                  {paymentMethod === 'cash' ? (
                    <>
                      <IndianRupee className="h-5 w-5 mr-2" />
                      Register with Cash
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5 mr-2" />
                      Register & Pay
                    </>
                  )}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default ManualRegistrationModal;

