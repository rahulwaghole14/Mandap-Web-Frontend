// API wrapper utilities
const API_BASE_URL = window.CONFIG.API_BASE_URL;

// Development mode flag — set to false in production builds
const __DEV__ = (window.location.hostname === 'localhost' ||
                 window.location.hostname === '127.0.0.1' ||
                 window.location.protocol === 'file:');

window.api = {
    // --- Auth API ---
    logout: async () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                // Production-ready logout request
                const response = await fetch(`${window.CONFIG.API_BASE_URL}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                });

                const data = await response.json();
                if (data.success) {
                    console.log(data.message);
                }
            } catch (error) {
                console.error('[Logout API] Error:', error);
            }
        }

        // Securely clear all user-related data from local storage
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userName');
        localStorage.removeItem('userRole');

        // Redirect to login
        window.location.href = 'login.html';
    },

    // --- Event API ---
    getPublicEvent: async (eventId) => {
        const response = await fetch(`${API_BASE_URL}/events/${eventId}`);
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Event not found');
            }
            throw new Error('Failed to load event details');
        }
        const json = await response.json();
        return json.data || json.event || json;
    },

    checkPublicRegistrationStatus: async (eventId, phone) => {
        const token = localStorage.getItem('token');
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        // Endpoint matches React: /check-registration?phone=... (not /registration-status)
        const response = await fetch(
            `${API_BASE_URL}/events/${eventId}/check-registration?phone=${encodeURIComponent(phone)}`,
            { headers }
        );
        if (!response.ok) {
            throw new Error('Failed to verify registration status');
        }
        return await response.json();
    },

    initiatePublicRegistration: async (eventId, payload) => {
        // Correct endpoint: /public/events/{id}/register-payment
        const response = await fetch(`${API_BASE_URL}/public/events/${eventId}/register-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok) {
            throw { response: { data, status: response.status } };
        }
        return data;
    },

    createManualRegistration: async (eventId, payload) => {
        const token = localStorage.getItem('token');
        const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${API_BASE_URL}/events/${eventId}/manual-registration`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok) {
            throw { response: { data, status: response.status }, message: data.message || 'Registration failed' };
        }
        return data;
    },

    sendWhatsApp: async (eventId, registrationId) => {
        const token = localStorage.getItem('token');
        const headers = { 'Accept': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${API_BASE_URL}/events/${eventId}/registrations/${registrationId}/send-whatsapp`, {
            method: 'POST',
            headers: headers
        });
        const data = await response.json();
        if (!response.ok) {
            throw { response: { data, status: response.status }, message: data.message || 'Failed to send WhatsApp message' };
        }
        return data;
    },

    getMyRegistrations: async () => {
        const token = localStorage.getItem('token');
        const headers = { 'Accept': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${API_BASE_URL}/events/my-registrations`, {
            method: 'GET',
            headers: headers
        });
        const data = await response.json();
        if (!response.ok) {
            throw { response: { data, status: response.status }, message: data.message || 'Failed to fetch tickets' };
        }
        return data;
    },

    checkinByQr: async (qrCodeRef) => {
        const token = localStorage.getItem('token');
        const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${API_BASE_URL}/events/checkin`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ qr_code_ref: qrCodeRef })
        });
        const data = await response.json();
        if (!response.ok) {
            throw { response: { data, status: response.status }, message: data.message || 'Check-in failed' };
        }
        return data;
    },

    // SOURCE OF TRUTH (React ManualRegistrationModal.jsx L245):
    // Both the public form AND the admin manual registration form call the same
    // public endpoint: POST /public/events/{id}/register-payment
    // The admin flow does NOT use a separate authenticated order endpoint.
    initiateRazorpayManualRegistration: async (eventId, payload) => {
        const token = localStorage.getItem('token');
        // Send auth header if available, but not required by this public endpoint
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        if (__DEV__) {
            console.log('[Payment] Initiating Razorpay order via public endpoint for event:', eventId);
        }

        const response = await fetch(`${API_BASE_URL}/public/events/${eventId}/register-payment`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok) {
            throw { response: { data, status: response.status }, message: data.message || 'Order creation failed' };
        }

        if (__DEV__) {
            console.log('[Payment] Order created. Order ID:',
                data?.paymentOptions?.order_id ||
                data?.data?.paymentOptions?.order_id ||
                '(check response structure)');
        }

        return data;
    },

    // Confirm admin manual Razorpay payment
    confirmRazorpayManualPayment: async (payload) => {
        const token = localStorage.getItem('token');
        const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${API_BASE_URL}/payments/verify`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok) {
            throw { response: { data, status: response.status }, message: data.message || 'Confirmation failed' };
        }
        return data;
    },

    // Step 2 of the new 3-step Razorpay Flow: Create Payment Order
    createPaymentOrder: async (payload) => {
        const token = localStorage.getItem('token');
        const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${API_BASE_URL}/payments/order`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok) {
            throw { response: { data, status: response.status }, message: data.message || 'Order creation failed' };
        }
        return data;
    },

    initiatePayment: async (eventId, memberId = null) => {
        const token = localStorage.getItem('token');
        const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${API_BASE_URL}/events/${eventId}/register-payment`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ memberId })
        });
        const data = await response.json();
        if (!response.ok) {
            throw { response: { data, status: response.status }, message: data.message || 'Payment initiation failed' };
        }
        return data;
    },

    confirmPayment: async (eventId, paymentData, memberId = null) => {
        const token = localStorage.getItem('token');
        const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${API_BASE_URL}/events/${eventId}/public-registration/confirm`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ ...paymentData, memberId })
        });
        const data = await response.json();
        if (!response.ok) {
            throw { response: { data, status: response.status }, message: data.message || 'Payment confirmation failed' };
        }
        return data;
    },

    /**
     * Confirm payment with retry logic + exponential backoff.
     * Mirrors the React confirmPublicPayment implementation.
     *
     * BUG FIX (H1): Was posting to incorrect URL /events/{id}/public-registration/confirm.
     * Corrected to /public/events/{id}/confirm-payment to match React source of truth.
     *
     * Retries only on network errors (ECONNRESET, etc.) – not on 4xx/5xx.
     */
    confirmPublicPayment: async (eventId, payload, maxRetries = 5) => {
        const retryDelays = [2000, 3000, 5000, 7000, 10000];

        // BUG FIX (C3/H4): Validate all three required Razorpay fields before any network call.
        // Prevents silent 400 errors with no clear user feedback.
        const missingFields = [
            !payload?.razorpay_order_id   && 'razorpay_order_id',
            !payload?.razorpay_payment_id && 'razorpay_payment_id',
            !payload?.razorpay_signature  && 'razorpay_signature'
        ].filter(Boolean);

        if (missingFields.length > 0) {
            const msg = `Payment verification failed: missing fields from Razorpay response [${missingFields.join(', ')}]`;
            console.error('[Payment Confirmation] ❌', msg, '| Full payload:', {
                has_order_id:   !!payload?.razorpay_order_id,
                has_payment_id: !!payload?.razorpay_payment_id,
                has_signature:  !!payload?.razorpay_signature
            });
            throw new Error(msg);
        }

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            // Gate verbose logs behind isDev to avoid leaking payment IDs in production
            if (__DEV__) {
                console.log(`[Payment Confirmation] Attempt ${attempt + 1}/${maxRetries} for event ${eventId}`);
                console.log(`[Payment Confirmation] Payment ID: ${payload.razorpay_payment_id}`);
                console.log(`[Payment Confirmation] Order ID: ${payload.razorpay_order_id}`);
            } else {
                console.log(`[Payment Confirmation] Attempt ${attempt + 1}/${maxRetries}`);
            }

            try {
                // BUG FIX (H1): Corrected URL — was /events/{id}/public-registration/confirm
                const response = await fetch(
                    `${API_BASE_URL}/public/events/${eventId}/confirm-payment`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify(payload)
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    // 4xx/5xx are non-retryable – throw immediately
                    console.error(`[Payment Confirmation] ❌ Non-retryable HTTP ${response.status}:`, data?.message || 'Unknown error');
                    throw { response: { data, status: response.status } };
                }

                console.log(`[Payment Confirmation] ✅ Success on attempt ${attempt + 1}`);
                return data;

            } catch (error) {
                const isLastAttempt = attempt === maxRetries - 1;

                // Non-retryable: has an HTTP response (4xx/5xx already thrown above)
                if (error.response) {
                    throw error;
                }

                // Network-level error (TypeError: Failed to fetch, AbortError, etc.)
                const isNetworkError = error instanceof TypeError ||
                    error.name === 'AbortError' ||
                    error.name === 'NetworkError';

                console.error(`[Payment Confirmation] ❌ Attempt ${attempt + 1}/${maxRetries} failed:`, {
                    message: error.message,
                    isNetworkError,
                    isLastAttempt
                });

                if (isLastAttempt) {
                    console.error(`[Payment Confirmation] ❌ All ${maxRetries} attempts failed`);
                    throw error;
                }

                if (isNetworkError) {
                    const delay = retryDelays[attempt] || 10000;
                    console.log(`[Payment Confirmation] ⏳ Network error. Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }

                // Any other unknown error – don't retry
                throw error;
            }
        }

        throw new Error('Payment confirmation failed after all retries');
    },

    // Cancel registration (using smart cancel for automatic refund processing)
    cancelRegistration: async (eventId, registrationId, options = {}) => {
        const token = localStorage.getItem('token');
        const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const payload = {
            registration_id: registrationId,
            reason: options.reason || 'Admin cancellation',
            refund_speed: options.refundSpeed || 'optimum',
            refund_amount: options.refundAmount || 'full'
        };

        const response = await fetch(`${API_BASE_URL}/events/cancel`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        if (!response.ok) {
            throw { response: { data, status: response.status }, message: data.message || data.error || 'Cancellation failed' };
        }
        return data;
    },

    generatePdfFromElement: async (elementId) => {
        return new Promise((resolve, reject) => {
            const element = document.getElementById(elementId);
            if (!element) return reject(new Error('Ticket element not found for PDF generation'));
            
            // Fix for qrcode.js: html2canvas struggles with dynamically drawn canvases.
            // qrcode.js creates both a <canvas> and an <img src="data:...">.
            // We temporarily hide the canvas and show the image for PDF generation.
            const qrCanvas = element.querySelector('canvas');
            let qrImg = null;
            if (qrCanvas) {
                // Find the sibling image created by qrcode.js
                qrImg = qrCanvas.nextElementSibling;
                if (qrImg && qrImg.tagName === 'IMG') {
                    qrCanvas.style.display = 'none';
                    qrImg.style.display = 'block';
                }
            }

            const generate = () => {
                const opt = {
                    margin: 0.5,
                    filename: 'visitor-pass.pdf',
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2, useCORS: true },
                    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
                };
                html2pdf().set(opt).from(element).output('blob').then((blob) => {
                    // Revert display back to normal
                    if (qrCanvas && qrImg) {
                        qrCanvas.style.display = '';
                        qrImg.style.display = 'none';
                    }
                    resolve(blob);
                }).catch((err) => {
                    if (qrCanvas && qrImg) {
                        qrCanvas.style.display = '';
                        qrImg.style.display = 'none';
                    }
                    reject(err);
                });
            };

            if (window.html2pdf) {
                generate();
            } else {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
                script.onload = generate;
                script.onerror = () => reject(new Error('Failed to load PDF generation library'));
                document.head.appendChild(script);
            }
        });
    },

    generateProfessionalTicketPdf: async (ticketData) => {
        const { eventName, eventDate, eventVenue, memberName, registrationId, amount, paymentMethod, paymentStatus, qrRef, qrUrl } = ticketData;

        // ── Helper: generate QR data URL from qrRef using QRCode.js ─────────────
        const getQrDataUrl = () => new Promise((resolve) => {
            // If we already have a valid pre-captured data URI, convert to JPEG for jsPDF compatibility
            if (qrUrl && String(qrUrl).startsWith('data:')) {
                if (qrUrl.startsWith('data:image/jpeg')) {
                    return resolve(qrUrl); // already JPEG
                }
                // Convert PNG/other to JPEG via canvas
                const img = new Image();
                img.onload = () => {
                    const cvs = document.createElement('canvas');
                    cvs.width = img.width; cvs.height = img.height;
                    cvs.getContext('2d').drawImage(img, 0, 0);
                    resolve(cvs.toDataURL('image/jpeg', 1.0));
                };
                img.onerror = () => resolve(null);
                img.src = qrUrl;
                return;
            }

            const text = qrRef || qrUrl;
            if (!text || !window.QRCode) return resolve(null);

            // Render into a hidden temp div, grab the canvas, convert to PNG data URL
            const tmp = document.createElement('div');
            tmp.style.cssText = 'position:absolute;left:-9999px;top:0;';
            document.body.appendChild(tmp);

            try {
                new QRCode(tmp, {
                    text: String(text),
                    width: 200,
                    height: 200,
                    colorDark: '#000000',
                    colorLight: '#ffffff',
                    correctLevel: QRCode.CorrectLevel.H
                });
            } catch(e) {
                document.body.removeChild(tmp);
                return resolve(null);
            }

            // QRCode.js renders synchronously; give browser one tick to paint canvas pixels
            setTimeout(() => {
                try {
                    const canvas = tmp.querySelector('canvas');
                    const dataUrl = canvas ? canvas.toDataURL('image/jpeg', 1.0) : null;
                    document.body.removeChild(tmp);
                    console.log('[PDF QR] Generated fresh QR:', dataUrl ? 'YES (' + dataUrl.length + ' chars)' : 'NO');
                    resolve(dataUrl);
                } catch(e) {
                    if (document.body.contains(tmp)) document.body.removeChild(tmp);
                    console.warn('[PDF QR] toDataURL failed:', e);
                    resolve(null);
                }
            }, 200);
        });

        // ── Load jsPDF ───────────────────────────────────────────────────────────
        const loadJsPdf = () => new Promise((resolve, reject) => {
            if (window.jspdf && window.jspdf.jsPDF) return resolve(window.jspdf.jsPDF);
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script.onload = () => {
                if (window.jspdf && window.jspdf.jsPDF) resolve(window.jspdf.jsPDF);
                else reject(new Error('jsPDF not found after load'));
            };
            script.onerror = () => reject(new Error('Failed to load jsPDF'));
            document.head.appendChild(script);
        });

        // Run both in parallel to save time
        const [jsPDF, qrDataUrl] = await Promise.all([loadJsPdf(), getQrDataUrl()]);
        console.log('[PDF] qrDataUrl available:', !!qrDataUrl);

        const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
        const pageW = doc.internal.pageSize.getWidth();
        const margin = 15;
        const contentW = pageW - margin * 2;
        let y = margin;

        // ── Header bar ──────────────────────────────────────────
        doc.setFillColor(13, 148, 136);
        doc.rect(margin, y, contentW, 22, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(255, 255, 255);
        doc.text('EVENT ENTRY PASS', pageW / 2, y + 10, { align: 'center' });
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('Please present this pass at the entrance', pageW / 2, y + 17, { align: 'center' });
        y += 28;

        // ── Event name ──────────────────────────────────────────
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(15);
        doc.setTextColor(17, 24, 39);
        doc.text(eventName || 'Event', pageW / 2, y, { align: 'center' });
        y += 7;

        // ── Participant ─────────────────────────────────────────
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(107, 114, 128);
        doc.text('PARTICIPANT', pageW / 2, y, { align: 'center' });
        y += 5;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(31, 41, 55);
        doc.text(memberName || 'N/A', pageW / 2, y, { align: 'center' });
        y += 9;

        // ── Divider ─────────────────────────────────────────────
        doc.setDrawColor(200, 200, 200);
        doc.setLineDashPattern([2, 2], 0);
        doc.line(margin, y, margin + contentW, y);
        doc.setLineDashPattern([], 0);
        y += 7;

        // ── Info rows ───────────────────────────────────────────
        const addRow = (label, value, color) => {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(107, 114, 128);
            doc.text(label + ':', margin, y);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            if (color) doc.setTextColor(...color);
            else doc.setTextColor(17, 24, 39);
            doc.text(String(value || 'N/A'), margin + 45, y);
            y += 7;
        };

        if (eventDate) addRow('Date & Time', eventDate);
        if (eventVenue) addRow('Venue', eventVenue);
        addRow('Registration ID', '#' + String(registrationId || 'N/A').replace(/^#+/, ''));
        addRow('Amount', 'Rs. ' + (amount || '0'));
        addRow('Payment', (paymentStatus || 'Paid') + ' (' + (paymentMethod || 'Online') + ')', [5, 150, 105]);
        y += 4;

        // ── Second divider ──────────────────────────────────────
        doc.setDrawColor(200, 200, 200);
        doc.setLineDashPattern([2, 2], 0);
        doc.line(margin, y, margin + contentW, y);
        doc.setLineDashPattern([], 0);
        y += 8;

        // ── QR Code ─────────────────────────────────────────────
        if (qrDataUrl) {
            const qrSize = 50;
            const qrX = (pageW - qrSize) / 2;
            doc.addImage(qrDataUrl, 'JPEG', qrX, y, qrSize, qrSize);
            y += qrSize + 4;
        } else {
            doc.setFontSize(9);
            doc.setTextColor(200, 0, 0);
            doc.text('QR Code could not be generated', pageW / 2, y + 5, { align: 'center' });
            y += 12;
        }

        if (qrRef) {
            doc.setFont('courier', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.text(String(qrRef), pageW / 2, y, { align: 'center' });
            y += 8;
        }

        // ── Footer ───────────────────────────────────────────────
        const footerY = doc.internal.pageSize.getHeight() - 15;
        doc.setFillColor(243, 244, 246);
        doc.rect(margin, footerY - 5, contentW, 12, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175);
        doc.text('Electronically generated ticket. Keep the QR code safe.', pageW / 2, footerY + 2, { align: 'center' });

        return doc.output('blob');
    },

    // --- Association API ---
    getAssociationsByCity: async (city) => {
        const response = await fetch(`${API_BASE_URL}/associations/city/${city}`);
        if (!response.ok) {
            throw new Error('Failed to load associations');
        }
        return await response.json();
    },

    getAssociationById: async (id) => {
        const token = localStorage.getItem('token');
        const headers = { 'Accept': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${API_BASE_URL}/associations/${id}`, {
            headers: headers
        });
        if (!response.ok) {
            throw new Error('Failed to load association details');
        }
        return await response.json();
    },

    getAssociationMembers: async (associationId) => {
        const token = localStorage.getItem('token');
        const headers = { 'Accept': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${API_BASE_URL}/members/association/${associationId}`, {
            headers: headers
        });
        if (!response.ok) {
            throw new Error('Failed to load association members');
        }
        return await response.json();
    },

    getAssociationBOD: async (associationId) => {
        const token = localStorage.getItem('token');
        const headers = { 'Accept': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${API_BASE_URL}/bod/association/${associationId}`, {
            headers: headers
        });
        if (!response.ok) {
            throw new Error('Failed to load association BOD');
        }
        return await response.json();
    },

    updateAssociation: async (id, data) => {
        const token = localStorage.getItem('token');
        const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${API_BASE_URL}/associations/${id}`, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify(data)
        });

        return await response.json();
    },

    // --- Upload API ---
    optimizeImage: (file, options = {}) => {
        return new Promise((resolve, reject) => {
            const {
                maxWidth = 800,
                maxHeight = 800,
                quality = 0.85,
                maxSizeMB = 1,
            } = options;

            if (!file.type.startsWith('image/')) {
                resolve(file);
                return;
            }

            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            img.onload = () => {
                const originalWidth = img.width;
                const originalHeight = img.height;

                let width = originalWidth;
                let height = originalHeight;
                const needsResize = width > maxWidth || height > maxHeight;

                if (needsResize) {
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                    if (height > maxHeight) {
                        width = (width * maxHeight) / height;
                        height = maxHeight;
                    }
                }

                if (!needsResize && file.size <= maxSizeMB * 1024 * 1024) {
                    URL.revokeObjectURL(img.src);
                    resolve(file);
                    return;
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                URL.revokeObjectURL(img.src);

                const tryCompress = (currentQuality) => {
                    canvas.toBlob(
                        (blob) => {
                            if (!blob) {
                                reject(new Error('Image optimization failed'));
                                return;
                            }

                            const optimizedFile = new File([blob], file.name, {
                                type: file.type,
                                lastModified: Date.now(),
                            });

                            if (optimizedFile.size > maxSizeMB * 1024 * 1024 && currentQuality > 0.5) {
                                tryCompress(currentQuality - 0.1);
                            } else {
                                resolve(optimizedFile);
                            }
                        },
                        file.type,
                        currentQuality
                    );
                };

                tryCompress(quality);
            };

            img.onerror = () => {
                URL.revokeObjectURL(img.src);
                resolve(file);
            };

            img.src = URL.createObjectURL(file);
        });
    },

    uploadProfileImage: async (file) => {
        // Optimize image before upload (mirrors React's uploadApi.optimizeImage)
        let fileToUpload = file;
        try {
            fileToUpload = await window.api.optimizeImage(file, {
                maxWidth: 800,
                maxHeight: 800,
                quality: 0.85,
                maxSizeMB: 1
            });
            console.log(`[Upload] Image optimized: ${file.size} bytes → ${fileToUpload.size} bytes`);
        } catch (optimizeErr) {
            console.warn('[Upload] Image optimization failed, using original file:', optimizeErr);
            fileToUpload = file;
        }

        // Use Cloudinary if configured
        if (window.CONFIG.CLOUDINARY.USE_CLOUDINARY) {
            const formData = new FormData();
            formData.append('file', fileToUpload);
            formData.append('upload_preset', window.CONFIG.CLOUDINARY.UPLOAD_PRESET);
            formData.append('folder', 'mandap-profiles');
            formData.append('resource_type', 'auto');

            const response = await fetch(`https://api.cloudinary.com/v1_1/${window.CONFIG.CLOUDINARY.CLOUD_NAME}/upload`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Cloudinary upload failed');
            }

            const data = await response.json();
            return {
                success: true,
                url: data.secure_url,
                filename: data.public_id,
                image: data.secure_url,
            };
        } else {
            // Fallback to backend API upload
            const formData = new FormData();
            formData.append('image', fileToUpload);

            const token = localStorage.getItem('token');
            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${API_BASE_URL}/upload/profile-image`, {
                method: 'POST',
                headers,
                body: formData
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Upload failed');
            }

            const fileData = data.file || data || {};
            return {
                success: data.success ?? true,
                url: fileData.url || fileData.localUrl || null,
                filename: fileData.filename || null,
                image: fileData.url || fileData.localUrl || null,
            };
        }
    },

    getImageUrl: (filenameOrObject) => {
        let filename = null;
        let imageURL = null;

        if (typeof filenameOrObject === 'object' && filenameOrObject !== null) {
            imageURL = filenameOrObject.imageURL;
            filename = filenameOrObject.image;
        } else {
            filename = filenameOrObject;
        }

        if (imageURL && typeof imageURL === 'string' && imageURL.startsWith('http')) {
            return imageURL;
        }

        if (filename && typeof filename === 'string' && filename.startsWith('http')) {
            return filename;
        }

        if (!filename) return null;

        if (window.CONFIG.CLOUDINARY.USE_CLOUDINARY) {
            const hasFolder = filename.includes('/');
            const hasExtension = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(filename);

            if (hasFolder || !hasExtension) {
                const encodedFilename = encodeURIComponent(filename).replace(/%2F/g, '/');
                return `https://res.cloudinary.com/${window.CONFIG.CLOUDINARY.CLOUD_NAME}/image/upload/${encodedFilename}`;
            }

            const isLocalPath = filename.startsWith('./') || filename.includes('\\');
            if (!isLocalPath) {
                const encodedFilename = encodeURIComponent(filename).replace(/%2F/g, '/');
                return `https://res.cloudinary.com/${window.CONFIG.CLOUDINARY.CLOUD_NAME}/image/upload/${encodedFilename}`;
            }
        }

        const baseUrl = API_BASE_URL.replace('/api', '');
        const normalizePath = (value) => value.replace(/^\/+/, '').replace(/\\/g, '/');
        const encodePath = (value) => value.split('/').map(segment => encodeURIComponent(segment)).join('/');
        const normalized = normalizePath(filename);
        const [firstSegment] = normalized.split('/');

        const knownSubDirs = ['uploads', 'event-images', 'profile-images', 'business-images', 'gallery-images', 'documents', 'images', 'general'];
        if (firstSegment === 'uploads') {
            return `${baseUrl}/${encodePath(normalized)}`;
        }
        if (knownSubDirs.includes(firstSegment)) {
            return `${baseUrl}/uploads/${encodePath(normalized)}`;
        }
        return `${baseUrl}/uploads/event-images/${encodePath(normalized)}`;
    }
};
