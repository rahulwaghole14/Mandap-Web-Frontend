import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import eventApi, { publicAssociationApi } from '../services/eventApi';
import { uploadApi } from '../services/uploadApi';
import { EVENT_SLUGS } from '../constants';
import { 
  Calendar, 
  MapPin, 
  IndianRupee, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  ArrowLeft,
  CreditCard,
  Download,
  Clock,
  User,
  Phone,
  Mail,
  Building2,
  MapPin as MapPinIcon,
  Camera,
  X,
  Image as ImageIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import MandapamLogo from '../components/MandapamLogo';

const BUSINESS_TYPES = [
  { value: 'catering', label: 'Catering' },
  { value: 'sound', label: 'Sound' },
  { value: 'mandap', label: 'Mandap' },
  { value: 'madap', label: 'Event Planner' },
  { value: 'light', label: 'Light' },
  { value: 'decorator', label: 'Decorator' },
  { value: 'photography', label: 'Photography' },
  { value: 'videography', label: 'Videography' },
  { value: 'transport', label: 'Transport' },
  { value: 'other', label: 'Other' }
];

const EventRegistrationPage = () => {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors }, watch, setValue, trigger, getValues } = useForm({
    mode: 'onSubmit',
    reValidateMode: 'onChange'
  });
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [registration, setRegistration] = useState(null);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState(null);
  const [resolvedEventId, setResolvedEventId] = useState(null);
  const [associations, setAssociations] = useState([]);
  const [loadingAssociations, setLoadingAssociations] = useState(false);
  const [memberId, setMemberId] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoError, setPhotoError] = useState('');
  const registrationDisplayName = registration?.memberName || registration?.member?.name || registration?.name || '';
  
  // Get slug from params or extract from pathname if params is undefined
  const actualSlug = slug || location.pathname.replace(/^\//, '').split('/')[0];
  const normalizedSlug = actualSlug?.toLowerCase();
  
  // Watch city to load associations
  const selectedCity = watch('city');
  
  // Resolve event ID from slug
  useEffect(() => {
    let finalEventId = null;
    
    if (!actualSlug) {
      setError('Event not found. Please check the URL.');
      setLoading(false);
      return;
    }
    
    finalEventId = EVENT_SLUGS[normalizedSlug] || EVENT_SLUGS[actualSlug];
    
    if (!finalEventId && !isNaN(actualSlug)) {
      finalEventId = actualSlug;
    }
    
    if (!finalEventId) {
      setError(`Event not found for "${actualSlug}". Please check the event URL.`);
      setLoading(false);
      return;
    }
    
    setResolvedEventId(finalEventId);
  }, [actualSlug, normalizedSlug]);
  
  // Load event
  useEffect(() => {
    if (resolvedEventId) {
      loadEvent(resolvedEventId);
    }
  }, [resolvedEventId]);

  // Load associations when city changes
  useEffect(() => {
    if (selectedCity && selectedCity.length >= 2) {
      loadAssociations(selectedCity);
    } else {
      setAssociations([]);
      setValue('associationId', '');
    }
  }, [selectedCity, setValue]);

  const loadEvent = async (eventIdToLoad) => {
    try {
      setLoading(true);
      setError(null);
      const data = await eventApi.getPublicEvent(eventIdToLoad);
      setEvent(data.event || data);
    } catch (err) {
      console.error('Error loading event:', err);
      let errorMsg = 'Failed to load event details';
      if (err.response?.status === 404) {
        errorMsg = `Event with ID ${eventIdToLoad} not found.`;
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

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

  const checkRegistrationStatus = async (phone) => {
    if (!phone || phone.length !== 10 || !resolvedEventId) {
      // Reset registration if phone is not valid
      setRegistration(null);
      return;
    }
    
    try {
      setCheckingStatus(true);
      const data = await eventApi.checkPublicRegistrationStatus(resolvedEventId, phone);
      if (data.isRegistered) {
        // Merge root-level qrDataURL into registration object if present
        const registrationWithQR = {
          ...data.registration,
          qrDataURL: data.qrDataURL || data.registration?.qrDataURL,
          qrCode: data.qrCode || data.registration?.qrCode,
          qrCodeUrl: data.qrCodeUrl || data.registration?.qrCodeUrl,
          qrCodeDataURL: data.qrCodeDataURL || data.registration?.qrCodeDataURL,
          qrToken: data.qrToken || data.registration?.qrToken,
          memberName: data.memberName || data.registration?.memberName || data.registration?.member?.name || data.registration?.name,
        };
        setRegistration(registrationWithQR);
        toast.success('You are already registered for this event!');
      } else {
        // Not registered, clear any previous registration
        setRegistration(null);
      }
    } catch (err) {
      console.error('Error checking registration status:', err);
      // If error checking, assume not registered - allow form submission
      setRegistration(null);
    } finally {
      setCheckingStatus(false);
    }
  };

  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return '-';
    try {
      const date = new Date(dateTimeStr);
      return date.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (err) {
      return dateTimeStr;
    }
  };

  const onSubmitRegistration = async (formData) => {
    try {
      setRegistering(true);
      setError(null);

      console.log('EventRegistrationPage - onSubmitRegistration called');
      console.log('EventRegistrationPage - formData from handleSubmit:', formData);
      
      // Also get values directly from form to ensure we have the latest
      const currentValues = getValues();
      console.log('EventRegistrationPage - Current form values from getValues():', currentValues);

      if (!resolvedEventId) {
        toast.error('Event ID not resolved. Please refresh the page.');
        setRegistering(false);
        return;
      }

      // Check if user is already registered before submitting
      if (registration) {
        toast.error('You are already registered for this event!');
        setRegistering(false);
        return;
      }

      // Use formData if available, otherwise fallback to currentValues
      const rawData = formData || currentValues;
      
      // Validate and clean form data before submission
      const cleanedData = {
        name: (rawData.name || '').trim(),
        phone: (rawData.phone || '').replace(/\D/g, ''), // Remove all non-digits
        email: (rawData.email || '').trim(),
        businessName: (rawData.businessName || '').trim(),
        businessType: (rawData.businessType || '').trim(),
        city: (rawData.city || '').trim(),
        associationId: (rawData.associationId || '').toString().trim(),
      };
      
      console.log('EventRegistrationPage - Cleaned data:', cleanedData);

      // Client-side validation with detailed logging
      const validationErrors = [];
      
      console.log('EventRegistrationPage - Validating cleaned data:');
      console.log('  name:', cleanedData.name, 'length:', cleanedData.name?.length);
      console.log('  phone:', cleanedData.phone, 'length:', cleanedData.phone?.length);
      console.log('  email:', cleanedData.email);
      console.log('  businessName:', cleanedData.businessName, 'length:', cleanedData.businessName?.length);
      console.log('  businessType:', cleanedData.businessType);
      console.log('  city:', cleanedData.city, 'length:', cleanedData.city?.length);
      console.log('  associationId:', cleanedData.associationId, 'type:', typeof cleanedData.associationId);
      
      if (!cleanedData.name || cleanedData.name.length < 2) {
        validationErrors.push('Name is required and must be at least 2 characters');
        console.log('  ❌ Name validation failed');
      }
      if (!cleanedData.phone || cleanedData.phone.length !== 10) {
        validationErrors.push('Phone number must be exactly 10 digits');
        console.log('  ❌ Phone validation failed');
      }
      if (cleanedData.email && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(cleanedData.email)) {
        validationErrors.push('Email must be valid if provided');
        console.log('  ❌ Email validation failed');
      }
      if (!cleanedData.businessName || cleanedData.businessName.length < 2) {
        validationErrors.push('Business name is required and must be at least 2 characters');
        console.log('  ❌ Business name validation failed');
      }
      if (!cleanedData.businessType) {
        validationErrors.push('Business type is required');
        console.log('  ❌ Business type validation failed');
      }
      if (cleanedData.city && cleanedData.city.length < 2) {
        validationErrors.push('City must be at least 2 characters when provided');
        console.log('  ❌ City validation failed (optional field provided)');
      }
      if (cleanedData.associationId === '0') {
        validationErrors.push('Please select a valid association when provided');
        console.log('  ❌ Association validation failed (optional field provided)');
      }

      if (validationErrors.length > 0) {
        console.log('EventRegistrationPage - Client-side validation failed:', validationErrors);
        const errorMsg = validationErrors.join(', ');
        setError(errorMsg);
        toast.error(errorMsg);
        setRegistering(false);
        return;
      }
      
      console.log('EventRegistrationPage - ✅ All client-side validations passed');

      if (!photo) {
        const message = 'Profile photo is required';
        setPhotoError(message);
        toast.error(message);
        setRegistering(false);
        return;
      }

      setPhotoError('');

      // Step 1: Upload photo to Cloudinary first if provided
      let photoUrl = null;
      if (photo) {
        try {
          // Optimize photo before upload (profile photo size: 800x800, max 1MB)
          const optimizedPhoto = await uploadApi.optimizeImage(photo, {
            maxWidth: 800,
            maxHeight: 800,
            quality: 0.85,
            maxSizeMB: 1,
          });
          console.log('EventRegistrationPage - Photo optimized:', {
            originalSize: (photo.size / 1024 / 1024).toFixed(2) + ' MB',
            optimizedSize: (optimizedPhoto.size / 1024 / 1024).toFixed(2) + ' MB',
          });
          
          // Upload optimized photo to Cloudinary
          console.log('EventRegistrationPage - Uploading photo to Cloudinary...');
          const uploadResult = await uploadApi.uploadProfileImage(optimizedPhoto);
          photoUrl = uploadResult.url || uploadResult.image || uploadResult.filename || null;
          console.log('EventRegistrationPage - Photo uploaded to Cloudinary:', photoUrl);
        } catch (uploadError) {
          console.error('EventRegistrationPage - Photo upload error:', uploadError);
          toast.error('Failed to upload photo. Please try again.');
          setRegistering(false);
          return;
        }
      }

      // Step 2: Prepare JSON payload for registration
      const registrationPayload = {
        name: cleanedData.name,
        phone: cleanedData.phone,
        email: cleanedData.email || null,
        businessName: cleanedData.businessName,
        businessType: cleanedData.businessType,
        city: cleanedData.city || null,
        associationId: cleanedData.associationId ? parseInt(cleanedData.associationId, 10) : null,
      };
      
      // Add photo URL if available
      if (photoUrl) {
        registrationPayload.photo = photoUrl;
      }
      
      console.log('EventRegistrationPage - JSON payload being sent:');
      console.log('  name:', registrationPayload.name);
      console.log('  phone:', registrationPayload.phone);
      console.log('  email:', registrationPayload.email);
      console.log('  businessName:', registrationPayload.businessName);
      console.log('  businessType:', registrationPayload.businessType);
      console.log('  city:', registrationPayload.city);
      console.log('  associationId:', registrationPayload.associationId, '(type:', typeof registrationPayload.associationId, ')');
      console.log('  photo:', registrationPayload.photo || 'none');

      console.log('EventRegistrationPage - Calling initiatePublicRegistration with eventId:', resolvedEventId);
      const paymentData = await eventApi.initiatePublicRegistration(resolvedEventId, registrationPayload);
      console.log('EventRegistrationPage - Registration response:', paymentData);

             // Free event - registration complete
       if (paymentData.isFree) {
         console.log('EventRegistrationPage - Free event registration response:', paymentData);
         console.log('EventRegistrationPage - Registration object:', paymentData.registration);
         console.log('EventRegistrationPage - QR code fields:', {
           qrDataURL: paymentData.qrDataURL || paymentData.registration?.qrDataURL,
           qrCode: paymentData.qrCode || paymentData.registration?.qrCode,
           qrCodeUrl: paymentData.qrCodeUrl || paymentData.registration?.qrCodeUrl,
           qrCodeDataURL: paymentData.qrCodeDataURL || paymentData.registration?.qrCodeDataURL,
           qrToken: paymentData.qrToken || paymentData.registration?.qrToken,
         });
         // Merge root-level qrDataURL into registration object
         const registrationWithQR = {
           ...paymentData.registration,
           qrDataURL: paymentData.qrDataURL || paymentData.registration?.qrDataURL,
           qrCode: paymentData.qrCode || paymentData.registration?.qrCode,
           qrCodeUrl: paymentData.qrCodeUrl || paymentData.registration?.qrCodeUrl,
           qrCodeDataURL: paymentData.qrCodeDataURL || paymentData.registration?.qrCodeDataURL,
           qrToken: paymentData.qrToken || paymentData.registration?.qrToken,
          memberName: paymentData.memberName || paymentData.registration?.memberName || paymentData.registration?.member?.name || paymentData.registration?.name || registrationPayload.name,
         };
         setRegistration(registrationWithQR);
         // Clear photo after successful registration
         setPhoto(null);
         setPhotoPreview(null);
         toast.success('Registration successful!');
         return;
       }

      // Store memberId for payment confirmation
      setMemberId(paymentData.member?.id);

      // Paid event - open Razorpay Checkout
      const options = {
        ...paymentData.paymentOptions,
        handler: async function (response) {
          try {
            // Step 2: Confirm payment
            const confirmData = await eventApi.confirmPublicPayment(
              resolvedEventId,
              {
                memberId: paymentData.member.id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              }
            );

            console.log('EventRegistrationPage - Payment confirmation response:', confirmData);
            console.log('EventRegistrationPage - Registration object:', confirmData.registration);
            console.log('EventRegistrationPage - QR code fields:', {
              qrDataURL: confirmData.qrDataURL || confirmData.registration?.qrDataURL,
              qrCode: confirmData.qrCode || confirmData.registration?.qrCode,
              qrCodeUrl: confirmData.qrCodeUrl || confirmData.registration?.qrCodeUrl,
              qrCodeDataURL: confirmData.qrCodeDataURL || confirmData.registration?.qrCodeDataURL,
              qrToken: confirmData.qrToken || confirmData.registration?.qrToken,
            });
            // Merge root-level qrDataURL into registration object
            const registrationWithQR = {
              ...confirmData.registration,
              qrDataURL: confirmData.qrDataURL || confirmData.registration?.qrDataURL,
              qrCode: confirmData.qrCode || confirmData.registration?.qrCode,
              qrCodeUrl: confirmData.qrCodeUrl || confirmData.registration?.qrCodeUrl,
              qrCodeDataURL: confirmData.qrCodeDataURL || confirmData.registration?.qrCodeDataURL,
              qrToken: confirmData.qrToken || confirmData.registration?.qrToken,
              memberName: confirmData.memberName || confirmData.registration?.memberName || confirmData.registration?.member?.name || confirmData.registration?.name || registrationPayload.name,
            };
            setRegistration(registrationWithQR);
            // Clear photo after successful registration
            setPhoto(null);
            setPhotoPreview(null);
            toast.success('Registration successful!');
          } catch (err) {
            console.error('Payment confirmation error:', err);
            toast.error(err.response?.data?.message || 'Payment confirmation failed');
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

    } catch (err) {
      console.error('EventRegistrationPage - Registration error:', err);
      console.error('EventRegistrationPage - Error response:', err.response);
      console.error('EventRegistrationPage - Error response data:', err.response?.data);
      console.error('EventRegistrationPage - Error response status:', err.response?.status);
      
      let errorMsg = 'Registration failed';
      
      // Handle backend validation errors
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        const errorMessages = err.response.data.errors.map(e => {
          // Handle different error formats
          if (typeof e === 'string') return e;
          return e.msg || e.message || JSON.stringify(e);
        }).join(', ');
        errorMsg = errorMessages;
        console.error('EventRegistrationPage - Backend validation errors:', errorMessages);
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
        console.error('EventRegistrationPage - Backend error message:', errorMsg);
      } else if (err.message) {
        errorMsg = err.message;
        console.error('EventRegistrationPage - Error message:', errorMsg);
      }
      
      setError(errorMsg);
      toast.error(errorMsg);
      setRegistering(false);
    }
  };

  const handlePhoneCheck = (e) => {
    const phone = e.target.value.replace(/\D/g, ''); // Remove non-digits
    // Update the form value with cleaned phone number
    setValue('phone', phone, { shouldValidate: true, shouldDirty: true });
    
    // Check registration status when phone is 10 digits
    if (phone.length === 10) {
      checkRegistrationStatus(phone);
    } else {
      // Clear registration if phone is not 10 digits
      setRegistration(null);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    
    if (!file) {
      setPhoto(null);
      setPhotoPreview(null);
      return;
    }
    
    // Allow larger files (up to 30MB) - they will be optimized before upload
    const maxSizeBeforeOptimization = 30 * 1024 * 1024; // 30MB
    if (file.size > maxSizeBeforeOptimization) {
      toast.error('Image is too large. Please choose an image smaller than 30MB.');
      e.target.value = ''; // Clear the input
      return;
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload an image (JPG, PNG, GIF, or WEBP).');
      e.target.value = ''; // Clear the input
      return;
    }
    
    setPhoto(file);
    setPhotoError('');
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    setPhotoError('Profile photo is required');
    // Clear the file input
    const fileInput = document.getElementById('photo');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const downloadQRCode = () => {
    if (!registration || !resolvedEventId) return;
    
    // Try multiple possible QR code field names
    const qrUrl = registration.qrDataURL || registration.qrCode || registration.qrCodeUrl || registration.qrCodeDataURL;
    
    if (qrUrl) {
      const link = document.createElement('a');
      link.href = qrUrl;
      link.download = `event-${resolvedEventId}-qr-code.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (registration.qrToken || registration.id) {
      // Generate QR code from token/ID if no image URL is provided
      const qrData = registration.qrToken || registration.id;
      const link = document.createElement('a');
      link.href = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(qrData)}`;
      link.download = `event-${resolvedEventId}-qr-code.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const imgUrl = useMemo(() => {
    if (!event) return null;
    return uploadApi.getImageUrl({ image: event.image, imageURL: event.imageURL });
  }, [event]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  const registrationFee = parseFloat(event.registrationFee ?? event.fee) || 0;
  const isFree = registrationFee === 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <MandapamLogo size="medium" showText={false} />
            <button
              onClick={() => navigate('/')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Event Details */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
          {imgUrl && (
            <div className="h-64 md:h-96 bg-gray-200 relative overflow-hidden">
              <img
                src={imgUrl}
                alt={event.title || event.name}
                className="h-full w-full object-cover"
                crossOrigin="anonymous"
                onError={(e) => {
                  e.target.style.display = 'none';
                  if (e.target.nextSibling) {
                    e.target.nextSibling.style.display = 'flex';
                  }
                }}
              />
              <div className="h-full w-full flex items-center justify-center bg-gray-100" style={{display: 'none'}}>
                <Calendar className="h-16 w-16 text-gray-400" />
              </div>
            </div>
          )}

          <div className="p-6 md:p-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {event.title || event.name}
            </h1>
            
            {event.description && (
              <p className="text-gray-700 text-lg mb-6 leading-relaxed">
                {event.description}
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-start">
                <Calendar className="h-5 w-5 mr-3 text-primary-600 mt-1" />
                <div>
                  <div className="font-medium text-gray-900">Date & Time</div>
                  <div className="text-gray-600">
                    {formatDateTime(event.startDateTime || event.startDate)}
                  </div>
                  {event.endDateTime || event.endDate ? (
                    <div className="text-gray-600 mt-1">
                      to {formatDateTime(event.endDateTime || event.endDate)}
                    </div>
                  ) : null}
                </div>
              </div>

              {event.address && (
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 mr-3 text-primary-600 mt-1" />
                  <div>
                    <div className="font-medium text-gray-900">Location</div>
                    <div className="text-gray-600">
                      {event.address}
                      {event.city && `, ${event.city}`}
                      {event.district && `, ${event.district}`}
                      {event.state && `, ${event.state}`}
                      {event.pincode && ` ${event.pincode}`}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center">
                <IndianRupee className="h-5 w-5 mr-3 text-primary-600" />
                <div>
                  <div className="font-medium text-gray-900">Registration Fee</div>
                  <div className="text-gray-600">
                    {isFree ? 'Free' : `₹ ${registrationFee.toFixed(2)}`}
                  </div>
                </div>
              </div>

              {event.currentAttendees !== undefined && event.maxAttendees && (
                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-3 text-primary-600" />
                  <div>
                    <div className="font-medium text-gray-900">Attendees</div>
                    <div className="text-gray-600">
                      {event.currentAttendees} / {event.maxAttendees}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

                 {/* Registration Section */}
         {registration ? (
         // Already Registered
         <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
           <div className="flex flex-col items-center text-center mb-6">
             <MandapamLogo className="h-16 w-auto mb-4" />
             <span className="inline-block px-4 py-1 bg-primary-50 text-primary-700 font-semibold uppercase tracking-wide rounded-full mb-4">
               Visitor Pass
             </span>
             <div className="flex items-start">
               <CheckCircle className="h-8 w-8 text-green-500 mr-4 mt-1" />
               <div className="text-left">
                 <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Confirmed!</h2>
                 <p className="text-gray-600">
                   You are successfully registered for this event. Please save your QR code for event entry.
                 </p>
                 {registrationDisplayName && (
                   <p className="mt-3 text-lg font-semibold text-gray-900">
                     {registrationDisplayName}
                   </p>
                 )}
               </div>
             </div>
           </div>

            <div className="border-t border-gray-200 pt-6">
              {/* Display uploaded photo if available */}
              {registration.member?.profileImageURL && (
                <div className="mb-6 text-center">
                  <div className="text-sm text-gray-500 mb-2">Profile Photo</div>
                  <div className="inline-block">
                    <img 
                      src={registration.member.profileImageURL} 
                      alt="Profile" 
                      className="w-32 h-32 rounded-full object-cover border-4 border-primary-200 shadow-lg"
                    />
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Registration ID</div>
                  <div className="font-semibold text-gray-900">#{registration.id}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Payment Status</div>
                  <div className="font-semibold text-green-600 capitalize">
                    {registration.paymentStatus || 'Paid'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Amount Paid</div>
                  <div className="font-semibold text-gray-900">
                    ₹ {parseFloat(registration.amountPaid) || 0}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Registered On</div>
                  <div className="font-semibold text-gray-900">
                    {registration.registeredAt 
                      ? formatDateTime(registration.registeredAt) 
                      : '-'}
                  </div>
                </div>
              </div>

              {/* QR Code Section - Check multiple possible field names */}
              {(registration.qrDataURL || registration.qrCode || registration.qrCodeUrl || registration.qrCodeDataURL || registration.qrToken) && (
                <div className="border-t border-gray-200 pt-6">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900 mb-4">
                      Your Event QR Code
                    </div>
                    <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
                      <img 
                        src={registration.qrDataURL || registration.qrCode || registration.qrCodeUrl || registration.qrCodeDataURL || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(registration.qrToken || registration.id || '')}`} 
                        alt="Event QR Code" 
                        className="w-48 h-48"
                        onError={(e) => {
                          console.error('QR code image failed to load');
                          // If image fails, try generating QR code from token/ID
                          if (registration.qrToken || registration.id) {
                            const qrData = registration.qrToken || registration.id;
                            e.target.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;
                          }
                        }}
                      />
                    </div>
                    <button
                      onClick={() => {
                        const qrUrl = registration.qrDataURL || registration.qrCode || registration.qrCodeUrl || registration.qrCodeDataURL;
                        if (qrUrl) {
                          downloadQRCode();
                        } else if (registration.qrToken || registration.id) {
                          // Generate QR code URL for download
                          const qrData = registration.qrToken || registration.id;
                          const link = document.createElement('a');
                          link.href = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(qrData)}`;
                          link.download = `event-${resolvedEventId}-qr-code.png`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }
                      }}
                      className="mt-4 flex items-center justify-center mx-auto px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download QR Code
                    </button>
                  </div>
                </div>
              )}
              
              {/* Debug info - remove in production */}
              {process.env.NODE_ENV === 'development' && (
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <details className="text-xs text-gray-500">
                    <summary className="cursor-pointer">Debug: Registration Data</summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-40">
                      {JSON.stringify(registration, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
             </div>
           </div>
         ) : (
           // Registration Form
           <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
             <h2 className="text-2xl font-bold text-gray-900 mb-6">Register for this Event</h2>
             
             {checkingStatus && (
               <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                 <div className="flex items-center">
                   <Loader2 className="h-5 w-5 text-blue-500 mr-2 animate-spin" />
                   <p className="text-blue-700">Checking if you're already registered...</p>
                 </div>
               </div>
             )}
             
             {error && (
               <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                 <div className="flex items-center">
                   <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                   <p className="text-red-700">{error}</p>
                 </div>
               </div>
             )}

            <form onSubmit={handleSubmit(onSubmitRegistration, (errors) => {
              console.log('Form validation errors:', errors);
              // Trigger validation for all fields to show errors
              trigger();
            })} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="h-4 w-4 inline mr-1" />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    {...register('name', { 
                      required: 'Name is required',
                      minLength: { value: 2, message: 'Name must be at least 2 characters' },
                      maxLength: { value: 100, message: 'Name must be less than 100 characters' },
                      validate: (value) => {
                        const trimmed = value?.trim();
                        if (!trimmed || trimmed.length < 2) return 'Name is required and must be at least 2 characters';
                        return true;
                      }
                    })}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter your full name"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                  )}
                </div>

                                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                     <Phone className="h-4 w-4 inline mr-1" />
                     Phone Number *
                   </label>
                  <input
                    type="tel"
                    {...register('phone', { 
                      required: 'Phone number is required',
                      pattern: {
                        value: /^[0-9]{10}$/,
                        message: 'Phone must be exactly 10 digits'
                      },
                      validate: (value) => {
                        const cleaned = value?.replace(/\D/g, '');
                        if (!cleaned || cleaned.length !== 10) return 'Phone must be exactly 10 digits';
                        return true;
                      },
                      onChange: handlePhoneCheck
                    })}
                    maxLength={10}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="9876543210"
                    onBlur={handlePhoneCheck}
                  />
                   {errors.phone && (
                     <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                   )}
                   {checkingStatus && (
                     <p className="text-blue-600 text-sm mt-1">Checking registration status...</p>
                   )}
                 </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="h-4 w-4 inline mr-1" />
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    {...register('email', { 
                      validate: (value) => {
                        const trimmed = value?.trim();
                        if (!trimmed) return true;
                        if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(trimmed)) return 'Invalid email address';
                        return true;
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Building2 className="h-4 w-4 inline mr-1" />
                    Business Name *
                  </label>
                  <input
                    type="text"
                    {...register('businessName', { 
                      required: 'Business name is required',
                      minLength: { value: 2, message: 'Business name must be at least 2 characters' },
                      maxLength: { value: 200, message: 'Business name must be less than 200 characters' },
                      validate: (value) => {
                        const trimmed = value?.trim();
                        if (!trimmed || trimmed.length < 2) return 'Business name is required and must be at least 2 characters';
                        return true;
                      }
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Type *
                  </label>
                  <select
                    {...register('businessType', { 
                      required: 'Business type is required',
                      validate: (value) => {
                        if (!value || value.trim() === '') return 'Business type is required';
                        return true;
                      }
                    })}
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPinIcon className="h-4 w-4 inline mr-1" />
                    City (Optional)
                  </label>
                  <input
                    type="text"
                    {...register('city', { 
                      validate: (value) => {
                        const trimmed = value?.trim();
                        if (!trimmed) return true;
                        if (trimmed.length < 2) return 'City must be at least 2 characters';
                        return true;
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
                      {...register('associationId', { 
                        validate: (value) => {
                          if (!value || value.trim() === '') return true;
                          if (value === '0') return 'Please select a valid association';
                          return true;
                        }
                      })}
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
                  {errors.associationId && (
                    <p className="text-red-500 text-sm mt-1">{errors.associationId.message}</p>
                  )}
                </div>

                {/* Photo Upload Field - Camera Capture Only */}
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
                            htmlFor="photo"
                            className="cursor-pointer flex flex-col items-center space-y-2 text-gray-600 hover:text-primary-600 focus-within:outline-none"
                          >
                            <Camera className="h-10 w-10" />
                            <span className="bg-white rounded-md font-medium">
                              Capture Photo from Camera
                            </span>
                          </label>
                          <input
                            id="photo"
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            capture="user"
                            onChange={handlePhotoChange}
                          />
                          <p className="text-xs text-gray-500">Max 30MB - JPG, PNG, GIF, WEBP (will be automatically optimized)</p>
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
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
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
                                 <button
                   type="submit"
                   disabled={registering || checkingStatus || registration}
                   className={`inline-flex items-center px-6 py-3 text-lg font-semibold rounded-lg transition-all ${
                     registering || checkingStatus || registration
                       ? 'bg-primary-400 text-white cursor-not-allowed'
                       : 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg hover:shadow-xl'
                   }`}
                 >
                  {registering ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : isFree ? (
                    'Register Now (Free)'
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5 mr-2" />
                      Register & Pay ₹{registrationFee.toFixed(2)}
                    </>
                  )}
                </button>
                             </div>
             </form>
           </div>
         )}
      </div>
    </div>
  );
};

export default EventRegistrationPage;
