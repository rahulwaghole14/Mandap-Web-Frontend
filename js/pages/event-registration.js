document.addEventListener('DOMContentLoaded', () => {
    // --- State ---
    let eventData = null;
    let resolvedEventId = null;
    let registration = null;
    let associations = [];
    let photoFile = null;
    let photoPreviewUrl = null;
    
    let isLoading = true;
    let isRegistering = false;
    let isCheckingStatus = false;
    let isPaymentConfirming = false; // Dedup guard: prevents double-confirmation if Razorpay fires handler twice
    
    // --- Elements ---
    const el = {
        mainContent: document.getElementById('main-content'),
        pageLoader: document.getElementById('page-loader'),
        pageError: document.getElementById('page-error'),
        pageErrorMsg: document.getElementById('page-error-msg'),
        
        // Event Info
        eventImageContainer: document.getElementById('event-image-container'),
        eventImage: document.getElementById('event-image'),
        eventImageFallback: document.getElementById('event-image-fallback'),
        eventTitle: document.getElementById('event-title'),
        eventDescription: document.getElementById('event-description'),
        postponedNotice: document.getElementById('postponed-notice'),
        postponedText: document.getElementById('postponed-text'),
        eventDate: document.getElementById('event-date'),
        timeContainer: document.getElementById('time-container'),
        eventTime: document.getElementById('event-time'),
        locationContainer: document.getElementById('location-container'),
        eventLocation: document.getElementById('event-location'),
        eventFee: document.getElementById('event-fee'),
        attendeesContainer: document.getElementById('attendees-container'),
        eventAttendees: document.getElementById('event-attendees'),
        
        // Registration Form
        registrationSection: document.getElementById('registration-section'),
        registrationForm: document.getElementById('registration-form'),
        statusChecking: document.getElementById('status-checking'),
        formError: document.getElementById('form-error'),
        formErrorText: document.getElementById('form-error-text'),
        
        name: document.getElementById('name'),
        phone: document.getElementById('phone'),
        email: document.getElementById('email'),
        businessName: document.getElementById('businessName'),
        businessType: document.getElementById('businessType'),
        city: document.getElementById('city'),
        associationId: document.getElementById('associationId'),
        assocLoading: document.getElementById('assoc-loading'),
        
        photoInput: document.getElementById('photo'),
        photoUploadUi: document.getElementById('photo-upload-ui'),
        photoPreviewUi: document.getElementById('photo-preview-ui'),
        photoPreviewImg: document.getElementById('photo-preview-img'),
        removePhotoBtn: document.getElementById('remove-photo-btn'),
        
        submitFeeDisplay: document.getElementById('submit-fee-display'),
        submitBtn: document.getElementById('submit-btn'),
        submitLoader: document.getElementById('submit-loader'),
        submitIcon: document.getElementById('submit-icon'),
        submitText: document.getElementById('submit-text'),
        
        // Success Section
        successSection: document.getElementById('success-section'),
        successPhotoContainer: document.getElementById('success-photo-container'),
        successPhoto: document.getElementById('success-photo'),
        whatsappSuccess: document.getElementById('whatsapp-success'),
        whatsappError: document.getElementById('whatsapp-error'),
        successName: document.getElementById('success-name'),
        successRegId: document.getElementById('success-reg-id'),
        successPaymentStatus: document.getElementById('success-payment-status'),
        successAmount: document.getElementById('success-amount'),
        successDate: document.getElementById('success-date'),
        
        qrSection: document.getElementById('qr-section'),
        qrImage: document.getElementById('qr-image'),
        downloadPassBtn: document.getElementById('download-pass-btn'),
        downloadLoader: document.getElementById('download-loader'),
        downloadIcon: document.getElementById('download-icon'),
        downloadText: document.getElementById('download-text'),
    };

    lucide.createIcons();

    // --- Helpers ---
    const showToast = (message, type = 'success') => {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        const bgColor = type === 'success' ? 'bg-green-500' : type === 'info' ? 'bg-blue-500' : 'bg-red-500';
        toast.className = `transform transition-all duration-300 translate-x-full opacity-0 flex items-center w-full max-w-xs p-4 space-x-3 text-white ${bgColor} rounded-lg shadow`;
        
        // Use textContent (not innerHTML) for message to prevent XSS from server error strings
        const msgDiv = document.createElement('div');
        msgDiv.className = 'text-sm font-normal flex-1';
        msgDiv.textContent = message;
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'ml-auto -mx-1.5 -my-1.5 rounded-lg focus:ring-2 focus:ring-white p-1.5 inline-flex h-8 w-8 text-white hover:text-gray-200';
        closeBtn.innerHTML = '<i data-lucide="x" class="w-5 h-5"></i>';
        closeBtn.addEventListener('click', () => toast.remove());
        
        toast.appendChild(msgDiv);
        toast.appendChild(closeBtn);
        container.appendChild(toast);
        lucide.createIcons();
        requestAnimationFrame(() => {
            toast.classList.remove('translate-x-full', 'opacity-0');
            toast.classList.add('translate-x-0', 'opacity-100');
        });
        setTimeout(() => {
            toast.classList.remove('translate-x-0', 'opacity-100');
            toast.classList.add('translate-x-full', 'opacity-0');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    };

    const formatDateTime = (dateTimeStr) => {
        if (!dateTimeStr) return '-';
        try {
            const date = new Date(dateTimeStr);
            return date.toLocaleString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
        } catch (err) {
            return dateTimeStr;
        }
    };

    const parseDateList = (value) => {
        if (!value) return [];
        const values = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [value];
        return values.map(item => {
            if (!item) return null;
            const d = new Date(item);
            return isNaN(d.getTime()) ? null : d;
        }).filter(Boolean);
    };

    const formatEventDates = (startValue, endValue) => {
        const datesFromStart = parseDateList(startValue);
        const datesFromEnd = parseDateList(endValue);
        let dates = [...datesFromStart, ...datesFromEnd];

        if (dates.length === 0) return '-';

        dates = dates.sort((a, b) => a.getTime() - b.getTime());
        
        const first = dates[0];
        const last = dates[dates.length - 1];
        
        if (first.getTime() === last.getTime()) {
            return first.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
        }
        
        return `${first.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} to ${last.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}`;
    };

    const formatTimeOnly = (value) => {
        if (!value) return null;
        if (Array.isArray(value)) return formatTimeOnly(value[0]);
        if (typeof value === 'string' && value.includes(',')) return formatTimeOnly(value.split(',')[0]);
        
        if (typeof value === 'string') {
            const trimmed = value.trim();
            if (!trimmed) return null;
            if (/^\\d{4}-\\d{2}-\\d{2}$/.test(trimmed)) return null;
            const timeOnlyMatch = trimmed.match(/^([01]?\\d|2[0-3]):[0-5]\\d(:[0-5]\\d)?$/);
            if (timeOnlyMatch) {
                const [hh, mm] = trimmed.split(':');
                const date = new Date();
                date.setHours(Number(hh), Number(mm), 0, 0);
                return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
            }
        }
        const date = new Date(value);
        if (isNaN(date.getTime())) return null;
        return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const validateForm = () => {
        const errors = [];
        
        const nameVal = el.name.value.trim();
        if (nameVal.length < 2) {
            errors.push('Name must be at least 2 characters');
            el.name.classList.add('border-red-500');
            document.getElementById('name-error').classList.remove('hidden');
        } else {
            el.name.classList.remove('border-red-500');
            document.getElementById('name-error').classList.add('hidden');
        }
        
        const phoneVal = el.phone.value;
        if (phoneVal.length !== 10) {
            errors.push('Phone must be exactly 10 digits');
            el.phone.classList.add('border-red-500');
            document.getElementById('phone-error').classList.remove('hidden');
        } else {
            el.phone.classList.remove('border-red-500');
            document.getElementById('phone-error').classList.add('hidden');
        }
        
        const emailVal = el.email.value.trim();
        if (emailVal && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$/i.test(emailVal)) {
            errors.push('Invalid email address');
            el.email.classList.add('border-red-500');
            document.getElementById('email-error').classList.remove('hidden');
        } else {
            el.email.classList.remove('border-red-500');
            document.getElementById('email-error').classList.add('hidden');
        }
        
        const businessNameVal = el.businessName.value.trim();
        if (businessNameVal.length < 2) {
            errors.push('Business name must be at least 2 characters');
            el.businessName.classList.add('border-red-500');
            document.getElementById('businessName-error').classList.remove('hidden');
        } else {
            el.businessName.classList.remove('border-red-500');
            document.getElementById('businessName-error').classList.add('hidden');
        }
        
        const businessTypeVal = el.businessType.value;
        if (!businessTypeVal) {
            errors.push('Business type is required');
            el.businessType.classList.add('border-red-500');
            document.getElementById('businessType-error').classList.remove('hidden');
        } else {
            el.businessType.classList.remove('border-red-500');
            document.getElementById('businessType-error').classList.add('hidden');
        }
        
        if (!photoFile) {
            errors.push('Profile photo is required');
            document.getElementById('photo-dropzone').classList.add('border-red-500');
            document.getElementById('photo-error').classList.remove('hidden');
        } else {
            document.getElementById('photo-dropzone').classList.remove('border-red-500');
            document.getElementById('photo-error').classList.add('hidden');
        }

        return errors;
    };

    // --- Core Logic ---
    const init = async () => {
        const urlParams = new URLSearchParams(window.location.search);
        let slug = urlParams.get('slug');
        
        // Fallback for demo purposes if no slug is provided
        if (!slug) {
            slug = 'annual-decorators-expo-2026';
        }

        const normalizedSlug = slug.toLowerCase();
        resolvedEventId = window.CONFIG.EVENT_SLUGS[normalizedSlug] || window.CONFIG.EVENT_SLUGS[slug] || (isNaN(slug) ? null : slug);

        if (!resolvedEventId) {
            showError(`Event not found for "${slug}". Please check the URL.`);
            return;
        }

        try {
            eventData = await window.api.getPublicEvent(resolvedEventId);
            eventData = eventData.event || eventData; // Handle both wrapper and direct object
            renderEventDetails();
            isLoading = false; // Clear loading flag after successful load
            el.pageLoader.classList.add('hidden');
            el.mainContent.classList.remove('hidden');
        } catch (error) {
            showError(error.message || 'Failed to load event details');
        }
    };

    const showError = (msg) => {
        el.pageLoader.classList.add('hidden');
        el.mainContent.classList.add('hidden');
        el.pageError.classList.remove('hidden');
        el.pageErrorMsg.textContent = msg;
    };

    const renderEventDetails = () => {
        // Image
        let imgUrl = null;
        if (eventData.image || eventData.imageURL) {
            imgUrl = window.api.getImageUrl(eventData);
        }
        
        // Special case for Kolhapur image like in React (optional logic)
        if (!imgUrl && String(resolvedEventId) === '33') {
            imgUrl = 'assets/images/kolhapur-event.png'; // Make sure this asset exists or just let it fallback
        }

        el.eventImageContainer.classList.remove('hidden');
        if (imgUrl) {
            el.eventImage.src = imgUrl;
            el.eventImage.onerror = () => {
                el.eventImage.classList.add('hidden');
                el.eventImageFallback.classList.remove('hidden');
            };
        } else {
            el.eventImage.classList.add('hidden');
            el.eventImageFallback.classList.remove('hidden');
        }

        // Details
        el.eventTitle.textContent = eventData.title || eventData.name;
        
        if (eventData.description) {
            el.eventDescription.textContent = eventData.description;
            el.eventDescription.classList.remove('hidden');
        }

        // Postponed Logic
        const isKolhapurEvent = eventData.city?.toLowerCase() === 'kolhapur' && 
                               (eventData.name?.toLowerCase().includes('expo') || 
                                eventData.title?.toLowerCase().includes('expo'));
        
        let isPostponed = eventData.status === 'Postponed';
        if (isKolhapurEvent && eventData.startDate) {
            const eventDate = new Date(eventData.startDate);
            const newDate = new Date('2026-03-15');
            if (eventDate >= newDate) isPostponed = true;
        }

        if (isPostponed) {
            const originalDate = isKolhapurEvent ? '2026-01-15' : 'Unknown Date';
            const originalStr = new Date(originalDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            const newStr = eventData.startDate ? new Date(eventData.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown Date';
            el.postponedText.textContent = `⚠️ Update: This event was originally scheduled for ${originalStr} and has been rescheduled to ${newStr}. Updated schedule available.`;
            el.postponedNotice.classList.remove('hidden');
        }

        // Date, Time, Location, Fee
        el.eventDate.textContent = formatEventDates(eventData.startDateTime || eventData.startDate, eventData.endDateTime || eventData.endDate);
        
        const startTimeLabel = formatTimeOnly(eventData.startTime || eventData.startDateTime || eventData.startDate);
        const endTimeLabel = formatTimeOnly(eventData.endTime || eventData.endDateTime || eventData.endDate);
        if (startTimeLabel || endTimeLabel) {
            el.eventTime.textContent = `${startTimeLabel || '-'} to ${endTimeLabel || '-'}`;
            el.timeContainer.classList.remove('hidden');
        }

        if (eventData.address) {
            let addr = eventData.address;
            if (eventData.city) addr += `, ${eventData.city}`;
            if (eventData.district) addr += `, ${eventData.district}`;
            if (eventData.state) addr += `, ${eventData.state}`;
            if (eventData.pincode) addr += ` ${eventData.pincode}`;
            el.eventLocation.textContent = addr;
            el.locationContainer.classList.remove('hidden');
        }

        const fee = parseFloat(eventData.registrationFee ?? eventData.fee) || 0;
        const isFree = fee === 0;
        el.eventFee.textContent = isFree ? 'Free' : `₹ ${fee.toFixed(2)}`;
        
        if (isFree) {
            el.submitFeeDisplay.textContent = 'Free';
            el.submitFeeDisplay.classList.add('text-green-600', 'font-bold');
            el.submitText.textContent = 'Register Now (Free)';
            el.submitIcon.classList.add('hidden');
        } else {
            el.submitFeeDisplay.textContent = `₹ ${fee.toFixed(2)}`;
            el.submitText.textContent = `Register & Pay ₹${fee.toFixed(2)}`;
        }

        if (eventData.currentAttendees !== undefined && eventData.maxAttendees) {
            el.eventAttendees.textContent = `${eventData.currentAttendees} / ${eventData.maxAttendees}`;
            el.attendeesContainer.classList.remove('hidden');
        }
    };

    const checkRegistrationStatus = async (phone) => {
        if (phone.length !== 10) return;
        
        el.statusChecking.classList.remove('hidden');
        isCheckingStatus = true;
        updateSubmitButtonState();
        
        try {
            const data = await window.api.checkPublicRegistrationStatus(resolvedEventId, phone);
            
            if (data.isRegistered) {
                registration = {
                    ...data.registration,
                    qrDataURL: data.qrDataURL || data.registration?.qrDataURL,
                    qrCode: data.qrCode || data.registration?.qrCode,
                    qrCodeUrl: data.qrCodeUrl || data.registration?.qrCodeUrl,
                    qrCodeDataURL: data.qrCodeDataURL || data.registration?.qrCodeDataURL,
                    qrToken: data.qrToken || data.registration?.qrToken,
                    memberName: data.memberName || data.registration?.memberName || data.registration?.member?.name || data.registration?.name,
                    member: data.member
                };
                
                showToast('You are already registered for this event!');
                showSuccessSection(false, false);
            }
        } catch (error) {
            console.error('Status check error:', error);
        } finally {
            el.statusChecking.classList.add('hidden');
            isCheckingStatus = false;
            updateSubmitButtonState();
        }
    };

    const fetchAssociations = async (city) => {
        if (!city || city.length < 2) {
            associations = [];
            el.associationId.innerHTML = '<option value="">Enter city to view associations (optional)</option>';
            el.associationId.disabled = true;
            return;
        }

        el.assocLoading.classList.remove('hidden');
        el.associationId.classList.add('hidden');
        
        try {
            const data = await window.api.getAssociationsByCity(city);
            associations = data.associations || [];
            
            el.associationId.innerHTML = associations.length === 0 
                ? '<option value="">No associations found for this city</option>' 
                : '<option value="">Select association (optional)</option>';
                
            associations.forEach(assoc => {
                const opt = document.createElement('option');
                opt.value = assoc.id;
                opt.textContent = assoc.name;
                el.associationId.appendChild(opt);
            });
            
            el.associationId.disabled = associations.length === 0;
        } catch (error) {
            console.error('Fetch associations error:', error);
            associations = [];
            el.associationId.innerHTML = '<option value="">Failed to load associations</option>';
            el.associationId.disabled = true;
        } finally {
            el.assocLoading.classList.add('hidden');
            el.associationId.classList.remove('hidden');
        }
    };

    const updateSubmitButtonState = () => {
        const disabled = isRegistering || isCheckingStatus || registration;
        el.submitBtn.disabled = disabled;
        
        if (disabled && !isRegistering && !isCheckingStatus) {
            el.submitBtn.classList.replace('bg-primary-600', 'bg-primary-400');
            el.submitBtn.classList.remove('hover:bg-primary-700', 'hover:shadow-xl');
            el.submitBtn.style.cursor = 'not-allowed';
        } else if (!disabled) {
            el.submitBtn.classList.replace('bg-primary-400', 'bg-primary-600');
            el.submitBtn.classList.add('hover:bg-primary-700', 'hover:shadow-xl');
            el.submitBtn.style.cursor = 'pointer';
        }
    };

    const showSuccessSection = (isNewRegistration = false, willSendWhatsApp = false) => {
        el.registrationSection.classList.add('hidden');
        el.successSection.classList.remove('hidden');

        // Populate Success Data
        el.successName.textContent = registration.memberName || registration.member?.name || registration.name || '';
        el.successRegId.textContent = `#${registration.id || registration.registrationId}`;
        el.successPaymentStatus.textContent = registration.paymentStatus || 'Paid';
        el.successAmount.textContent = `₹ ${parseFloat(registration.amountPaid) || 0}`;
        el.successDate.textContent = formatDateTime(registration.registeredAt);

        // Member Photo
        let photoUrl = registration.photo || registration.photoUrl || registration.profileImageURL || registration.member?.profileImageURL;
        if (photoUrl) {
            el.successPhoto.src = window.api.getImageUrl(photoUrl);
            el.successPhotoContainer.classList.remove('hidden');
            el.successPhoto.onerror = () => {
                el.successPhoto.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><rect width="256" height="256" rx="60" fill="%23f3f4f6"/><circle cx="128" cy="96" r="60" fill="%23d1d5db"/><path d="M56 220c0-46 36-84 72-84s72 38 72 84" fill="%239ca3af"/></svg>';
            };
        }

        // WhatsApp notice
        if (isNewRegistration && willSendWhatsApp) {
            el.whatsappSuccess.classList.remove('hidden');
        }

        // QR Code
        const qrUrl = registration.qrDataURL || registration.qrCode || registration.qrCodeUrl || registration.qrCodeDataURL;
        const token = registration.qrToken || registration.qr_code_ref || registration.id;
        
        if (qrUrl) {
            el.qrSection.classList.remove('hidden');
            const qrImageEl = document.getElementById('qr-image');
            if (qrImageEl) {
                qrImageEl.src = qrUrl;
                qrImageEl.classList.remove('hidden');
                
                // Hide local container if we created it previously
                const qrContainer = document.getElementById('qr-code-container');
                if (qrContainer) qrContainer.classList.add('hidden');
            }
        } else if (token) {
            el.qrSection.classList.remove('hidden');
            
            // Try to find the new container, or fallback to inserting before the image
            let qrContainer = document.getElementById('qr-code-container');
            const qrImageEl = document.getElementById('qr-image');
            
            if (!qrContainer && qrImageEl) {
                qrContainer = document.createElement('div');
                qrContainer.id = 'qr-code-container';
                qrContainer.className = 'w-48 h-48 flex items-center justify-center';
                qrImageEl.parentNode.insertBefore(qrContainer, qrImageEl);
                qrImageEl.classList.add('hidden');
            }
            
            if (qrContainer) {
                qrContainer.innerHTML = ''; // Clear previous
                qrContainer.classList.remove('hidden');
                try {
                    new QRCode(qrContainer, {
                        text: String(token),
                        width: 176, // 44 * 4 to fit in w-48 with some padding
                        height: 176,
                        colorDark: "#000000",
                        colorLight: "#ffffff",
                        correctLevel: QRCode.CorrectLevel.H
                    });
                } catch (e) {
                    console.error('QR Generation failed:', e);
                    qrContainer.innerHTML = '<span class="text-sm text-red-500">Failed to generate QR</span>';
                }
            } else if (qrImageEl) {
                // Absolute fallback just in case
                qrImageEl.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(token)}`;
                qrImageEl.classList.remove('hidden');
            }
        }
    };

    // --- Event Listeners ---
    
    el.phone.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\\D/g, '').slice(0, 10);
    });

    let phoneTimeout;
    el.phone.addEventListener('blur', (e) => {
        clearTimeout(phoneTimeout);
        phoneTimeout = setTimeout(() => {
            if (e.target.value.length === 10) checkRegistrationStatus(e.target.value);
        }, 300);
    });

    let cityTimeout;
    el.city.addEventListener('input', (e) => {
        clearTimeout(cityTimeout);
        cityTimeout = setTimeout(() => {
            fetchAssociations(e.target.value.trim());
        }, 500);
    });

    el.photoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 30 * 1024 * 1024) {
            showToast('Image is too large. Please choose an image smaller than 30MB.', 'error');
            e.target.value = '';
            return;
        }

        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            showToast('Invalid file type. Please upload an image.', 'error');
            e.target.value = '';
            return;
        }

        photoFile = file;
        document.getElementById('photo-error').classList.add('hidden');
        document.getElementById('photo-dropzone').classList.remove('border-red-500');

        const reader = new FileReader();
        reader.onload = (ev) => {
            photoPreviewUrl = ev.target.result;
            el.photoPreviewImg.src = photoPreviewUrl;
            el.photoUploadUi.classList.add('hidden');
            el.photoPreviewUi.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    });

    el.removePhotoBtn.addEventListener('click', () => {
        photoFile = null;
        photoPreviewUrl = null;
        el.photoInput.value = '';
        el.photoUploadUi.classList.remove('hidden');
        el.photoPreviewUi.classList.add('hidden');
    });

    el.registrationForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const errors = validateForm();
        if (errors.length > 0) {
            el.formError.classList.remove('hidden');
            el.formErrorText.textContent = errors.join(', ');
            showToast('Please fix the errors in the form', 'error');
            return;
        }
        
        el.formError.classList.add('hidden');
        
        isRegistering = true;
        updateSubmitButtonState();
        el.submitLoader.classList.remove('hidden');
        el.submitText.textContent = 'Processing...';

        try {
            // 1. Upload Photo
            let photoUrl = null;
            if (photoFile) {
                const uploadResult = await window.api.uploadProfileImage(photoFile);
                photoUrl = uploadResult.url || uploadResult.image || uploadResult.filename;
            }

            // 2. Prepare Payload
            const payload = {
                name: el.name.value.trim(),
                phone: el.phone.value,
                email: el.email.value.trim() || null,
                businessName: el.businessName.value.trim(),
                businessType: el.businessType.value,
                city: el.city.value.trim() || null,
                associationId: el.associationId.value ? parseInt(el.associationId.value, 10) : null,
                photo: photoUrl
            };

            // 3. Initiate Registration
            const paymentData = await window.api.initiatePublicRegistration(resolvedEventId, payload);
            
            const fee = parseFloat(eventData.registrationFee ?? eventData.fee) || 0;
            const isFree = fee === 0 || paymentData.isFree;

            if (isFree) {
                registration = {
                    ...paymentData.registration,
                    // Capture all QR code variants (matches paid-event path)
                    qrDataURL: paymentData.qrDataURL || paymentData.registration?.qrDataURL,
                    qrCode: paymentData.qrCode || paymentData.registration?.qrCode,
                    qrCodeUrl: paymentData.qrCodeUrl || paymentData.registration?.qrCodeUrl,
                    qrCodeDataURL: paymentData.qrCodeDataURL || paymentData.registration?.qrCodeDataURL,
                    qrToken: paymentData.qrToken || paymentData.registration?.qrToken,
                    memberName: paymentData.memberName ||
                                paymentData.registration?.memberName ||
                                paymentData.registration?.member?.name ||
                                paymentData.registration?.name ||
                                payload.name,
                    phone: el.phone.value || paymentData.member?.phone || paymentData.registration?.phone,
                    member: paymentData.member || paymentData.registration?.member,
                    photo: photoUrl
                };
                showToast('Registration successful! Your visitor pass will be sent to your WhatsApp shortly.');
                showSuccessSection(true, true);
                return;
            }

            // 4. Handle Razorpay Payment
            if (typeof window.Razorpay === 'undefined') {
                throw new Error('Payment gateway not loaded. Please refresh the page.');
            }

            let pOpts = paymentData.paymentOptions || {};
            // Inject configured fallback key if backend doesn't provide one
            if (!pOpts.key && window.CONFIG?.RAZORPAY?.KEY_ID) {
                pOpts.key = window.CONFIG.RAZORPAY.KEY_ID;
            }

            const options = {
                ...pOpts,
                handler: async function (response) {
                    // --- Dedup guard (mirrors React's paymentConfirmingRef) ---
                    if (isPaymentConfirming) {
                        console.warn('[Payment] Confirmation already in progress – ignoring duplicate Razorpay callback');
                        return;
                    }
                    isPaymentConfirming = true;

                    try {
                        // Step A: Attempt to confirm payment with retry + backoff
                        let confirmData = null;
                        let paymentConfirmed = false;

                        try {
                            console.log('[Payment] Starting confirmation...');
                            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') {
                                console.log('[Payment] Razorpay response received:', {
                                    has_order_id:   !!response.razorpay_order_id,
                                    has_payment_id: !!response.razorpay_payment_id,
                                    has_signature:  !!response.razorpay_signature
                                });
                            }

                            // BUG FIX (H4/C3): Validate all three Razorpay response fields before calling backend.
                            // Missing fields cause a silent 400 error; this gives a clear user message instead.
                            const rzpMissing = [
                                !response.razorpay_order_id   && 'razorpay_order_id',
                                !response.razorpay_payment_id && 'razorpay_payment_id',
                                !response.razorpay_signature  && 'razorpay_signature'
                            ].filter(Boolean);
                            if (rzpMissing.length > 0) {
                                throw new Error(`Payment gateway returned an incomplete response. Missing: ${rzpMissing.join(', ')}. Please try again.`);
                            }

                            confirmData = await window.api.confirmPublicPayment(resolvedEventId, {
                                // BUG FIX (C4): Null-safe access — paymentData.member could be undefined
                                // if backend doesn't return it. Using ?. prevents a hard TypeError crash.
                                memberId: paymentData.member?.id ?? null,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            });
                            paymentConfirmed = true;
                            console.log('[Payment] Confirmed successfully');

                        } catch (confirmError) {
                            // Retry logic exhausted in api.confirmPublicPayment.
                            // Network errors may still have succeeded on the server.
                            console.error('[Payment] Confirmation failed after retries:', confirmError);

                            const isAlreadyProcessed = confirmError.message?.includes('already processed') || 
                                                       confirmError.response?.data?.message?.includes('already processed');

                            const isNetworkError = confirmError instanceof TypeError ||
                                                   confirmError.name === 'AbortError' ||
                                                   confirmError.name === 'NetworkError';

                            if (isNetworkError || isAlreadyProcessed) {
                                // Payment may have succeeded on server (or already processed), poll to verify
                                showToast('Verifying registration status…', 'info');
                                console.warn('[Payment] Polling registration status to verify payment...');

                                const maxPollAttempts = 6;
                                const pollInterval = 2000;
                                let registrationFound = false;

                                for (let attempt = 1; attempt <= maxPollAttempts; attempt++) {
                                    console.log(`[Payment] Polling attempt ${attempt}/${maxPollAttempts}...`);
                                    await new Promise(resolve => setTimeout(resolve, pollInterval));

                                    try {
                                        const statusData = await window.api.checkPublicRegistrationStatus(
                                            resolvedEventId,
                                            el.phone.value
                                        );

                                        const pStatus = statusData.registration?.paymentStatus || statusData.registration?.payment_status;
                                        const isPaid = pStatus && ['paid', 'success'].includes(pStatus.toLowerCase());

                                        if (statusData.isRegistered && isPaid) {
                                            console.log('[Payment] Registration confirmed via polling!');
                                            registrationFound = true;
                                            confirmData = {
                                                success: true,
                                                message: 'Registration confirmed',
                                                registrationId: statusData.registration.id,
                                                qrDataURL: statusData.registration.qrDataURL,
                                                registration: statusData.registration,
                                                member: statusData.member || paymentData.member
                                            };
                                            paymentConfirmed = true;
                                            break;
                                        }
                                    } catch (pollError) {
                                        console.error(`[Payment] Poll attempt ${attempt} failed:`, pollError);
                                    }
                                }

                                if (!registrationFound) {
                                    throw new Error(
                                        'Payment was successful, but we could not verify the registration. ' +
                                        'Please check your registration status or contact support.'
                                    );
                                }
                            } else {
                                // Non-network error (server-side 4xx/5xx) – rethrow
                                throw confirmError;
                            }
                        }

                        if (!confirmData || !paymentConfirmed) {
                            throw new Error('Payment confirmation failed');
                        }

                        // Step B: Build registration object
                        registration = {
                            ...confirmData.registration,
                            qrDataURL: confirmData.qrDataURL || confirmData.registration?.qrDataURL,
                            qrCode: confirmData.qrCode || confirmData.registration?.qrCode,
                            qrCodeUrl: confirmData.qrCodeUrl || confirmData.registration?.qrCodeUrl,
                            qrCodeDataURL: confirmData.qrCodeDataURL || confirmData.registration?.qrCodeDataURL,
                            qrToken: confirmData.qrToken || confirmData.registration?.qrToken,
                            memberName: confirmData.memberName ||
                                        confirmData.registration?.memberName ||
                                        confirmData.registration?.member?.name ||
                                        confirmData.registration?.name ||
                                        payload.name,
                            phone: el.phone.value ||
                                   confirmData.member?.phone ||
                                   confirmData.registration?.phone ||
                                   paymentData.member?.phone,
                            member: confirmData.member || confirmData.registration?.member || paymentData.member,
                            photo: photoUrl
                        };

                        const willSendWhatsApp = confirmData.shouldSendWhatsApp !== false;
                        showToast(
                            willSendWhatsApp
                                ? 'Registration successful! Your visitor pass will be sent to your WhatsApp shortly.'
                                : 'Registration confirmed. You can download your pass now.'
                        );
                        showSuccessSection(true, willSendWhatsApp);

                    } catch (err) {
                        console.error('[Payment] Confirmation error:', err);
                        showToast(err.response?.data?.message || err.message || 'Payment confirmation failed', 'error');
                    } finally {
                        isRegistering = false;
                        isPaymentConfirming = false; // Always reset dedup flag
                        updateSubmitButtonState();
                        el.submitLoader.classList.add('hidden');
                        el.submitText.textContent = `Register & Pay ₹${fee.toFixed(2)}`;
                    }
                },
                modal: {
                    ondismiss: function () {
                        console.log('[Payment] Modal dismissed by user');
                        isRegistering = false;
                        isPaymentConfirming = false; // Reset dedup flag on cancel
                        updateSubmitButtonState();
                        el.submitLoader.classList.add('hidden');
                        el.submitText.textContent = `Register & Pay ₹${fee.toFixed(2)}`;
                    }
                }
            };

            const rzp = new window.Razorpay(options);

            // BUG FIX (L3): Register payment.failed BEFORE rzp.open() for reliable event delivery.
            rzp.on('payment.failed', function (failResponse) {
                console.error('[Payment] Failed:', failResponse.error?.description || failResponse);
                const reason = failResponse.error?.description || failResponse.error?.reason || 'Payment failed';
                showToast(`Payment failed: ${reason}. Please try again.`, 'error');
                isRegistering = false;
                isPaymentConfirming = false; // Reset dedup flag on failure
                updateSubmitButtonState();
                el.submitLoader.classList.add('hidden');
                el.submitText.textContent = `Register & Pay ₹${fee.toFixed(2)}`;
            });

            rzp.open();

        } catch (error) {
            console.error('Registration error:', error);
            const msg = error.response?.data?.message || error.message || 'Registration failed';
            el.formError.classList.remove('hidden');
            el.formErrorText.textContent = msg;
            showToast(msg, 'error');
            
            isRegistering = false;
            updateSubmitButtonState();
            el.submitLoader.classList.add('hidden');
            const fee = parseFloat(eventData.registrationFee ?? eventData.fee) || 0;
            el.submitText.textContent = fee === 0 ? 'Register Now (Free)' : `Register & Pay ₹${fee.toFixed(2)}`;
        }
    });

    let isDownloading = false;
    el.downloadPassBtn.addEventListener('click', async () => {
        if (!registration || !resolvedEventId || isDownloading) return;
        
        isDownloading = true;
        el.downloadPassBtn.classList.add('opacity-75', 'cursor-not-allowed');
        el.downloadLoader.classList.remove('hidden');
        el.downloadIcon.classList.add('hidden');
        el.downloadText.textContent = 'Generating Pass...';

        try {
            const regId = registration.id || registration.registrationId;
            
            let pdfBlob;
            if (window.api.generateProfessionalTicketPdf) {
                const qrUrl = registration.qrDataURL || registration.qrCode || registration.qrCodeUrl || registration.qrCodeDataURL;
                const qrRef = registration.qrToken || registration.qr_code_ref || registration.id;
                
                pdfBlob = await window.api.generateProfessionalTicketPdf({
                    eventName: eventData?.title || eventData?.name || 'Event',
                    eventDate: eventData?.date || eventData?.start_date || '',
                    eventVenue: eventData?.venue || eventData?.location || '',
                    memberName: registration.memberName || registration.member?.name || registration.name || 'Participant',
                    registrationId: regId,
                    amount: parseFloat(registration.amountPaid || fee) || 0,
                    paymentMethod: registration.paymentMethod || (fee === 0 ? 'Free' : 'Online'),
                    paymentStatus: registration.paymentStatus || 'Paid',
                    qrRef: qrRef,
                    qrUrl: qrUrl
                });
            } else {
                pdfBlob = await window.api.generatePdfFromElement('success-screen');
            }
            
            const url = window.URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `mandapam-visitor-pass-${regId}.pdf`;
            document.body.appendChild(link);
            link.click();
            
            setTimeout(() => {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }, 100);
            
            showToast('Pass downloaded successfully');
        } catch (error) {
            console.error('Download error:', error);
            showToast('Could not download the pass. Please try again.', 'error');
        } finally {
            isDownloading = false;
            el.downloadPassBtn.classList.remove('opacity-75', 'cursor-not-allowed');
            el.downloadLoader.classList.add('hidden');
            el.downloadIcon.classList.remove('hidden');
            el.downloadText.textContent = 'Download Pass (PDF)';
        }
    });

    // Start
    init();
});
