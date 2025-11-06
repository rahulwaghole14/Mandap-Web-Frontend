import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { uploadApi } from '../services/uploadApi';
import { eventApi } from '../services/eventApi';
import { DISTRICTS } from '../constants';
import toast from 'react-hot-toast';
import { Loader2, Upload, X } from 'lucide-react';

const EventForm = () => {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const isEdit = useMemo(() => !!eventId, [eventId]);

  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loadingEvent, setLoadingEvent] = useState(isEdit);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    mode: 'onSubmit', // Validate on submit (default)
    reValidateMode: 'onChange' // After first submit, validate on change
  });

  useEffect(() => {
    if (isEdit) {
      (async () => {
        try {
          setLoadingEvent(true);
          const data = await eventApi.getEvent(eventId);
          const e = data.event || data; // support both shapes
          console.log('EventForm - Loaded event data:', e);
          console.log('EventForm - Event image field:', e.image);
          console.log('EventForm - Event imageURL field:', e.imageURL);
          
          setValue('name', e.name || e.title || '');
          setValue('description', e.description || '');
          
          // Parse datetime properly from backend response
          // Backend returns ISO strings like "2025-01-06T05:00:00.000Z"
          // Convert to datetime-local format (YYYY-MM-DDTHH:MM)
          const formatDateTimeForInput = (dateTimeStr) => {
            if (!dateTimeStr) return '';
            try {
              const date = new Date(dateTimeStr);
              // Convert to local time and format as YYYY-MM-DDTHH:MM
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              const hours = String(date.getHours()).padStart(2, '0');
              const minutes = String(date.getMinutes()).padStart(2, '0');
              return `${year}-${month}-${day}T${hours}:${minutes}`;
            } catch (err) {
              console.error('Error parsing datetime:', err);
              return '';
            }
          };
          
          setValue('startDateTime', formatDateTimeForInput(e.startDateTime || e.startDate));
          setValue('endDateTime', formatDateTimeForInput(e.endDateTime || e.endDate));
          setValue('address', e.address || '');
          setValue('city', e.city || '');
          setValue('state', e.state || '');
          setValue('district', e.district || '');
          setValue('pincode', e.pincode || '');
          // Use registrationFee if available, fallback to fee
          setValue('fee', e.registrationFee ?? e.fee ?? '');
          if (e.image || e.imageURL) {
            const imageUrl = uploadApi.getImageUrl({ image: e.image, imageURL: e.imageURL });
            console.log('EventForm - Setting image preview URL:', imageUrl);
            setImagePreview(imageUrl);
          }
        } catch (err) {
          console.error(err);
          toast.error('Failed to load event');
        } finally {
          setLoadingEvent(false);
        }
      })();
    }
  }, [isEdit, eventId, setValue]);

  const onChangeImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be < 5MB');
      return;
    }
    setImageFile(file);
    try {
      const b64 = await uploadApi.convertToBase64(file);
      setImagePreview(b64);
    } catch {
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const onSubmit = async (values) => {
    try {
      console.log('EventForm - Form submitted with values:', values);
      
      // Additional validation: Check if end date is after start date
      if (values.startDateTime && values.endDateTime) {
        const startDate = new Date(values.startDateTime);
        const endDate = new Date(values.endDateTime);
        if (endDate <= startDate) {
          toast.error('End date/time must be after start date/time');
          return;
        }
      }

      setUploading(true);
      
      // For both create and edit: Upload image to Cloudinary first if a new image is selected
      let imageFilename = null;
      if (imageFile) {
        console.log('EventForm - Uploading image to Cloudinary for', isEdit ? 'edit' : 'create');
        const up = await uploadApi.uploadImage(imageFile);
        console.log('EventForm - Upload response:', up);
        // Send full Cloudinary URL to backend
        imageFilename = up.url || up.image || up.filename || null;
        console.log('EventForm - Extracted imageFilename (full URL):', imageFilename);
        console.log('EventForm - Cloudinary secure_url:', up.url);
        console.log('EventForm - Cloudinary public_id:', up.public_id);
      }

      // Normalize payload for backend - same structure for both create and edit
      const payload = {
        title: values.name?.trim(), // Backend expects 'title' field
        description: values.description?.trim(),
        startDateTime: values.startDateTime,
        endDateTime: values.endDateTime,
        address: values.address?.trim(),
        city: values.city?.trim(),
        state: values.state?.trim(),
        district: values.district?.trim(),
        pincode: values.pincode?.trim(),
        registrationFee: values.fee ? Number(values.fee) : 0,
      };
      
      // Add image only if we have a filename (either from Cloudinary upload or existing)
      if (imageFilename) {
        payload.image = imageFilename;
        console.log('EventForm - Payload with image:', payload);
      }

      console.log('EventForm - Final payload:', payload);

      if (isEdit) {
        console.log('EventForm - Edit event: Sending JSON payload');
        console.log('EventForm - Event ID:', eventId);
        const updateResponse = await eventApi.updateEvent(eventId, payload);
        console.log('EventForm - Update response:', updateResponse);
        toast.success('Event updated successfully');
        navigate(`/events/${eventId}`);
      } else {
        console.log('EventForm - Create event: Sending JSON payload');
        const res = await eventApi.createEvent(payload);
        console.log('EventForm - Create response:', res);
        const newId = res.event?.id || res.id;
        toast.success('Event created successfully');
        if (newId) {
          navigate(`/events/${newId}`);
        } else {
          navigate('/events');
        }
      }
    } catch (err) {
      console.error('EventForm - Error:', err);
      console.error('EventForm - Error response:', err.response);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to save event';
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Event' : 'Add Event'}</h1>
            <p className="text-gray-600">Fill in the event details below</p>
          </div>
        </div>

        {loadingEvent ? (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary-600 mx-auto" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 rounded-lg shadow space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
              <input
                type="text"
                {...register('name', { 
                  required: 'Name is required',
                  validate: (value) => {
                    if (!value || !value.trim()) return 'Name is required';
                    if (value.trim().length < 3) return 'Name must be at least 3 characters';
                    return true;
                  }
                })}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Event name"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
              <textarea
                rows={4}
                {...register('description', { 
                  required: 'Description is required',
                  validate: (value) => {
                    if (!value || !value.trim()) return 'Description is required';
                    if (value.trim().length < 10) return 'Description must be at least 10 characters';
                    return true;
                  }
                })}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Describe the event"
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start date/time *</label>
                <input
                  type="datetime-local"
                  {...register('startDateTime', { 
                    required: 'Start date/time is required',
                    validate: (value) => {
                      if (!value) return 'Start date/time is required';
                      const date = new Date(value);
                      if (isNaN(date.getTime())) return 'Invalid date/time';
                      return true;
                    }
                  })}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.startDateTime ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.startDateTime && <p className="text-red-500 text-sm mt-1">{errors.startDateTime.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End date/time *</label>
                <input
                  type="datetime-local"
                  {...register('endDateTime', { 
                    required: 'End date/time is required',
                    validate: (value) => {
                      if (!value) return 'End date/time is required';
                      const date = new Date(value);
                      if (isNaN(date.getTime())) return 'Invalid date/time';
                      return true;
                    }
                  })}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.endDateTime ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.endDateTime && <p className="text-red-500 text-sm mt-1">{errors.endDateTime.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
              <input
                type="text"
                {...register('address', { 
                  required: 'Address is required',
                  validate: (value) => {
                    if (!value || !value.trim()) return 'Address is required';
                    if (value.trim().length < 5) return 'Address must be at least 5 characters';
                    return true;
                  }
                })}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Street address"
              />
              {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                <input
                  type="text"
                  {...register('city', { 
                    required: 'City is required',
                    validate: (value) => {
                      if (!value || !value.trim()) return 'City is required';
                      if (value.trim().length < 2) return 'City must be at least 2 characters';
                      return true;
                    }
                  })}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.city ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="City"
                />
                {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
                <input
                  type="text"
                  {...register('state', { 
                    required: 'State is required',
                    validate: (value) => {
                      if (!value || !value.trim()) return 'State is required';
                      if (value.trim().length < 2) return 'State must be at least 2 characters';
                      return true;
                    }
                  })}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.state ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="State"
                />
                {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">District *</label>
                <select
                  {...register('district', { required: 'District is required' })}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.district ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Select district</option>
                  {DISTRICTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                {errors.district && <p className="text-red-500 text-sm mt-1">{errors.district.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pincode *</label>
                <input
                  type="text"
                  {...register('pincode', { 
                    required: 'Pincode is required', 
                    pattern: { 
                      value: /^[0-9]{6}$/, 
                      message: 'Pincode must be exactly 6 digits' 
                    },
                    validate: (value) => {
                      if (!value) return 'Pincode is required';
                      if (!/^[0-9]{6}$/.test(value.trim())) return 'Pincode must be exactly 6 digits';
                      return true;
                    }
                  })}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.pincode ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="6-digit pincode"
                  maxLength={6}
                />
                {errors.pincode && <p className="text-red-500 text-sm mt-1">{errors.pincode.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fee (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('fee')}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-gray-300"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                <div className="space-y-1 text-center">
                  {!imagePreview ? (
                    <>
                      <Upload className="mx-auto h-10 w-10 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500">
                          <span>Upload a file</span>
                          <input type="file" className="sr-only" accept="image/*" onChange={onChangeImage} />
                        </label>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                    </>
                  ) : (
                    <div className="relative inline-block">
                      <img src={imagePreview} alt="Preview" className="h-24 w-24 object-cover rounded" />
                      <button type="button" onClick={removeImage} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={uploading} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2">
                {uploading && <Loader2 className="h-4 w-4 animate-spin" />}<span>{isEdit ? 'Save Changes' : 'Create Event'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </Layout>
  );
};

export default EventForm;


