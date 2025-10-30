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

  const { register, handleSubmit, setValue, formState: { errors } } = useForm();

  useEffect(() => {
    if (isEdit) {
      (async () => {
        try {
          setLoadingEvent(true);
          const data = await eventApi.getEvent(eventId);
          const e = data.event || data; // support both shapes
          setValue('name', e.name || e.title || '');
          setValue('description', e.description || '');
          // Expecting ISO strings; fallback to empty
          setValue('startDateTime', e.startDateTime || (e.startDate && e.startTime ? `${e.startDate}T${(e.startTime || '00:00')}` : ''));
          setValue('endDateTime', e.endDateTime || (e.endDate && e.endTime ? `${e.endDate}T${(e.endTime || '00:00')}` : ''));
          setValue('address', e.address || '');
          setValue('city', e.city || '');
          setValue('state', e.state || '');
          setValue('district', e.district || '');
          setValue('pincode', e.pincode || '');
          setValue('fee', e.fee ?? '');
          if (e.image || e.imageURL) {
            setImagePreview(uploadApi.getImageUrl(e.image || e.imageURL));
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
      setUploading(true);
      let imageFilename = null;
      if (imageFile) {
        const up = await uploadApi.uploadImage(imageFile);
        imageFilename = up.file?.filename || up.filename || null;
      }

      // Normalize payload for backend
      const payload = {
        name: values.name,
        description: values.description,
        // prefer explicit datetime fields if backend expects them; also send split fields for compatibility
        startDateTime: values.startDateTime,
        endDateTime: values.endDateTime,
        startDate: values.startDateTime ? values.startDateTime.slice(0, 10) : undefined,
        endDate: values.endDateTime ? values.endDateTime.slice(0, 10) : undefined,
        address: values.address,
        city: values.city,
        state: values.state,
        district: values.district,
        pincode: values.pincode,
        fee: values.fee ? Number(values.fee) : 0,
        image: imageFilename ?? undefined,
      };

      if (isEdit) {
        await eventApi.updateEvent(eventId, payload);
        toast.success('Event updated');
        navigate(`/events/${eventId}`);
      } else {
        const res = await eventApi.createEvent(payload);
        const newId = res.event?.id || res.id;
        toast.success('Event created');
        if (newId) {
          navigate(`/events/${newId}`);
        } else {
          navigate('/events');
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save event');
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
                {...register('name', { required: 'Name is required' })}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Event name"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
              <textarea
                rows={4}
                {...register('description', { required: 'Description is required' })}
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
                  {...register('startDateTime', { required: 'Start date/time is required' })}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.startDateTime ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.startDateTime && <p className="text-red-500 text-sm mt-1">{errors.startDateTime.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End date/time *</label>
                <input
                  type="datetime-local"
                  {...register('endDateTime', { required: 'End date/time is required' })}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.endDateTime ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.endDateTime && <p className="text-red-500 text-sm mt-1">{errors.endDateTime.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
              <input
                type="text"
                {...register('address', { required: 'Address is required' })}
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
                  {...register('city', { required: 'City is required' })}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.city ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="City"
                />
                {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
                <input
                  type="text"
                  {...register('state', { required: 'State is required' })}
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
                  {...register('pincode', { required: 'Pincode is required', pattern: { value: /^[0-9]{6}$/, message: 'Enter 6-digit pincode' } })}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${errors.pincode ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="6-digit pincode"
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


