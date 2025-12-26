import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import ManualRegistrationModal from '../components/ManualRegistrationModal';
import { eventApi } from '../services/eventApi';
import { memberApi } from '../services/memberApi';
import { uploadApi } from '../services/uploadApi';
import { API_BASE_URL } from '../constants';
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
  Camera,
  Send,
  X
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

const DEVICE_UID = 'a8bec8c820614d8ba084a55429716a78';
const DEVICE_NAME = 'Mandapam';
const COUNTRY_CODE = '91';
const DEFAULT_PROFILE_PLACEHOLDER =
  'data:image/svg+xml;utf8,<svg xmlns=%27http://www.w3.org/2000/svg%27 width=%27256%27 height=%27256%27 viewBox=%270 0 256 256%27><rect width=%27256%27 height=%27256%27 rx=%2760%27 fill=%27%23f3f4f6%27/><circle cx=%27128%27 cy=%2796%27 r=%2760%27 fill=%27%23d1d5db%27/><path d=%27M56 220c0-46 36-84 72-84s72 38 72 84%27 fill=%27%239ca3af%27/></svg>';

let jsPdfModule = null;
const loadJsPdf = async () => {
  if (!jsPdfModule) {
    jsPdfModule = await import('jspdf');
  }
  return jsPdfModule.jsPDF;
};

const WHATSAPP_MESSAGE_TEMPLATE = `
🙏 MANDAPAM 2026 – कोल्हापूर मध्ये आपले हार्दिक स्वागत! 🎉

आपण आता MANDAPAM Association चे अधिकृत सदस्य झाला आहात. 🎊

आपला Visitor Pass खाली जोडलेला आहे. 🎫

📞 कार्यक्रमाची सविस्तर माहिती, एक्झिबिटर्स माहिती, वेळापत्रक आणि खास ऑफर्स पाहण्यासाठी
MANDAPAM App डाउनलोड करा 👇

📱 Android वापरकर्त्यांसाठी:
👉 https://play.google.com/store/apps/details?id=com.mandapam.expo

🍎 iOS वापरकर्त्यांसाठी:
👉 लवकरच येत आहे

🔑 आपल्या मोबाईल क्रमांकाने लॉगिन करून अँपमध्ये प्रवेश करा.

आपल्या सहभागाबद्दल मनःपूर्वक धन्यवाद!

— MANDAPAM टीम
`.trim();

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

const getPassKey = (registration) => {
  if (!registration) return null;
  if (registration.registrationId) return `reg-${registration.registrationId}`;
  if (registration.id) return `reg-${registration.id}`;
  if (registration.memberId) return `member-${registration.memberId}`;
  if (registration.phone) return `phone-${registration.phone}`;
  return null;
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

const resolvePhotoUrl = (registration, member, forceRefresh = false) => {
  if (!registration) return DEFAULT_PROFILE_PLACEHOLDER;
  const candidate =
    registration.photo ||
    registration.photoUrl ||
    registration.profileImageURL ||
    registration.rawPhotoData ||
    member?.profileImage ||
    member?.profileImageURL ||
    member?.profilePhotoUrl ||
    member?.businessImageURL ||
    member?.photo ||
    member?.image;

  if (!candidate) return DEFAULT_PROFILE_PLACEHOLDER;
  if (typeof candidate === 'string' && candidate.startsWith('data:')) {
    return candidate;
  }

  // If the URL already has a cache-busting parameter, return it as-is
  if (typeof candidate === 'string' && candidate.includes('?t=')) {
    return candidate;
  }

  const imageUrl = uploadApi.getImageUrl({ image: candidate, imageURL: candidate }) || DEFAULT_PROFILE_PLACEHOLDER;
  
  // Add cache-busting if forceRefresh is true (for recently updated images)
  if (forceRefresh && imageUrl !== DEFAULT_PROFILE_PLACEHOLDER) {
    return `${imageUrl}?t=${Date.now()}`;
  }
  
  return imageUrl;
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

const loadImageElement = (url) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';
    img.onload = () => resolve(img);
    img.onerror = (error) => reject(error);
    img.src = url;
  });

const cropImageToSquare = (img) => {
  const size = Math.min(img.width, img.height);
  const offsetX = (img.width - size) / 2;
  const offsetY = (img.height - size) / 2;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, size, size);
  return {
    dataUrl: canvas.toDataURL('image/png'),
    format: 'PNG'
  };
};

