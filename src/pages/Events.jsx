
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { Plus, Edit, Trash2, Eye, Upload, X, CheckCircle, Calendar, MapPin, Users, Loader2 } from 'lucide-react';
import { eventApi } from '../services/eventApi';
import { uploadApi } from '../services/uploadApi';
import toast from 'react-hot-toast';

const Events = () => {
  const [selected, setSelected] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showView, setShowView] = useState(false);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm();

  // Fetch events from API on component mount
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching events...');
      const response = await eventApi.getEvents();
      console.log('Events API response:', response);
      console.log('Events data:', response.events);
      setEvents(response.events || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      console.error('Error details:', error.response?.data);
      setError('Failed to fetch events. Please try again.');
      toast.error('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const eventTypes = [
    'Meeting', 'Workshop', 'Seminar', 'Conference', 'Celebration', 
    'Training', 'Announcement', 'Other'
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
      // Use base64 for immediate preview (works without CORS issues)
      uploadApi.convertToBase64(file).then(base64 => {
        setPreview(base64);
      }).catch(error => {
        console.error('Error converting image to base64:', error);
        setPreview(URL.createObjectURL(file));
      });
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

  const handleEdit = (event) => {
    setSelected(event);
    setValue('title', event.title);
    setValue('description', event.description);
    setValue('type', event.type);
    setValue('startDate', event.startDate ? new Date(event.startDate).toISOString().split('T')[0] : '');
    setValue('startTime', event.startTime);
    setValue('endTime', event.endTime);
    setValue('address', event.address || '');
    setValue('city', event.city || '');
    setValue('district', event.district || '');
    setValue('state', event.state || '');
    setValue('pincode', event.pincode || '');
    setValue('priority', event.priority || 'Medium');
    setValue('maxAttendees', event.maxAttendees || 100);
    
    // Set existing image preview if available
    if (event.image || event.imageURL) {
      setPreview(uploadApi.getImageUrl(event.image || event.imageURL));
    } else {
      setPreview(null);
    }
    setImage(null); // Reset new image selection
    
    setShowEdit(true);
  };

  const handleView = (event) => {
    setSelected(event);
    setShowView(true);
  };

  const handleDelete = (event) => {
    setSelected(event);
    setShowDelete(true);
  };

  const onSubmitAdd = async (data) => {
    try {
      setUploading(true);
      console.log('Form data received:', data);
      
      // Upload image first if provided
      let imageFilename = null;
      if (image) {
        console.log('Uploading image for new event...');
        const uploadResponse = await uploadApi.uploadImage(image);
        imageFilename = uploadResponse.filename;
        console.log('Image uploaded successfully:', imageFilename);
      }
      
      // Transform form data to match backend schema
      const eventData = {
        title: data.title,
        description: data.description,
        type: data.type,
        startDate: data.startDate,
        startTime: data.startTime,
        endTime: data.endTime,
        address: data.address || '',
        city: data.city,
        district: data.district,
        state: data.state,
        pincode: data.pincode,
        organizer: data.organizer || 'Mandapam Association',
        contactPerson: {
          name: data.contactPersonName || 'Admin',
          phone: data.contactPersonPhone || '9876543210',
          email: data.contactPersonEmail || 'admin@mandapam.com'
        },
        priority: data.priority || 'Medium',
        targetAudience: data.targetAudience || [],
        maxAttendees: data.maxAttendees || 100,
        registrationRequired: data.registrationRequired || false,
        image: imageFilename
      };

      console.log('Event data being sent:', eventData);

      // Create event via API
      const response = await eventApi.createEvent(eventData);
      
      // Add new event to the list
      setEvents(prevEvents => [...prevEvents, response.event]);
      
      // Close modal and show success message
      setShowAdd(false);
      reset();
      removeImage();
      toast.success('Event created successfully!');
    } catch (error) {
      console.error('Error creating event:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      const errorMessage = error.response?.data?.message || 'Failed to create event';
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const onSubmitEdit = async (data) => {
    try {
      setUploading(true);
      
      // Upload new image if provided
      let imageFilename = selected.image || selected.imageURL;
      if (image) {
        console.log('Uploading new image for event update...');
        const uploadResponse = await uploadApi.uploadImage(image);
        imageFilename = uploadResponse.filename;
        console.log('New image uploaded successfully:', imageFilename);
      }
      
      // Transform form data to match backend schema
      const eventData = {
        title: data.title,
        description: data.description,
        type: data.type,
        startDate: data.startDate,
        startTime: data.startTime,
        endTime: data.endTime,
        address: data.address || '',
        city: data.city,
        district: data.district,
        state: data.state,
        pincode: data.pincode,
        organizer: data.organizer || 'Mandapam Association',
        contactPerson: {
          name: data.contactPersonName || 'Admin',
          phone: data.contactPersonPhone || '9876543210',
          email: data.contactPersonEmail || 'admin@mandapam.com'
        },
        priority: data.priority || 'Medium',
        targetAudience: data.targetAudience || [],
        maxAttendees: data.maxAttendees || 100,
        registrationRequired: data.registrationRequired || false,
        image: imageFilename
      };

      // Update event via API
      const response = await eventApi.updateEvent(selected.id, eventData);
      
      // Update event in the list
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event.id === selected.id ? response.event : event
        )
      );
      
      toast.success('Event updated successfully!');
      setShowEdit(false);
      setSelected(null);
      removeImage();
    } catch (error) {
      console.error('Error updating event:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update event';
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const confirmDelete = async () => {
    try {
      // Delete event via API
      await eventApi.deleteEvent(selected.id);
      
      // Remove event from the list
      setEvents(prevEvents => 
        prevEvents.filter(event => event.id !== selected.id)
      );
      
      toast.success(`Event "${selected.title}" deleted successfully`);
      setShowDelete(false);
      setSelected(null);
    } catch (error) {
      console.error('Error deleting event:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete event';
      toast.error(errorMessage);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Upcoming': return 'bg-blue-100 text-blue-800';
      case 'Ongoing': return 'bg-yellow-100 text-yellow-800';
      case 'Completed': return 'bg-gray-100 text-gray-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      case 'Postponed': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date not specified';
    
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Function to refresh events from API
  const refreshEvents = () => {
    fetchEvents();
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Events & Announcements</h1>
            <p className="text-gray-600 mt-2">Manage association events and announcements</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={refreshEvents}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </button>
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Create Event</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading events...</p>
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Events</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={refreshEvents}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Events Grid */}
        {!loading && !error && events.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map(event => (
              <div key={event.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-48 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                  {(event.image || event.imageURL) ? (
                    <img src={uploadApi.getImageUrl(event.image || event.imageURL)} alt={event.title} className="h-full w-full object-cover" />
                  ) : (
                    <Calendar className="h-16 w-16 text-primary-600" />
                  )}
                </div>
                
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{event.title}</h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(event.status)}`}>
                      {event.status}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{event.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>{formatDate(event.startDate)} {event.startTime ? `at ${event.startTime}` : ''}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{event.location || event.address ? `${event.address || ''}${event.address && event.city ? ', ' : ''}${event.city || ''}` : 'Location not specified'}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Users className="h-4 w-4 mr-2" />
                      <span>{event.currentAttendees || 0} attendees</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Created by {event.createdBy?.name || 'Admin'}</span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleView(event)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(event)}
                        className="text-yellow-600 hover:text-yellow-900 p-1"
                        title="Edit Event"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(event)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="Delete Event"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && events.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Events Found</h3>
            <p className="text-gray-600 mb-4">There are no events created yet. Create your first event to get started.</p>
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2 mx-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Create First Event</span>
            </button>
          </div>
        )}
      </div>

      {/* Add Event Modal */}
      <Modal title="Create New Event" isOpen={showAdd} onClose={() => setShowAdd(false)}>
        <form onSubmit={handleSubmit(onSubmitAdd)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Event Title *</label>
            <input
              type="text"
              {...register('title', { required: 'Event title is required' })}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter event title"
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Event Type *</label>
            <select
              {...register('type', { required: 'Event type is required' })}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.type ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select event type</option>
              {eventTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            {errors.type && (
              <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
            <textarea
              {...register('description', { required: 'Event description is required' })}
              rows={3}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter event description"
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Event Date *</label>
              <input
                type="date"
                {...register('startDate', { required: 'Event date is required' })}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.startDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.startDate && (
                <p className="text-red-500 text-sm mt-1">{errors.startDate.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Time *</label>
              <input
                type="time"
                {...register('startTime', { required: 'Start time is required' })}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.startTime ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.startTime && (
                <p className="text-red-500 text-sm mt-1">{errors.startTime.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Time *</label>
              <input
                type="time"
                {...register('endTime', { required: 'End time is required' })}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.endTime ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.endTime && (
                <p className="text-red-500 text-sm mt-1">{errors.endTime.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Street Address *</label>
            <input
              type="text"
              {...register('address', { required: 'Street address is required' })}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.address ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter street address"
            />
            {errors.address && (
              <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
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

          <div className="grid grid-cols-2 gap-4">
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                {...register('priority')}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Attendees</label>
              <input
                type="number"
                {...register('maxAttendees')}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter max attendees"
                min="1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Event Image</label>
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
              disabled={uploading}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create Event</span>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Event Modal */}
      <Modal title="Edit Event" isOpen={showEdit} onClose={() => setShowEdit(false)}>
        <form onSubmit={handleSubmit(onSubmitEdit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Event Title *</label>
            <input
              type="text"
              {...register('title', { required: 'Event title is required' })}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter event title"
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Event Type *</label>
            <select
              {...register('type', { required: 'Event type is required' })}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.type ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select event type</option>
              {eventTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            {errors.type && (
              <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
            <textarea
              {...register('description', { required: 'Event description is required' })}
              rows={3}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter event description"
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Event Date *</label>
              <input
                type="date"
                {...register('startDate', { required: 'Event date is required' })}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.startDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.startDate && (
                <p className="text-red-500 text-sm mt-1">{errors.startDate.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Time *</label>
              <input
                type="time"
                {...register('startTime', { required: 'Start time is required' })}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.startTime ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.startTime && (
                <p className="text-red-500 text-sm mt-1">{errors.startTime.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Time *</label>
              <input
                type="time"
                {...register('endTime', { required: 'End time is required' })}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.endTime ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.endTime && (
                <p className="text-red-500 text-sm mt-1">{errors.endTime.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Street Address *</label>
            <input
              type="text"
              {...register('address', { required: 'Street address is required' })}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.address ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter street address"
            />
            {errors.address && (
              <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
              <select
                {...register('state', { required: 'State is required' })}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.state ? 'border-red-500' : 'border-gray-300'
                }`}
              >
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
                {districts.map(district => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
              {errors.district && (
                <p className="text-red-500 text-sm mt-1">{errors.district.message}</p>
              )}
            </div>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                {...register('priority')}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Attendees</label>
              <input
                type="number"
                {...register('maxAttendees')}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter max attendees"
                min="1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Event Image</label>
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
              disabled={uploading}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <span>Update Event</span>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Event Modal */}
      <Modal title="Event Details" isOpen={showView} onClose={() => setShowView(false)}>
        {selected && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="h-32 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center mb-4">
                {(selected.image || selected.imageURL) ? (
                  <img src={uploadApi.getImageUrl(selected.image || selected.imageURL)} alt={selected.title} className="h-full w-full object-cover rounded-lg" />
                ) : (
                  <Calendar className="h-16 w-16 text-primary-600" />
                )}
              </div>
              <h3 className="text-xl font-semibold text-gray-900">{selected.title}</h3>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selected.status)}`}>
                {selected.status}
              </span>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <p className="text-sm text-gray-900">{selected.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Event Type</label>
                  <p className="text-sm text-gray-900">{selected.type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date & Time</label>
                  <p className="text-sm text-gray-900">{formatDate(selected.startDate)} {selected.startTime ? `at ${selected.startTime}` : ''} {selected.endTime ? `- ${selected.endTime}` : ''}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  <p className="text-sm text-gray-900">{selected.location || selected.address ? `${selected.address || ''}${selected.address && selected.city ? ', ' : ''}${selected.city || ''}` : 'Location not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">District</label>
                  <p className="text-sm text-gray-900">{selected.district || 'Not specified'}, {selected.state || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Priority</label>
                  <p className="text-sm text-gray-900">{selected.priority || 'Normal'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Attendees</label>
                  <p className="text-sm text-gray-900">{selected.currentAttendees || 0} registered</p>
                </div>
              </div>
              
              <div className="pt-3 border-t border-gray-200">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Created by {selected.createdBy?.name || 'Admin'}</span>
                  <span>Created on {new Date(selected.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal title="Confirm Delete" isOpen={showDelete} onClose={() => setShowDelete(false)}>
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete <strong>"{selected?.title}"</strong>? This action cannot be undone.
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
              Delete Event
            </button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default Events;
