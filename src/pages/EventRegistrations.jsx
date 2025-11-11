import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { eventApi } from '../services/eventApi';
import { memberApi } from '../services/memberApi';
import { uploadApi } from '../services/uploadApi';
import toast from 'react-hot-toast';
import {
  Loader2,
  Search,
  RefreshCw,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Building2,
  User,
  Download,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Camera
} from 'lucide-react';

const statusColors = {
  registered: 'bg-blue-100 text-blue-700',
  attended: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  pending: 'bg-yellow-100 text-yellow-700'
};

const paymentColors = {
  paid: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  failed: 'bg-red-100 text-red-700'
};

const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

const getBadgeClass = (map, key) => {
  if (!key) return 'bg-gray-100 text-gray-600';
  const normalized = key.toLowerCase();
  return map[normalized] || 'bg-gray-100 text-gray-600';
};

const getVerificationKey = (registration) => {
  if (!registration) return null;
  if (registration.registrationId) return `reg-${registration.registrationId}`;
  if (registration.memberId) return `member-${registration.memberId}`;
  if (registration.phone) return `phone-${registration.phone}`;
  return null;
};

const resolvePhotoUrl = (registration, member) => {
  if (!registration) return null;
  const candidate =
    registration.photo ||
    registration.photoUrl ||
    registration.profileImageURL ||
    member?.profileImageURL ||
    member?.profilePhotoUrl ||
    member?.businessImageURL ||
    member?.photo ||
    member?.image;

  if (!candidate) return null;
  return uploadApi.getImageUrl({ image: candidate, imageURL: candidate });
};

const resolveQrUrl = (detail) => {
  if (!detail) return null;
  return (
    detail.qrDataURL ||
    detail.qrCode ||
    detail.qrCodeUrl ||
    detail.qrCodeDataURL ||
    null
  );
};