const convertImageToDataUrl = async (src) => {
  if (!src) return null;

  const finalize = async (imgPromise, cleanup) => {
    try {
      const img = await imgPromise;
      return cropImageToSquare(img);
    } catch (error) {
      console.error('EventRegistrations - convertImageToDataUrl error', src, error);
      return null;
    } finally {
      if (cleanup) cleanup();
    }
  };

  if (src instanceof File) {
    const objectUrl = URL.createObjectURL(src);
    return finalize(loadImageElement(objectUrl), () => URL.revokeObjectURL(objectUrl));
  }

  if (typeof src === 'string' && src.startsWith('data:')) {
    return finalize(loadImageElement(src));
  }

  if (typeof src === 'string') {
    try {
      return await finalize(loadImageElement(src));
    } catch (error) {
      try {
        const response = await fetch(src, { mode: 'cors' });
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`);
        }
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        return await finalize(loadImageElement(objectUrl), () => URL.revokeObjectURL(objectUrl));
      } catch (fetchError) {
        console.error('EventRegistrations - failed to fetch image for cropping', src, fetchError);
        return null;
      }
    }
  }

  return DEFAULT_PROFILE_PLACEHOLDER;
};

const resolveProfileImageSourceForPdf = (registration, member) => {
  if (!registration) return null;

  const candidates = [
    registration.rawPhotoData,
    registration.photoOriginal,
    registration.photoBase64,
    registration.photoData,
    registration.profileImageData,
    registration.profileImageURL,
    registration.profileImage,
    registration.photoUrl,
    registration.photo,
    registration.member?.profileImageURL,
    registration.member?.profileImage,
    registration.member?.photoUrl,
    registration.member?.photo,
    registration.member?.profilePhotoUrl,
    registration.member?.image,
    member?.profileImageURL,
    member?.profileImage,
    member?.photoUrl,
    member?.photo,
    member?.profilePhotoUrl,
    member?.image
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;

    if (typeof candidate === 'string') {
      if (candidate.startsWith('data:')) {
        return candidate;
      }
      const url = uploadApi.getImageUrl(candidate);
      if (url) return url;
    } else if (candidate.image || candidate.imageURL) {
      const url = uploadApi.getImageUrl(candidate);
      if (url) return url;
    }
  }

  return null;
};

const base64ToBlob = (base64, type = 'application/pdf') => {
  const byteCharacters = window.atob(base64);
  const byteArrays = [];
  const sliceSize = 8192;
  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i += 1) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    byteArrays.push(new Uint8Array(byteNumbers));
  }
  return new Blob(byteArrays, { type });
};

const formatPhoneNumber = (value) => {
  const digits = (value || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) return `${COUNTRY_CODE}${digits}`;
  if (digits.length === 12 && digits.startsWith(COUNTRY_CODE)) return digits;
  if (digits.length > 10) return `${COUNTRY_CODE}${digits.slice(-10)}`;
  return '';
};

const buildMessage = (memberName) => {
  const greetingName = memberName ? `प्रिय ${memberName},\n\n` : '';
  return `${greetingName}${WHATSAPP_MESSAGE_TEMPLATE}`;
};

const wait = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const fetchMembersWithRateLimit = async (memberIds, fetchFn, options = {}) => {
  const { batchSize = 6, delayMs = 150 } = options;
  const successes = {};
  const errors = [];

  for (let index = 0; index < memberIds.length; index += batchSize) {
    const batch = memberIds.slice(index, index + batchSize);

    const results = await Promise.allSettled(batch.map((memberId) => fetchFn(memberId)));

    results.forEach((result, resultIndex) => {
      const memberId = batch[resultIndex];
      if (result.status === 'fulfilled') {
        successes[memberId] = result.value;
      } else {
        errors.push({
          memberId,
          error: result.reason
        });
      }
    });

    if (index + batchSize < memberIds.length) {
      await wait(delayMs);
    }
  }

  return { successes, errors };
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
  const [sendingPassIds, setSendingPassIds] = useState({});
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [memberCache, setMemberCache] = useState({});
  const [showManualRegistration, setShowManualRegistration] = useState(false);
  const fileInputRef = useRef(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [recentlyUpdatedImages, setRecentlyUpdatedImages] = useState(new Set());
  const [cancellingRegistrationId, setCancellingRegistrationId] = useState(null);
  const [cancelConfirmationModal, setCancelConfirmationModal] = useState(false);
  const [registrationToCancel, setRegistrationToCancel] = useState(null);
  const memberCacheRef = useRef({});

  useEffect(() => {
    memberCacheRef.current = memberCache;
  }, [memberCache]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Cleanup recently updated images after 5 minutes to prevent unnecessary cache-busting
  useEffect(() => {
    if (recentlyUpdatedImages.size === 0) return;

    const timer = setTimeout(() => {
      setRecentlyUpdatedImages(new Set());
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearTimeout(timer);
  }, [recentlyUpdatedImages]);

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

  const handleImageChange = async (event) => {
    const file = event.target.files[0];
    if (!file || !detail || !selectedEventId) return;

    setUploadingImage(true);
    toast.loading('Uploading image...', { id: 'image-upload' });

    try {
      const uploadResult = await uploadApi.uploadProfileImage(file);
      const newImageUrl = uploadResult.url || uploadResult.image;

      if (!newImageUrl) {
        throw new Error('Failed to get image URL after upload.');
      }

      const registrationId = detail.registrationId || detail.id;
      if (!registrationId) {
        throw new Error('Registration ID not found for update.');
      }

      await eventApi.updateRegistrationImage(selectedEventId, registrationId, newImageUrl);

      // Track this registration as recently updated for cache-busting
      setRecentlyUpdatedImages(prev => new Set([...prev, registrationId]));

      // Add cache-busting timestamp for immediate display
      const cacheBustingUrl = `${newImageUrl}?t=${Date.now()}`;

      setDetail((prevDetail) => {
        if (!prevDetail) return prevDetail;
        const updatedMember = prevDetail.member ? { ...prevDetail.member, profileImage: cacheBustingUrl } : null;
        return {
          ...prevDetail,
          photo: cacheBustingUrl,
          photoUrl: cacheBustingUrl,
          profileImageURL: cacheBustingUrl,
          member: updatedMember,
        };
      });

      // Also update the main registrations list to reflect the change
      setRegistrations((prevRegistrations) =>
        prevRegistrations.map((reg) =>
          (reg.registrationId || reg.id) === registrationId
            ? {
                ...reg,
                photo: cacheBustingUrl,
                photoUrl: cacheBustingUrl,
                profileImageURL: cacheBustingUrl,
                member: reg.member ? { ...reg.member, profileImage: cacheBustingUrl } : null,
              }
            : reg
        )
      );

      // Update member cache if it exists - use cache-busting URL for immediate display
      if (memberCache[registrationId]) {
        setMemberCache((prevCache) => ({
          ...prevCache,
          [registrationId]: {
            ...prevCache[registrationId],
            profileImage: cacheBustingUrl,
          }
        }));
      }

      // Also update member cache by memberId if it exists
      if (detail.memberId && memberCache[detail.memberId]) {
        setMemberCache((prevCache) => ({
          ...prevCache,
          [detail.memberId]: {
            ...prevCache[detail.memberId],
            profileImage: cacheBustingUrl,
          }
        }));
      }

      toast.success('Image updated successfully!', { id: 'image-upload' });
    } catch (error) {
      console.error('Error uploading or updating image:', error);
      toast.error(error.message || 'Failed to update image.', { id: 'image-upload' });
    } finally {
      setUploadingImage(false);
      // Clear the file input value to allow re-uploading the same file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

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

  const getEventForRegistration = useCallback(
    (registration) => {
      if (!registration) return null;
      if (registration.event) return registration.event;
      const eventId = registration.eventId || selectedEventId;
      if (!eventId) return null;
      return events.find((evt) => String(evt.id) === String(eventId)) || null;
    },
    [events, selectedEventId]
  );

  const enrichRegistrationWithBackendData = useCallback(
    async (registration, member) => {
      if (!registration) return null;
      let enriched = { ...registration };
      const phoneDigits = (registration.phone || member?.phone || '').replace(/\D/g, '');
      const eventIdToUse = registration.eventId || selectedEventId;

      const existingQr = resolveQrUrl(enriched);
      if (!existingQr && phoneDigits.length === 10 && eventIdToUse) {
        try {
          const status = await eventApi.checkPublicRegistrationStatus(eventIdToUse, phoneDigits);
          const backendRegistration = status.registration || {};
          enriched = {
            ...enriched,
            ...backendRegistration,
            qrDataURL: status.qrDataURL || backendRegistration.qrDataURL || enriched.qrDataURL || null,
            qrCode: status.qrCode || backendRegistration.qrCode || enriched.qrCode || null,
            qrCodeUrl: status.qrCodeUrl || backendRegistration.qrCodeUrl || enriched.qrCodeUrl || null,
            qrCodeDataURL:
              status.qrCodeDataURL || backendRegistration.qrCodeDataURL || enriched.qrCodeDataURL || null,
            qrToken: status.qrToken || backendRegistration.qrToken || enriched.qrToken || null,
            registeredAt: backendRegistration.registeredAt || enriched.registeredAt,
            paymentStatus: backendRegistration.paymentStatus || enriched.paymentStatus,
            amountPaid: backendRegistration.amountPaid ?? enriched.amountPaid
          };
        } catch (error) {
          console.error('EventRegistrations - enrichRegistrationWithBackendData error', error);
        }
      }

      if (!enriched.member && member) {
        enriched.member = member;
      }

      return enriched;
    },
    [selectedEventId]
  );

  const generatePassPdf = useCallback(
    async (registration, member) => {
      if (!registration) {
        throw new Error('Registration data not available');
      }

      const event = getEventForRegistration(registration) || {};
      const jsPDF = await loadJsPdf();
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const marginX = 60;
      let cursorY = 72;

      const logoImage = await convertImageToDataUrl('/mandapam-logo.png');
      if (logoImage) {
        const logoWidth = 150;
        const logoHeight = 66;
        doc.addImage(logoImage.dataUrl, logoImage.format, (pageWidth - logoWidth) / 2, cursorY, logoWidth, logoHeight);
        cursorY += logoHeight + 28;
      }

      const eventTitle = event.title || event.name || registration.eventName || `Event #${event.id || ''}`;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(17, 24, 39);
      doc.text(eventTitle, pageWidth / 2, cursorY, { align: 'center' });
      cursorY += 30;

      doc.setFontSize(16);
      doc.setTextColor(37, 99, 235);
      doc.text('VISITOR PASS', pageWidth / 2, cursorY, { align: 'center' });
      cursorY += 24;

      const profileSource =
        resolveProfileImageSourceForPdf(registration, member) ||
        resolvePhotoUrl(registration, member);
      const profileImage = await convertImageToDataUrl(profileSource);

      if (profileImage) {
        const photoSize = 132;
        doc.addImage(profileImage.dataUrl, profileImage.format, (pageWidth - photoSize) / 2, cursorY, photoSize, photoSize);
        cursorY += photoSize + 26;
      } else {
        cursorY += 16;
      }

      const visitorName = registration.name || member?.name || registration.member?.name || 'MANDAPAM सदस्य';
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(17, 24, 39);
      doc.text(visitorName, pageWidth / 2, cursorY, { align: 'center' });
      cursorY += 32;

      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(1);
      doc.line(marginX, cursorY, pageWidth - marginX, cursorY);
      cursorY += 22;

      const registrationId = registration.registrationId || registration.id || '—';
      const paymentStatus = registration.paymentStatus || registration.payment_status || '—';
      const amountPaidRaw = registration.amountPaid ?? registration.amount_paid ?? 0;
      const amountPaid = Number.isFinite(Number(amountPaidRaw)) ? Number(amountPaidRaw).toFixed(2) : '0.00';
      const registeredOn = formatDateTime(registration.registeredAt || registration.registered_at);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(55, 65, 81);
      doc.text(`Registration ID: ${registrationId}`, marginX, cursorY);
      doc.text(`Payment Status: ${paymentStatus}`, pageWidth - marginX, cursorY, { align: 'right' });
      cursorY += 18;
      doc.text(`Amount Paid: Rs. ${amountPaid}`, marginX, cursorY);
      doc.text(`Registered On: ${registeredOn}`, pageWidth - marginX, cursorY, { align: 'right' });
      cursorY += 22;

      const contactPhone = (member?.phone || registration.phone || '').replace(/\D/g, '');
      if (contactPhone) {
        const formattedContactPhone = formatPhoneNumber(contactPhone) || contactPhone;
        doc.text(`Contact: ${formattedContactPhone}`, marginX, cursorY);
        cursorY += 22;
      }

      const qrUrl = resolveQrUrl(registration);
      const qrImage = await convertImageToDataUrl(qrUrl);
      if (qrImage) {
        const qrSize = 168;
        doc.addImage(qrImage.dataUrl, qrImage.format, (pageWidth - qrSize) / 2, cursorY, qrSize, qrSize);
        cursorY += qrSize + 30;
      } else {
        cursorY += 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(17, 24, 39);
      doc.text('Important Instructions', pageWidth / 2, cursorY, { align: 'center' });
      cursorY += 18;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(75, 85, 99);

      const instructions = [
        'Carry a valid photo ID along with this pass to the venue.',
        'Present this QR code at the entry gate for verification.',
        'Arrive at least 15 minutes before the event start time.',
        'Do not share this pass with others; it is non-transferable.',
        'For assistance, contact the Mandapam helpdesk at +91-73878-53989.'
      ];

      instructions.forEach((item) => {
        const lines = doc.splitTextToSize(`• ${item}`, pageWidth - marginX * 2);
        doc.text(lines, marginX, cursorY);
        cursorY += lines.length * 18;
      });

      cursorY += 18;
      doc.setDrawColor(229, 231, 235);
      doc.line(marginX, cursorY, pageWidth - marginX, cursorY);
      cursorY += 22;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(107, 114, 128);
      doc.text(
        'Thank you for registering with the Mandapam Event Team.',
        pageWidth / 2,
        cursorY,
        { align: 'center' }
      );

      const dataUri = doc.output('datauristring');
      const base64 = dataUri.split(',')[1];
      const fileName = `Mandapam-Visitor-Pass-${registrationId || Date.now()}.pdf`;
      return { base64, fileName };
    },
    [getEventForRegistration]
  );

  const sendMessageFileWithPdf = useCallback(async (phone, message, fileName, base64File) => {
    const blob = base64ToBlob(base64File, 'application/pdf');
    const formData = new FormData();
    formData.append('file', blob, fileName);
    formData.append('phone', phone);
    formData.append('message', message);

    const response = await fetch(
      `https://messagesapi.co.in/chat/sendMessageFile/${DEVICE_UID}/${encodeURIComponent(DEVICE_NAME)}`,
      {
        method: 'POST',
        body: formData
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`sendMessageFile failed: ${errorText || response.status}`);
    }
  }, []);

  const fetchRegistrations = useCallback(async (eventId) => {
    if (!eventId) {
      setRegistrations([]);
      return;
    }

    try {
      setLoadingRegistrations(true);
      const response = await eventApi.getEventRegistrations(eventId);
      const registrationsData = response.registrations || [];

      const directMemberCache = {};
      registrationsData.forEach((registration) => {
        const memberCandidate = extractMemberFromRegistration(registration);
        if (registration.memberId != null && memberCandidate) {
          if (!directMemberCache[registration.memberId]) {
            directMemberCache[registration.memberId] =
              normalizeMemberData(memberCandidate, registration) || memberCandidate;
          }
        }
      });

      const mergedMemberCache = {
        ...memberCacheRef.current,
        ...directMemberCache
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

  const handleCancelRegistration = async (registration) => {
    const registrationId = registration.registrationId || registration.id;
    const memberName = registration.name || registration.memberName || 'this member';
    
    // Show custom confirmation modal
    setRegistrationToCancel({
      registration,
      registrationId,
      memberName
    });
    setCancelConfirmationModal(true);
  };

  const confirmCancelRegistration = async () => {
    if (!registrationToCancel) return;
    
    const { registration, registrationId } = registrationToCancel;
    
    try {
      setCancellingRegistrationId(registrationId);
      setCancelConfirmationModal(false);
      
      await eventApi.cancelRegistration(selectedEventId, registrationId);
      
      // Update the registration in the local state
      setRegistrations(prev => 
        prev.map(reg => 
          (reg.registrationId || reg.id) === registrationId 
            ? { ...reg, status: 'cancelled' }
            : reg
        )
      );
      
      // Update detail if it's the same registration
      if (detail && (detail.registrationId || detail.id) === registrationId) {
        setDetail(prev => prev ? { ...prev, status: 'cancelled' } : null);
      }
      
      toast.success('Registration cancelled successfully');
    } catch (error) {
      console.error('Error cancelling registration:', error);
      toast.error(error.message || 'Failed to cancel registration');
    } finally {
      setCancellingRegistrationId(null);
      setRegistrationToCancel(null);
    }
  };

  const closeCancelConfirmationModal = () => {
    setCancelConfirmationModal(false);
    setRegistrationToCancel(null);
  };

  const openDetail = async (registration) => {
    setDetailModalOpen(true);
    setDetail(null);
    setDetailLoading(true);

    try {
      // Fetch fresh registration data from server to get updated image
      const registrationId = registration.registrationId || registration.id;
      let freshRegistration = registration;
      
      if (registrationId && selectedEventId) {
        try {
          const response = await fetch(`${API_BASE_URL}/events/${selectedEventId}/registrations/${registrationId}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.registration) {
              freshRegistration = data.registration;
            }
          }
        } catch (error) {
          console.error('EventRegistrations - fresh data fetch error', error);
          // Fall back to original registration data
        }
      }

      let member = memberCache[freshRegistration.memberId] || freshRegistration.member;
      if (!member && freshRegistration.memberId) {
        try {
          const response = await memberApi.getMember(freshRegistration.memberId);
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
        qrDataURL: freshRegistration.qrDataURL,
        qrCode: freshRegistration.qrCode,
        qrCodeUrl: freshRegistration.qrCodeUrl,
        qrCodeDataURL: freshRegistration.qrCodeDataURL,
        qrToken: freshRegistration.qrToken,
        registrationId: freshRegistration.registrationId
      };

      const hasQr = Boolean(resolveQrUrl(qrData));
      const phone = (freshRegistration.phone || member?.phone || '').replace(/\D/g, '');

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
            registrationId: backendRegistration.id || freshRegistration.registrationId || null,
            registeredAt: backendRegistration.registeredAt || freshRegistration.registeredAt,
            attendedAt: backendRegistration.attendedAt || freshRegistration.attendedAt,
            status: backendRegistration.status || freshRegistration.status,
            paymentStatus: backendRegistration.paymentStatus || freshRegistration.paymentStatus,
            amountPaid: backendRegistration.amountPaid || freshRegistration.amountPaid
          };
        } catch (error) {
          console.error('EventRegistrations - status lookup error', error);
          toast.error('Could not retrieve QR code for this registration');
        }
      }

      const detailPayload = {
        ...freshRegistration,
        ...qrData,
        member: member || freshRegistration.member || null
      };

      setDetail(detailPayload);

      setRegistrations((prev) =>
        prev.map((item) =>
          item.memberId === freshRegistration.memberId
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

  const handleSendPass = useCallback(
    async (registration) => {
      if (!registration) return;

      const key = getPassKey(registration);
      if (!key) {
        toast.error('Unable to identify registration.');
        return;
      }

      if (sendingPassIds[key]) {
        return;
      }

      const registrationId = registration.id || registration.registrationId;
      const eventId = selectedEventId || registration.eventId || registration.event_id;

      if (!registrationId || !eventId) {
        toast.error('Registration ID or Event ID not found.');
        return;
      }

      setSendingPassIds((prev) => ({ ...prev, [key]: true }));

      try {
        // First, check if PDF exists in database. If not, generate and save it first
        let pdfExists = false;
        try {
          // Try to send - if PDF doesn't exist, backend will return error
          const result = await eventApi.sendRegistrationPdfViaWhatsApp(eventId, registrationId);
          if (result.success) {
            toast.success('Visitor pass sent via WhatsApp.');
            return;
          } else {
            // Show error message from backend
            const errorMessage = result.message || result.error || 'Failed to send pass via WhatsApp';
            toast.error(errorMessage, { duration: 8000 });
            return;
          }
        } catch (sendError) {
          // If PDF doesn't exist, we need to generate and save it first
          if (sendError.response?.status === 404 || sendError.response?.data?.message?.includes('PDF not found')) {
            pdfExists = false;
          } else {
            // Some other error occurred
            throw sendError;
          }
        }

        // PDF doesn't exist - generate and save it first
        if (!pdfExists) {
          toast.loading('Generating visitor pass...', { id: `send-pass-${key}` });
          
          let member =
            registration.member ||
            memberCache[registration.memberId] ||
            extractMemberFromRegistration(registration) ||
            null;

          if (!member && registration.memberId) {
            try {
              const response = await memberApi.getMember(registration.memberId);
              member = normalizeMemberData(response.member || response, registration);
              if (member && member.id) {
                setMemberCache((prev) => ({ ...prev, [member.id]: member }));
              }
            } catch (error) {
              console.error('EventRegistrations - sendPass member lookup error', error);
            }
          }

          const enriched = await enrichRegistrationWithBackendData(registration, member);
          const pdf = await generatePassPdf(enriched || registration, member);
          
          if (!pdf?.base64) {
            throw new Error('Failed to generate visitor pass PDF.');
          }

          // PDF is generated on-demand by backend, no need to save
          toast.loading('Sending visitor pass via WhatsApp...', { id: `send-pass-${key}` });
        }

        // Send via WhatsApp (PDF will be generated on-demand by backend)
        let result;
        try {
          result = await eventApi.sendRegistrationPdfViaWhatsApp(eventId, registrationId);
        } catch (apiError) {
          // Handle axios errors (500, etc.)
          const errorMessage = apiError.response?.data?.message || 
                              apiError.response?.data?.error || 
                              apiError.message || 
                              'Failed to send visitor pass. Please try again.';
          toast.error(errorMessage, { id: `send-pass-${key}`, duration: 8000 });
          console.error('EventRegistrations - WhatsApp API error:', apiError);
          return;
        }
        
        if (result && result.success) {
          // Check if it was already sent
          if (result.alreadySent) {
            toast.info('WhatsApp message was already sent for this registration.', { 
              id: `send-pass-${key}`, 
              duration: 5000 
            });
          } else {
            toast.success('Visitor pass sent via WhatsApp.', { id: `send-pass-${key}` });
          }
        } else {
          // Show the actual error message from backend
          const errorMessage = result?.message || result?.error || 'Failed to send pass via WhatsApp';
          toast.error(errorMessage, { id: `send-pass-${key}`, duration: 8000 });
          console.error('EventRegistrations - WhatsApp send failed:', result);
        }
      } catch (error) {
        console.error('EventRegistrations - handleSendPass error', error);
        // Show detailed error message
        const errorMessage = error.response?.data?.message || 
                            error.response?.data?.error || 
                            error.message || 
                            'Failed to send visitor pass. Please try again.';
        toast.error(errorMessage, { id: `send-pass-${key}`, duration: 8000 });
      } finally {
        setSendingPassIds((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    },
    [selectedEventId, enrichRegistrationWithBackendData, generatePassPdf, memberCache, sendingPassIds]
  );

  // Handle download pass - fetch from database instead of generating
  const handleDownloadPass = useCallback(
    async (registration) => {
      if (!registration) return;

      const registrationId = registration.id || registration.registrationId;
      const eventId = selectedEventId || registration.eventId || registration.event_id;

      if (!registrationId || !eventId) {
        toast.error('Registration ID or Event ID not found.');
        return;
      }

      try {
        toast.loading('Downloading visitor pass...', { id: `download-pass-${registrationId}` });

        // Download PDF from database
        const pdfBlob = await eventApi.downloadRegistrationPdf(eventId, registrationId);
        
        // Create download link and trigger download
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
        console.error('EventRegistrations - handleDownloadPass error', error);
        
        // If PDF doesn't exist, generate and save it first, then download
        if (error.response?.status === 404 || error.response?.data?.message?.includes('PDF not found')) {
          toast.loading('Generating visitor pass...', { id: `download-pass-${registrationId}` });
          
          try {
            let member =
              registration.member ||
              memberCache[registration.memberId] ||
              extractMemberFromRegistration(registration) ||
              null;

            if (!member && registration.memberId) {
              try {
                const response = await memberApi.getMember(registration.memberId);
                member = normalizeMemberData(response.member || response, registration);
                if (member && member.id) {
                  setMemberCache((prev) => ({ ...prev, [member.id]: member }));
                }
              } catch (error) {
                console.error('EventRegistrations - downloadPass member lookup error', error);
              }
            }

            const enriched = await enrichRegistrationWithBackendData(registration, member);
            const pdf = await generatePassPdf(enriched || registration, member);
            
            if (!pdf?.base64) {
              throw new Error('Failed to generate visitor pass PDF.');
            }

            // PDF is generated on-demand by backend, no need to save
            // Download directly (backend generates on-demand)
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
          } catch (genError) {
            console.error('EventRegistrations - handleDownloadPass generate error', genError);
            toast.error(
              genError.response?.data?.message || genError.message || 'Failed to generate and download visitor pass.',
              { id: `download-pass-${registrationId}`, duration: 5000 }
            );
          }
        } else {
          toast.error(
            error.response?.data?.message || error.message || 'Failed to download visitor pass.',
            { id: `download-pass-${registrationId}`, duration: 5000 }
          );
        }
      }
    },
    [selectedEventId, enrichRegistrationWithBackendData, generatePassPdf, memberCache]
  );

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
            {selectedEventId && (
              <button
                onClick={() => setShowManualRegistration(true)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
              >
                <User className="h-4 w-4 mr-2" />
                Manual Registration
              </button>
            )}
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
                    const registrationId = registration.registrationId || registration.id;
                    const isRecentlyUpdated = recentlyUpdatedImages.has(registrationId);
                    const photoUrl = resolvePhotoUrl(registration, cachedMember, isRecentlyUpdated);
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
                                    event.currentTarget.onerror = null;
                                    event.currentTarget.src = DEFAULT_PROFILE_PLACEHOLDER;
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
                          {(() => {
                            const passKey = getPassKey(registration);
                            const sending = passKey ? Boolean(sendingPassIds[passKey]) : false;
                            return (
                              <button
                                onClick={() => handleSendPass(registration)}
                                disabled={sending}
                                className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg border border-primary-300 text-primary-700 bg-white transition-colors ${
                                  sending ? 'opacity-60 cursor-not-allowed' : 'hover:bg-primary-50'
                                }`}
                              >
                                {sending ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending...
                                  </>
                                ) : (
                                  <>
                                    <Send className="h-4 w-4 mr-2" /> Send Pass
                                  </>
                                )}
                              </button>
                            );
                          })()}
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
                    onClick={() => handleDownloadPass(detail)}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg border border-primary-300 text-primary-700 bg-white hover:bg-primary-50 transition-colors"
                  >
                    <Download className="h-4 w-4 mr-2" /> Download Pass
                  </button>
                  {detail.status !== 'cancelled' && (
                    <button
                      onClick={() => handleCancelRegistration(detail)}
                      disabled={cancellingRegistrationId === (detail.registrationId || detail.id)}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed transition-colors"
                    >
                      {cancellingRegistrationId === (detail.registrationId || detail.id) ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Cancelling...
                        </>
                      ) : (
                        <>
                          <X className="h-4 w-4 mr-2" /> Cancel
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                  <div className="bg-gray-100 rounded-lg p-4 flex flex-col items-center justify-center">
                    <div 
                      className="h-44 w-44 rounded-lg bg-white border border-gray-200 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary-400 transition-colors relative group"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {(() => {
                        const registrationId = detail.registrationId || detail.id;
                        const isRecentlyUpdated = recentlyUpdatedImages.has(registrationId);
                        const photoUrl = resolvePhotoUrl(detail, cachedMember, isRecentlyUpdated);
                        if (photoUrl) {
                          return (
                            <>
                              <img
                                src={photoUrl}
                                alt="Member profile"
                                className="h-full w-full object-cover"
                                onError={(event) => {
                                  event.currentTarget.style.display = 'none';
                                }}
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="h-8 w-8 text-white" />
                              </div>
                            </>
                          );
                        }
                        return <Camera className="h-10 w-10 text-gray-400" />;
                      })()}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                      disabled={uploadingImage}
                    />
                    <p className="text-sm text-gray-600 mt-3">
                      {uploadingImage ? 'Updating...' : 'Click to update photo'}
                    </p>
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
        
        {/* Manual Registration Modal */}
        {selectedEventId && (
          <ManualRegistrationModal
            isOpen={showManualRegistration}
            onClose={() => setShowManualRegistration(false)}
            eventId={selectedEventId}
            event={events.find(e => e.id === parseInt(selectedEventId))}
            onSuccess={(data) => {
              setShowManualRegistration(false);
              fetchRegistrations(selectedEventId);
              toast.success('Registration created successfully!');
            }}
          />
        )}

        {/* Cancel Confirmation Modal */}
        <Modal title="Cancel Registration" isOpen={cancelConfirmationModal} onClose={closeCancelConfirmationModal} size="max-w-md">
          <div className="space-y-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Cancel Registration</h3>
              <p className="text-gray-600">
                Are you sure you want to cancel the registration for <span className="font-medium text-gray-900">{registrationToCancel?.memberName}</span>?
              </p>
              <p className="text-sm text-red-600 mt-2">This action cannot be undone.</p>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                onClick={closeCancelConfirmationModal}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                No, Keep Registration
              </button>
              <button
                onClick={confirmCancelRegistration}
                disabled={cancellingRegistrationId !== null}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed transition-colors"
              >
                {cancellingRegistrationId !== null ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin inline" /> Cancelling...
                  </>
                ) : (
                  'Yes, Cancel Registration'
                )}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  );
};

export default EventRegistrations;


