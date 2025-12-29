import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const AccountDeletion = () => {
  const [step, setStep] = useState(1); // 1: mobile input, 2: OTP verification, 3: confirmation, 4: cancelled
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [requestId, setRequestId] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [deletionInfo, setDeletionInfo] = useState(null);
  const [isExistingRequest, setIsExistingRequest] = useState(false);
  const [cancelledAt, setCancelledAt] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleMobileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/account/request-deletion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mobileNumber }),
      });

      const data = await response.json();

      if (data.success) {
        setRequestId(data.requestId);
        setIsExistingRequest(data.existingRequest || false);
        setStep(2);
        setResendTimer(600); // 10 minutes
        toast.success('OTP sent to your WhatsApp number');
      } else {
        toast.error(data.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/account/confirm-deletion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId, otp }),
      });

      const data = await response.json();

      if (data.success) {
        setDeletionInfo(data);
        if (isExistingRequest) {
          // Show existing request details with cancel option
          setStep(3);
          toast.success('Authenticated! You can view or cancel your existing deletion request');
        } else {
          // Show new confirmation
          setStep(3);
          toast.success('Account deletion request confirmed');
        }
      } else {
        toast.error(data.message || 'Invalid OTP');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/account/request-deletion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mobileNumber }),
      });

      const data = await response.json();

      if (data.success) {
        setRequestId(data.requestId);
        setResendTimer(600);
        toast.success('OTP resent to your WhatsApp number');
      } else {
        toast.error(data.message || 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDeletion = async () => {
    if (!requestId) return;

    setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/account/cancel-deletion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Account deletion request cancelled');
        setCancelledAt(new Date()); // Store the cancellation time
        setStep(4); // Show cancellation confirmation
      } else {
        toast.error(data.message || 'Failed to cancel deletion');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatMobileNumber = (number) => {
    if (number.length <= 3) return number;
    return number.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  };

  const formatDeletionDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="bg-red-600 px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Account Deletion</h1>
            <p className="text-red-100 text-sm mt-1">Delete your Mandap Association account</p>
          </div>

          <div className="p-6">
            {/* Step 1: Mobile Number Input */}
            {step === 1 && (
              <div>
                <div className="mb-6">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">Important Notice</h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <p>This action will permanently delete your account after a 15-day waiting period. This action cannot be undone.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleMobileSubmit}>
                  <div className="mb-4">
                    <label htmlFor="mobileNumber" className="block text-sm font-medium text-gray-700 mb-2">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      id="mobileNumber"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="Enter 10-digit mobile number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      required
                      maxLength={10}
                      pattern="[0-9]{10}"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Enter the mobile number registered with your account
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || mobileNumber.length !== 10}
                    className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Sending OTP...' : 'Send OTP'}
                  </button>
                </form>
              </div>
            )}

            {/* Step 2: OTP Verification */}
            {step === 2 && (
              <div>
                <div className="mb-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">OTP Sent</h3>
                        <div className="mt-2 text-sm text-blue-700">
                          <p>We've sent a 6-digit OTP to your WhatsApp number ending in {mobileNumber.slice(-4)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleOtpSubmit}>
                  <div className="mb-4">
                    <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                      Enter OTP
                    </label>
                    <input
                      type="text"
                      id="otp"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Enter 6-digit OTP"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg"
                      required
                      maxLength={6}
                      pattern="[0-9]{6}"
                    />
                  </div>

                  <div className="mb-4">
                    <button
                      type="submit"
                      disabled={loading || otp.length !== 6}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? 'Verifying...' : 'Verify OTP'}
                    </button>
                  </div>

                  <div className="flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-gray-600 hover:text-gray-800 text-sm"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={loading || resendTimer > 0}
                      className="text-blue-600 hover:text-blue-800 text-sm disabled:text-gray-400"
                    >
                      {resendTimer > 0 ? `Resend OTP in ${Math.floor(resendTimer / 60)}:${(resendTimer % 60).toString().padStart(2, '0')}` : 'Resend OTP'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Step 3: Confirmation */}
            {step === 3 && deletionInfo && (
              <div>
                <div className="mb-6">
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-green-800">
                          {isExistingRequest ? 'Existing Deletion Request Found' : 'Deletion Request Confirmed'}
                        </h3>
                        <div className="mt-2 text-sm text-green-700">
                          <p>
                            {isExistingRequest 
                              ? 'You already have a deletion request scheduled. You can view details or cancel it below.'
                              : 'Your account deletion request has been confirmed and scheduled.'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Deletion Details</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mobile Number:</span>
                      <span className="font-medium">{formatMobileNumber(mobileNumber)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="font-medium text-orange-600">Pending Deletion</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Deletion Date:</span>
                      <span className="font-medium">{formatDeletionDate(deletionInfo.deletionScheduledAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
                  <h3 className="text-sm font-medium text-yellow-800 mb-2">Important Information</h3>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Your account will be permanently deleted on {formatDeletionDate(deletionInfo.deletionScheduledAt)}</li>
                    <li>• You can cancel this request anytime before the deletion date</li>
                    <li>• All your data will be permanently removed and cannot be recovered</li>
                    <li>• You will lose access to all Mandap Association services</li>
                  </ul>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleCancelDeletion}
                    disabled={loading}
                    className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Cancelling...' : 'Cancel Deletion'}
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Go to Homepage
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Cancellation Confirmation */}
            {step === 4 && (
              <div>
                <div className="mb-6">
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-green-800">Deletion Request Cancelled</h3>
                        <div className="mt-2 text-sm text-green-700">
                          <p>Your account deletion request has been successfully cancelled. Your account remains active.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Cancellation Details</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mobile Number:</span>
                      <span className="font-medium">{formatMobileNumber(mobileNumber)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="font-medium text-green-600">Cancelled</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cancelled At:</span>
                      <span className="font-medium">{cancelledAt ? cancelledAt.toLocaleString() : new Date().toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                  <h3 className="text-sm font-medium text-blue-800 mb-2">What's Next?</h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Your account remains active and accessible</li>
                    <li>• You can request deletion again in the future if needed</li>
                    <li>• All your data and services remain available</li>
                    <li>• You can continue using Mandap Association services normally</li>
                  </ul>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => navigate('/login')}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Go to Login
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Go to Homepage
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountDeletion;