const downloadQr = (detail, eventId) => {
  if (!detail || !eventId) return;

  const qrUrl = resolveQrUrl(detail);
  const fallback = detail.qrToken || detail.registrationId || detail.memberId;

  const link = document.createElement('a');
  link.download = `event-${eventId}-registration-${detail.registrationId || detail.memberId || 'qr'}.png`;

  if (qrUrl) {
    link.href = qrUrl;
  } else if (fallback) {
    link.href = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(fallback)}`;
  } else {
    toast.error('QR code not available for download');
    return;
  }

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const EventRegistrations = () => {
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [registrations, setRegistrations] = useState([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [verificationMap, setVerificationMap] = useState({});
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [memberCache, setMemberCache] = useState({});
  const memberCacheRef = useRef({});

  useEffect(() => {
    memberCacheRef.current = memberCache;
  }, [memberCache]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetchEvents = useCallback(async () => {
    try {
      setLoadingEvents(true);
      const response = await eventApi.getEvents({ limit: 100, includePast: true });
      const items = (response.events || []).sort((a, b) => {
        const dateA = new Date(a.startDate || a.createdAt || 0).getTime();
        const dateB = new Date(b.startDate || b.createdAt || 0).getTime();
        return dateB - dateA;
      });
      setEvents(items);

      if (!selectedEventId && items.length > 0) {
        setSelectedEventId(String(items[0].id));
      }
    } catch (error) {
      console.error('EventRegistrations - fetchEvents error', error);
      toast.error('Failed to load events for manager view');
    } finally {
      setLoadingEvents(false);
    }
  }, [selectedEventId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const extractMemberFromRegistration = (registration) =>
    registration?.member ||
    registration?.memberDetails ||
    registration?.memberData ||
    registration?.memberProfile ||
    null;

  const normalizeMemberData = (member, registration) => {
    if (!member) return null;
    const normalized = { ...member };

    if (!normalized.email) {
      normalized.email =
        normalized.contactEmail ||
        registration?.email ||
        registration?.memberEmail ||
        null;
    }

    if (!normalized.businessName) {
      normalized.businessName =
        registration?.businessName ||
        normalized.companyName ||
        null;
    }

    if (!normalized.businessType) {
      normalized.businessType =
        registration?.businessType ||
        normalized.category ||
        null;
    }

    if (!normalized.city) {
      normalized.city = registration?.city || null;
    }

    if (!normalized.profileImageURL) {
      normalized.profileImageURL =
        member?.profilePhotoUrl ||
        member?.photo ||
        member?.image ||
        registration?.photo ||
        registration?.photoUrl ||
        null;
    }

    return normalized;
  };

  const fetchRegistrations = useCallback(async (eventId) => {
    if (!eventId) {
      setRegistrations([]);
      return;
    }

    try {
      setLoadingRegistrations(true);
      const response = await eventApi.getEventRegistrations(eventId);
      const registrationsData = response.registrations || [];

      const registrationMapByMemberId = {};
      const directMemberCache = {};

      registrationsData.forEach((registration) => {
        const memberCandidate = extractMemberFromRegistration(registration);
        const candidateId = memberCandidate?.id;
        const memberId =
          candidateId !== undefined && candidateId !== null
            ? candidateId
            : registration.memberId;

        if (registration.memberId !== undefined && registration.memberId !== null) {
          registrationMapByMemberId[String(registration.memberId)] = registration;
        }

        if (memberCandidate && memberId !== undefined && memberId !== null) {
          directMemberCache[memberId] =
            normalizeMemberData(memberCandidate, registration) || memberCandidate;
        }
      });

      const missingMemberIds = Array.from(
        new Set(
          registrationsData
            .map((registration) => registration.memberId)
            .filter(
              (memberId) =>
                memberId &&
                !directMemberCache[memberId] &&
                !memberCacheRef.current[memberId]
            )
        )
      );

      const fetchedMembers = {};
      if (missingMemberIds.length > 0) {
        const results = await Promise.allSettled(
          missingMemberIds.map((memberId) => memberApi.getMember(memberId))
        );

        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            const rawMember = result.value.member || result.value;
            if (rawMember) {
              const targetMemberId = missingMemberIds[index];
              const relatedRegistration =
                registrationMapByMemberId[String(targetMemberId)];
              fetchedMembers[targetMemberId] =
                normalizeMemberData(rawMember, relatedRegistration) || rawMember;
            }
          } else {
            console.error('EventRegistrations - member preload error', result.reason);
          }
        });
      }

      const mergedMemberCache = {
        ...memberCacheRef.current,
        ...directMemberCache,
        ...fetchedMembers
      };

      memberCacheRef.current = mergedMemberCache;
      setMemberCache(mergedMemberCache);

      const enrichedRegistrations = registrationsData.map((registration) => {
        const memberData =
          mergedMemberCache[registration.memberId] ||
          extractMemberFromRegistration(registration) ||
          null;

        const email =
          registration.email ||
          registration.memberEmail ||
          memberData?.email ||
          memberData?.contactEmail ||
          null;

        const businessName =
          registration.businessName ||
          memberData?.businessName ||
          memberData?.companyName ||
          null;

        const businessType =
          registration.businessType ||
          memberData?.businessType ||
          memberData?.category ||
          null;

        const city = registration.city || memberData?.city || null;

        const photo =
          registration.photo ||
          registration.photoUrl ||
          registration.profileImageURL ||
          memberData?.profileImageURL ||
          memberData?.photo ||
          memberData?.image ||
          null;

        return {
          ...registration,
          member: memberData,
          memberName: registration.memberName || memberData?.name || registration.name,
          email,
          businessName,
          businessType,
          city,
          photo
        };
      });

      setRegistrations(enrichedRegistrations);
    } catch (error) {
      console.error('EventRegistrations - fetchRegistrations error', error);
      toast.error('Failed to load registrations');
      setRegistrations([]);
    } finally {
      setLoadingRegistrations(false);
    }
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchRegistrations(selectedEventId);
    }
  }, [selectedEventId, fetchRegistrations]);

  const refresh = () => {
    fetchEvents();
    if (selectedEventId) {
      fetchRegistrations(selectedEventId);
    }
  };

  const filteredRegistrations = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return registrations.filter((registration) => {
      const cachedMember = memberCache[registration.memberId];
      const statusOk =
        statusFilter === 'all' ||
        (registration.status && registration.status.toLowerCase() === statusFilter);
      const paymentOk =
        paymentFilter === 'all' ||
        (registration.paymentStatus && registration.paymentStatus.toLowerCase() === paymentFilter);

      const text = [
        registration.name,
        registration.memberName,
        cachedMember?.name,
        registration.phone,
        cachedMember?.phone,
        registration.businessName,
        cachedMember?.businessName,
        registration.email,
        cachedMember?.email
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const searchOk = term === '' || text.includes(term);
      return statusOk && paymentOk && searchOk;
    });
  }, [registrations, memberCache, searchTerm, statusFilter, paymentFilter]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredRegistrations.length / pageSize));
  }, [filteredRegistrations.length]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, paymentFilter, selectedEventId]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedRegistrations = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRegistrations.slice(start, start + pageSize);
  }, [filteredRegistrations, currentPage]);

  const metrics = useMemo(() => {
    const total = registrations.length;
    const paid = registrations.filter((item) => item.paymentStatus?.toLowerCase() === 'paid').length;
    const attended = registrations.filter((item) => item.status?.toLowerCase() === 'attended').length;
    const pending = registrations.filter((item) => item.status?.toLowerCase() === 'registered' && item.paymentStatus?.toLowerCase() !== 'paid').length;
    return { total, paid, attended, pending };
  }, [registrations]);

  const toggleVerification = (registration) => {
    const key = getVerificationKey(registration);
    if (!key) return;

    setVerificationMap((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));

    const isVerified = Boolean(verificationMap[key]);
    toast.success(isVerified ? 'Marked as not verified' : 'Registration verified');
  };

  const isVerified = (registration) => {
    const key = getVerificationKey(registration);
    return key ? Boolean(verificationMap[key]) : false;
  };

  const openDetail = async (registration) => {
    setDetailModalOpen(true);
    setDetail(null);
    setDetailLoading(true);

    try {
      let member = memberCache[registration.memberId] || registration.member;
      if (!member && registration.memberId) {
        try {
          const response = await memberApi.getMember(registration.memberId);
          member = response.member || response;
          if (member && member.id) {
            setMemberCache((prev) => ({
              ...prev,
              [member.id]: member
            }));
          }
        } catch (error) {
          console.error('EventRegistrations - member lookup error', error);
        }
      }

      let qrData = {
        qrDataURL: registration.qrDataURL,
        qrCode: registration.qrCode,
        qrCodeUrl: registration.qrCodeUrl,
        qrCodeDataURL: registration.qrCodeDataURL,
        qrToken: registration.qrToken,
        registrationId: registration.registrationId
      };

      const hasQr = Boolean(resolveQrUrl(qrData));
      const phone = (registration.phone || member?.phone || '').replace(/\D/g, '');

      if (!hasQr && phone && phone.length === 10 && selectedEventId) {
        try {
          const status = await eventApi.checkPublicRegistrationStatus(selectedEventId, phone);
          const backendRegistration = status.registration || {};
          qrData = {
            qrDataURL: status.qrDataURL || backendRegistration.qrDataURL || null,
            qrCode: status.qrCode || backendRegistration.qrCode || null,
            qrCodeUrl: status.qrCodeUrl || backendRegistration.qrCodeUrl || null,
            qrCodeDataURL: status.qrCodeDataURL || backendRegistration.qrCodeDataURL || null,
            qrToken: status.qrToken || backendRegistration.qrToken || null,
            registrationId: backendRegistration.id || registration.registrationId || null,
            registeredAt: backendRegistration.registeredAt || registration.registeredAt,
            attendedAt: backendRegistration.attendedAt || registration.attendedAt,
            status: backendRegistration.status || registration.status,
            paymentStatus: backendRegistration.paymentStatus || registration.paymentStatus,
            amountPaid: backendRegistration.amountPaid || registration.amountPaid
          };
        } catch (error) {
          console.error('EventRegistrations - status lookup error', error);
          toast.error('Could not retrieve QR code for this registration');
        }
      }

      const detailPayload = {
        ...registration,
        ...qrData,
        member: member || registration.member || null
      };

      setDetail(detailPayload);

      setRegistrations((prev) =>
        prev.map((item) =>
          item.memberId === registration.memberId
            ? { ...item, ...qrData }
            : item
        )
      );
    } catch (error) {
      console.error('EventRegistrations - openDetail error', error);
      toast.error('Failed to load registration details');
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetailModalOpen(false);
    setDetail(null);
  };

  const statusOptions = useMemo(() => {
    const set = new Set();
    registrations.forEach((item) => {
      if (item.status) set.add(item.status.toLowerCase());
    });
    return Array.from(set);
  }, [registrations]);

  const paymentOptions = useMemo(() => {
    const set = new Set();
    registrations.forEach((item) => {
      if (item.paymentStatus) set.add(item.paymentStatus.toLowerCase());
    });
    return Array.from(set);
  }, [registrations]);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Event Registrations (Manager)</h1>
            <p className="text-gray-600 mt-2">Review event registrations and verify attendee photos/QR codes.</p>
          </div>
          <button
            onClick={refresh}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total Registrations</p>
            <p className="text-2xl font-semibold text-gray-900 mt-2">{metrics.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Paid</p>
            <p className="text-2xl font-semibold text-green-600 mt-2">{metrics.paid}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Attended</p>
            <p className="text-2xl font-semibold text-blue-600 mt-2">{metrics.attended}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Pending Verification</p>
            <p className="text-2xl font-semibold text-yellow-600 mt-2">{metrics.pending}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Event</label>
              <select
                value={selectedEventId}
                onChange={(event) => setSelectedEventId(event.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                disabled={loadingEvents}
              >
                {loadingEvents ? (
                  <option value="">Loading events...</option>
                ) : events.length > 0 ? (
                  events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.title || event.name || `Event #${event.id}`}
                    </option>
                  ))
                ) : (
                  <option value="">No events available</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by name, phone, or business"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Registration Status</label>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All statuses</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
              <select
                value={paymentFilter}
                onChange={(event) => setPaymentFilter(event.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All payments</option>
                {paymentOptions.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-primary-600" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Registrations</h2>
                {selectedEventId && (
                  <p className="text-sm text-gray-500">Showing {filteredRegistrations.length} of {registrations.length} registrations</p>
                )}
              </div>
            </div>
          </div>

          {loadingRegistrations ? (
            <div className="p-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading registrations...</p>
            </div>
          ) : filteredRegistrations.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
                <AlertCircle className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No registrations found</h3>
              <p className="text-gray-500">Try adjusting the filters or check back later.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered At</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedRegistrations.map((registration) => {
                    const cachedMember = memberCache[registration.memberId];
                    const photoUrl = resolvePhotoUrl(registration, cachedMember);
                    const verified = isVerified(registration);

                    return (
                      <tr key={`${registration.memberId || registration.phone || Math.random()}`} className={verified ? 'bg-green-50/50' : ''}>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                              {photoUrl ? (
                                <img
                                  src={photoUrl}
                                  alt={registration.name || cachedMember?.name || 'Attendee'}
                                  className="h-full w-full object-cover"
                                  onError={(event) => {
                                    event.currentTarget.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <User className="h-6 w-6 text-gray-500" />
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="flex items-center space-x-2">
                                <div className="text-sm font-medium text-gray-900">
                                  {registration.name || cachedMember?.name || 'Unknown'}
                                </div>
                                {verified && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                    <CheckCircle2 className="h-3 w-3 mr-1" /> Verified
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-500">{registration.phone || cachedMember?.phone || 'Phone not available'}</div>
                              <div className="text-sm text-gray-500">{registration.email || cachedMember?.email || 'Email not available'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{registration.businessName || cachedMember?.businessName || 'Business info not available'}</div>
                          <div className="text-sm text-gray-500 capitalize">{registration.businessType || cachedMember?.businessType || 'Business type not available'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBadgeClass(paymentColors, registration.paymentStatus)}`}>
                            {registration.paymentStatus ? registration.paymentStatus.charAt(0).toUpperCase() + registration.paymentStatus.slice(1) : 'Unknown'}
                          </span>
                          <div className="text-sm text-gray-500 mt-1">₹ {registration.amountPaid || 0}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBadgeClass(statusColors, registration.status)}`}>
                            {registration.status ? registration.status.charAt(0).toUpperCase() + registration.status.slice(1) : 'Unknown'}
                          </span>
                          {registration.attendedAt && (
                            <div className="text-xs text-gray-500 mt-1">Checked-in: {formatDateTime(registration.attendedAt)}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{formatDateTime(registration.registeredAt)}</td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => toggleVerification(registration)}
                            className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                              verified
                                ? 'text-green-700 bg-green-50 border-green-200 hover:bg-green-100'
                                : 'text-gray-700 bg-white border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            {verified ? (
                              <>
                                <XCircle className="h-4 w-4 mr-2" /> Undo Verify
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-4 w-4 mr-2" /> Mark Verified
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => openDetail(registration)}
                            className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {filteredRegistrations.length > 0 && (
          <div className="bg-white rounded-lg shadow mt-4 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="text-sm text-gray-600">
              Showing <span className="font-semibold">{paginatedRegistrations.length}</span> of <span className="font-semibold">{filteredRegistrations.length}</span> registrations
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded border text-sm transition-colors ${
                  currentPage === 1
                    ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'text-gray-700 border-gray-300 hover:bg-gray-100'
                }`}
              >
                Previous
              </button>
              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, index) => index + 1)
                  .slice(Math.max(0, currentPage - 3), currentPage + 2)
                  .map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 rounded border text-sm transition-colors ${
                        currentPage === page
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'text-gray-700 border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
              </div>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded border text-sm transition-colors ${
                  currentPage === totalPages
                    ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'text-gray-700 border-gray-300 hover:bg-gray-100'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}

        <Modal title="Registration Details" isOpen={detailModalOpen} onClose={closeDetail} size="max-w-3xl">
          {detailLoading ? (
            <div className="p-6 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading registration information...</p>
            </div>
          ) : detail ? (
            (() => {
              const cachedMember = memberCache[detail.memberId] || detail.member;
              return (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900">{detail.name || cachedMember?.name || 'Attendee details'}</h3>
                  <p className="text-gray-500">Member ID: {detail.memberId || '—'}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleVerification(detail)}
                    className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                      isVerified(detail)
                        ? 'text-green-700 bg-green-50 border-green-200 hover:bg-green-100'
                        : 'text-gray-700 bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {isVerified(detail) ? (
                      <>
                        <XCircle className="h-4 w-4 mr-2" /> Undo Verify
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" /> Mark Verified
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => downloadQr(detail, selectedEventId)}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700"
                  >
                    <Download className="h-4 w-4 mr-2" /> Download QR
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                  <div className="bg-gray-100 rounded-lg p-4 flex flex-col items-center justify-center">
                    <div className="h-44 w-44 rounded-lg bg-white border border-gray-200 flex items-center justify-center overflow-hidden">
                      {(() => {
                        const photoUrl = resolvePhotoUrl(detail, cachedMember);
                        if (photoUrl) {
                          return (
                            <img
                              src={photoUrl}
                              alt="Member profile"
                              className="h-full w-full object-cover"
                              onError={(event) => {
                                event.currentTarget.style.display = 'none';
                              }}
                            />
                          );
                        }
                        return <Camera className="h-10 w-10 text-gray-400" />;
                      })()}
                    </div>
                    <p className="text-sm text-gray-600 mt-3">Uploaded photo</p>
                  </div>
                </div>
                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Phone</p>
                    <div className="flex items-center text-sm text-gray-900">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      {detail.phone || cachedMember?.phone || 'Not available'}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Email</p>
                    <div className="flex items-center text-sm text-gray-900">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      {detail.email || cachedMember?.email || 'Not available'}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Business Name</p>
                    <div className="flex items-center text-sm text-gray-900">
                      <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                      {cachedMember?.businessName || 'Not provided'}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Business Type</p>
                    <div className="text-sm text-gray-900 capitalize">{cachedMember?.businessType || 'Not provided'}</div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">City</p>
                    <div className="flex items-center text-sm text-gray-900">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      {cachedMember?.city || 'Not specified'}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Payment</p>
                    <div className="text-sm text-gray-900">₹ {detail.amountPaid || 0}</div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 mt-1 rounded-full text-xs font-medium ${getBadgeClass(paymentColors, detail.paymentStatus)}`}>
                      {detail.paymentStatus ? detail.paymentStatus.charAt(0).toUpperCase() + detail.paymentStatus.slice(1) : 'Unknown'}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Registration Status</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBadgeClass(statusColors, detail.status)}`}>
                      {detail.status ? detail.status.charAt(0).toUpperCase() + detail.status.slice(1) : 'Unknown'}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Registered At</p>
                    <div className="text-sm text-gray-900">{formatDateTime(detail.registeredAt)}</div>
                  </div>
                  {detail.attendedAt && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Checked-in At</p>
                      <div className="text-sm text-gray-900">{formatDateTime(detail.attendedAt)}</div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-2">QR Code</p>
                <div className="flex items-center justify-center border border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
                  {(() => {
                    const qrImage = resolveQrUrl(detail);
                    if (qrImage) {
                      return (
                        <img
                          src={qrImage}
                          alt="Registration QR code"
                          className="h-44 w-44 object-contain"
                          onError={(event) => {
                            event.currentTarget.style.display = 'none';
                          }}
                        />
                      );
                    }

                    const fallback = detail.qrToken || detail.registrationId || detail.memberId;
                    if (!fallback) {
                      return <p className="text-sm text-gray-500">QR code unavailable for this registration.</p>;
                    }

                    return (
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(fallback)}`}
                        alt="Generated QR code"
                        className="h-44 w-44 object-contain"
                      />
                    );
                  })()}
                </div>
              </div>

              {process.env.NODE_ENV === 'development' && (
                <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-500">
                  <p className="font-semibold text-gray-600 mb-2">Debug Information</p>
                  <pre className="overflow-auto max-h-48">{JSON.stringify(detail, null, 2)}</pre>
                </div>
              )}
            </div>
              );
            })()
          ) : (
            <div className="p-6 text-center text-gray-500">Select a registration to view details.</div>
          )}
        </Modal>
      </div>
    </Layout>
  );
};

export default EventRegistrations;


