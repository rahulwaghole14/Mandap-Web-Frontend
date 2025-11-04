import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventApi } from '../services/eventApi';
import { uploadApi } from '../services/uploadApi';
import { useAuth } from '../contexts/AuthContext';
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
  Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import MandapamLogo from '../components/MandapamLogo';

const EventRegistrationPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [registration, setRegistration] = useState(null);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState(null);
  
  // Normalize slug to lowercase for case-insensitive matching
  const normalizedSlug = slug?.toLowerCase();
  
  // Map slug to event ID from constants (case-insensitive)
  const eventId = EVENT_SLUGS[normalizedSlug] || EVENT_SLUGS[slug] || slug; // Try normalized first, then original, then fallback to slug if it's a direct ID
  
  useEffect(() => {
    if (!eventId) {
      setError('Event not found. Please check the event ID.');
      setLoading(false);
      return;
    }
    loadEvent();
  }, [eventId]);

  useEffect(() => {
    if (event && token) {
      checkRegistrationStatus();
    }
  }, [event, token]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await eventApi.getEventPublic(eventId);
      setEvent(data.event || data);
    } catch (err) {
      console.error('Error loading event:', err);
      setError(err.response?.data?.message || 'Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const checkRegistrationStatus = async () => {
    if (!token) return; // Skip if not authenticated
    
    try {
      setCheckingStatus(true);
      const data = await eventApi.checkRegistrationStatus(eventId);
      if (data.isRegistered) {
        setRegistration(data.registration);
      }
    } catch (err) {
      console.error('Error checking registration status:', err);
      // Not an error if not registered yet
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

  const handleRegister = async () => {
    // Check if user is authenticated
    if (!token) {
      toast.error('Please login to register for this event');
      navigate('/login', { state: { returnTo: `/${slug}` } });
      return;
    }

    try {
      setRegistering(true);
      setError(null);

      // Step 1: Initiate payment
      const paymentData = await eventApi.initiatePayment(eventId);

      // Free event
      if (paymentData.isFree) {
        toast.error('This is a free event. Please use RSVP endpoint.');
        return;
      }

      // Step 2: Open Razorpay Checkout
      const options = {
        ...paymentData.paymentOptions,
        handler: async function (response) {
          try {
            // Step 3: Confirm payment
            const confirmData = await eventApi.confirmPayment(
              eventId,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }
            );

            // Update registration state
            setRegistration(confirmData.registration);
            toast.success('Registration successful!');
            
            // Reload registration status to get QR code
            await checkRegistrationStatus();
          } catch (err) {
            console.error('Payment confirmation error:', err);
            toast.error(err.response?.data?.message || 'Payment confirmation failed');
          }
        },
        modal: {
          ondismiss: function() {
            console.log('Payment cancelled');
            setRegistering(false);
          }
        }
      };

      // Check if Razorpay is available
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
      console.error('Registration error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Registration failed';
      setError(errorMsg);
      toast.error(errorMsg);
      setRegistering(false);
    }
  };

  const downloadQRCode = () => {
    if (!registration?.qrDataURL) return;
    
    const link = document.createElement('a');
    link.href = registration.qrDataURL;
    link.download = `event-${eventId}-qr-code.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const imgUrl = useMemo(() => {
    if (!event) return null;
    return uploadApi.getImageUrl(event.image || event.imageURL);
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
          {/* Event Image */}
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
        {checkingStatus ? (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <Loader2 className="h-8 w-8 text-primary-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Checking registration status...</p>
          </div>
        ) : registration ? (
          // Already Registered
          <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
            <div className="flex items-start mb-6">
              <CheckCircle className="h-8 w-8 text-green-500 mr-4 mt-1" />
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Confirmed!</h2>
                <p className="text-gray-600">
                  You are successfully registered for this event. Please save your QR code for event entry.
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
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

              {/* QR Code */}
              {registration.qrDataURL && (
                <div className="border-t border-gray-200 pt-6">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900 mb-4">
                      Your Event QR Code
                    </div>
                    <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
                      <img 
                        src={registration.qrDataURL} 
                        alt="Event QR Code" 
                        className="w-48 h-48"
                      />
                    </div>
                    <button
                      onClick={downloadQRCode}
                      className="mt-4 flex items-center justify-center mx-auto px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download QR Code
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Not Registered - Show Register Button
          <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            )}

            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Register for this Event
              </h2>
              <p className="text-gray-600 mb-6">
                {!token && 'Please login to register for this event.'}
                {token && isFree && 'This event is free. Click below to register.'}
                {token && !isFree && `Complete your registration by paying ₹${registrationFee.toFixed(2)}`}
              </p>

              <button
                onClick={handleRegister}
                disabled={registering || !token}
                className={`inline-flex items-center px-8 py-3 text-lg font-semibold rounded-lg transition-all ${
                  !token
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : registering
                    ? 'bg-primary-400 text-white cursor-not-allowed'
                    : 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg hover:shadow-xl transform hover:scale-105'
                }`}
              >
                {registering ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : !token ? (
                  'Login to Register'
                ) : isFree ? (
                  'Register Now (Free)'
                ) : (
                  <>
                    <CreditCard className="h-5 w-5 mr-2" />
                    Register & Pay ₹{registrationFee.toFixed(2)}
                  </>
                )}
              </button>

              {!token && (
                <p className="mt-4 text-sm text-gray-500">
                  Don't have an account?{' '}
                  <button
                    onClick={() => navigate('/login', { state: { returnTo: `/${slug}` } })}
                    className="text-primary-600 hover:underline"
                  >
                    Login here
                  </button>
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventRegistrationPage;
