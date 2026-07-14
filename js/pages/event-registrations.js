document.addEventListener('DOMContentLoaded', () => {
    // ── Auth ─────────────────────────────────────────────────────────────────
    const token = localStorage.getItem('token');
    const user  = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token) { window.location.href = 'login.html'; return; }

    const userNameEl = document.getElementById('user-name');
    if (userNameEl && user.name) userNameEl.textContent = user.name;

    // ── Logout ────────────────────────────────────────────────────────────────
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            const API_BASE = window.CONFIG.API_BASE_URL;
            try {
                await fetch(`${API_BASE}/auth/logout`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                });
            } catch (e) { console.error('[Logout] Error:', e); }
            ['token','refreshToken','user','userEmail','userName','userRole'].forEach(k => localStorage.removeItem(k));
            window.location.href = 'login.html';
        });
    }

    // ── State ─────────────────────────────────────────────────────────────────
    const API_BASE = window.CONFIG.API_BASE_URL;
    let allRegistrations = [];
    let filteredRegistrations = [];
    let allLoadedEvents = [];
    let allAssociationsList = [];
    let currentPage = 1;
    const itemsPerPage = 10;

    // ── DOM refs ──────────────────────────────────────────────────────────────
    const tableBody      = document.getElementById('registrations-table-body');
    const totalCountEl   = document.getElementById('total-count');
    const showingCountEl = document.getElementById('showing-count');
    const searchInput    = document.getElementById('search-registrations');
    const eventFilter    = document.getElementById('filter-event');
    const statusFilter   = document.getElementById('filter-status');
    const paymentFilter  = document.getElementById('filter-payment');
    const refreshBtn     = document.getElementById('refresh-btn');
    const exportBtn      = document.getElementById('export-btn');

    // ── Load ──────────────────────────────────────────────────────────────────
    async function loadRegistrations(silent = false) {
        if (!tableBody) return;

        if (!silent) {
            tableBody.innerHTML = `
                <tr>
                  <td colspan="5" class="px-6 py-10 text-center text-gray-400">
                    <div class="flex flex-col items-center justify-center">
                      <svg class="animate-spin h-8 w-8 mb-2 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                      </svg>
                      <p>Loading registrations...</p>
                    </div>
                  </td>
                </tr>`;
        }

        try {
            const res = await fetch(`${API_BASE}/events/registration/search`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                cache: 'no-store'
            });

            console.log(`[Registrations] GET ${API_BASE}/events/registration/search → ${res.status}`);
            const json = await res.json();
            console.log('[Registrations] Response:', json);

            if (!res.ok) {
                throw new Error(json.error || json.message || `Server error ${res.status}`);
            }

            // Handle all response shapes: array / { data: { results: [] } } / { data: [] }
            if (Array.isArray(json))                             allRegistrations = json;
            else if (json.data && Array.isArray(json.data.results)) allRegistrations = json.data.results;
            else if (Array.isArray(json.data))                   allRegistrations = json.data;
            else if (Array.isArray(json.registrations))          allRegistrations = json.registrations;
            else if (json.success && Array.isArray(json.data))   allRegistrations = json.data;
            else                                                  throw new Error(json.error || 'Unexpected API response format');

            if (totalCountEl) totalCountEl.textContent = json.total || allRegistrations.length;
            
            applyFilters();

        } catch (err) {
            console.error('[Registrations] Error:', err);
            if (!silent || allRegistrations.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                      <td colspan="5" class="px-6 py-10 text-center text-red-500">
                        <div class="flex flex-col items-center">
                          <i data-lucide="alert-circle" class="h-8 w-8 text-red-400 mb-2"></i>
                          <p class="font-medium">Failed to load registrations</p>
                          <p class="text-xs text-gray-400 mt-1">${err.message}</p>
                        </div>
                      </td>
                    </tr>`;
                if (window.lucide) lucide.createIcons();
            }
        }
    }

    // ── Render ────────────────────────────────────────────────────────────────
    function renderRegistrations(list, totalItems = 0, startIndex = 0, endIndex = 0) {
        if (!tableBody) return;
        if (showingCountEl) showingCountEl.textContent = totalItems;

        const infoEl = document.getElementById('pagination-info');
        if (infoEl) {
            if (totalItems === 0) {
                infoEl.innerHTML = `Showing <span class="font-medium">0</span> to <span class="font-medium">0</span> of <span class="font-medium">0</span> results`;
            } else {
                infoEl.innerHTML = `Showing <span class="font-medium">${startIndex + 1}</span> to <span class="font-medium">${endIndex}</span> of <span class="font-medium">${totalItems}</span> results`;
            }
        }

        if (list.length === 0) {
            tableBody.innerHTML = `
                <tr>
                  <td colspan="5" class="px-6 py-10 text-center text-gray-500">
                    <div class="flex flex-col items-center">
                      <i data-lucide="inbox" class="h-8 w-8 text-gray-400 mb-2"></i>
                      <p>No registrations found</p>
                    </div>
                  </td>
                </tr>`;
            if (window.lucide) lucide.createIcons({ nameAttr: 'data-lucide', nodes: [tableBody] });
            return;
        }

        tableBody.innerHTML = list.map(r => {
            const mem         = r.member || {};
            const memberName  = mem.name || (mem.first_name ? `${mem.first_name} ${mem.last_name || ''}`.trim() : null);
            const name        = r.name || r.member_name || r.participant_name || memberName || 'N/A';
            const initials    = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
            const memberPhone = mem.phone || mem.mobile;
            const rawPhone    = r.phone || r.mobile || memberPhone || '—';
            const phone       = rawPhone.length === 10 ? `+91 ${rawPhone}` : rawPhone;
            const eventName   = r.event_name || r.event?.title || r.event?.name || '—';
            const regCode     = r.registration_code || r.reg_code || `REG-${String(r.id).padStart(5,'0')}`;
            // Capitalize first letter of status/payment for display
            const statusRaw   = r.status || r.registration_status || 'registered';
            const status      = statusRaw.charAt(0).toUpperCase() + statusRaw.slice(1);
            const paymentRaw  = r.payment_status || '—';
            const payment     = paymentRaw !== '—' ? paymentRaw.charAt(0).toUpperCase() + paymentRaw.slice(1) : '—';
            
            const amount      = r.amount != null ? `₹${r.amount}` : (r.payment_amount != null ? `₹${r.payment_amount}` : '—');
            const createdAt   = (r.created_at || r.registered_at || '').replace(' ', 'T'); // Ensure standard ISO format for parsing
            const dateObj     = createdAt ? new Date(createdAt) : null;
            const dateStr     = dateObj && !isNaN(dateObj) ? dateObj.toLocaleDateString('en-US', { day:'2-digit', month:'short', year:'numeric' }) : '—';
            const timeStr     = dateObj && !isNaN(dateObj) ? dateObj.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' }) : '';
            
            const paymentId   = r.razorpay_payment_id || r.payment_id || '';
            const orderId     = r.razorpay_order_id || r.order_id || '';

            const statusColors = {
                registered: 'bg-blue-100 text-blue-800',
                attended:   'bg-green-100 text-green-800',
                cancelled:  'bg-red-100 text-red-800',
                pending:    'bg-yellow-100 text-yellow-800',
            };
            const payColors = {
                paid:    'bg-green-100 text-green-800',
                free:    'bg-green-100 text-green-800',
                pending: 'bg-yellow-100 text-yellow-800',
                failed:  'bg-red-100 text-red-800',
            };
            const sColor = statusColors[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
            const pColor = payColors[payment.toLowerCase()] || 'bg-gray-100 text-gray-700';

            return `
            <tr>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                    <span class="text-sm font-medium text-gray-600">${initials}</span>
                  </div>
                  <div>
                    <div class="text-sm font-medium text-gray-900">${name}</div>
                    <div class="text-xs text-gray-500 flex items-center mt-1">
                      <i data-lucide="phone" class="h-3 w-3 mr-1"></i>
                      ${phone}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${eventName}</div>
                <div class="text-xs text-gray-500">${regCode}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${sColor}">${status}</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${amount}</div>
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${pColor} mt-1 mb-1">${payment || '—'}</span>
                ${paymentId ? `<div class="text-[10px] text-gray-400 max-w-[120px] truncate" title="${paymentId}">${paymentId}</div>` : ''}
                ${orderId ? `<div class="text-[10px] text-gray-400 max-w-[120px] truncate" title="${orderId}">${orderId}</div>` : ''}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${dateStr}<br><span class="text-xs">${timeStr}</span>
              </td>
            </tr>`;
        }).join('');

        if (window.lucide) lucide.createIcons({ nameAttr: 'data-lucide', nodes: [tableBody] });
    }

    // ── Filter ────────────────────────────────────────────────────────────────
    function applyFilters() {
        const search  = searchInput  ? searchInput.value.toLowerCase().trim()  : '';
        const event   = eventFilter  ? eventFilter.value.toLowerCase().trim()  : '';
        const status  = statusFilter ? statusFilter.value.toLowerCase().trim() : '';
        const payment = paymentFilter? paymentFilter.value.toLowerCase().trim(): '';

        filteredRegistrations = allRegistrations.filter(r => {
            const mem       = r.member || {};
            const memberName= mem.name || (mem.first_name ? `${mem.first_name} ${mem.last_name || ''}`.trim() : null);
            const name      = (r.name || r.member_name || r.participant_name || memberName || '').toLowerCase();
            const memberPhone = mem.phone || mem.mobile;
            const phone     = (r.phone || r.mobile || memberPhone || '').toLowerCase();
            const email     = (r.email || mem.email || '').toLowerCase();
            const eventName = (r.event_name || r.event?.title || '').toLowerCase();
            const rStatus   = (r.status || r.registration_status || '').toLowerCase();
            const rPayment  = (r.payment_status || '').toLowerCase();
            const rEventId  = String(r.event_id || r.event?.id || '');

            return (!search  || name.includes(search) || phone.includes(search) || email.includes(search)) &&
                   (!event   || rEventId === event) &&
                   (!status  || rStatus  === status) &&
                   (!payment || rPayment === payment);
        });

        currentPage = 1;
        renderPaginated();
    }

    function renderPaginated() {
        const totalItems = filteredRegistrations.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
        
        if (currentPage > totalPages) currentPage = totalPages;
        if (currentPage < 1) currentPage = 1;

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
        
        const paginatedList = filteredRegistrations.slice(startIndex, endIndex);
        
        renderRegistrations(paginatedList, totalItems, startIndex, endIndex);
        renderPaginationControls(totalPages);
    }
    
    function renderPaginationControls(totalPages) {
        const controls = document.getElementById('pagination-controls');
        if (!controls) return;
        
        let html = '';
        
        html += `<button class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">Previous</button>`;
        
        for (let i = 1; i <= totalPages; i++) {
            if (i === currentPage) {
                html += `<button class="relative inline-flex items-center px-4 py-2 border border-primary-500 bg-primary-50 text-sm font-medium text-primary-600" data-page="${i}">${i}</button>`;
            } else if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
                html += `<button class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50" data-page="${i}">${i}</button>`;
            } else if (i === currentPage - 2 || i === currentPage + 2) {
                html += `<span class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">...</span>`;
            }
        }
        
        html += `<button class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">Next</button>`;
        
        controls.innerHTML = html;
        
        controls.querySelectorAll('button[data-page]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const page = parseInt(e.currentTarget.getAttribute('data-page'));
                if (!isNaN(page)) {
                    currentPage = page;
                    renderPaginated();
                }
            });
        });
    }

    // ── Bind filter events ────────────────────────────────────────────────────
    if (searchInput)    searchInput.addEventListener('input',  applyFilters);
    if (eventFilter)    eventFilter.addEventListener('change', applyFilters);
    if (statusFilter)   statusFilter.addEventListener('change',applyFilters);
    if (paymentFilter)  paymentFilter.addEventListener('change',applyFilters);

    // ── Refresh & Export ──────────────────────────────────────────────────────
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            refreshBtn.disabled = true;
            loadRegistrations(true).finally(() => { refreshBtn.disabled = false; });
        });
    }

    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            if (!allRegistrations.length) { alert('No data to export.'); return; }
            const headers = ['ID','Name','Phone','Email','Event','Reg Code','Status','Payment','Amount','Date'];
            const rows = allRegistrations.map(r => {
                const mem = r.member || {};
                const memberName = mem.name || (mem.first_name ? `${mem.first_name} ${mem.last_name || ''}`.trim() : null);
                const name = r.name || r.member_name || r.participant_name || memberName || '';
                const phone = r.phone || r.mobile || mem.phone || mem.mobile || '';
                const email = r.email || mem.email || '';
                return [
                    r.id || '',
                    `"${name.replace(/"/g,'""')}"`,
                    `"${phone.replace(/"/g,'""')}"`,
                    `"${email.replace(/"/g,'""')}"`,
                    `"${(r.event_name || r.event?.title || '').replace(/"/g,'""')}"`,
                    `"${(r.registration_code || `REG-${String(r.id).padStart(5,'0')}`).replace(/"/g,'""')}"`,
                    r.status || r.registration_status || '',
                    r.payment_status || '',
                    r.amount || r.payment_amount || 0,
                    `"${(r.created_at || r.registered_at || '').replace(/"/g,'""')}"`
                ].join(',');
            });
            const csv  = [headers.join(','), ...rows].join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement('a');
            a.href     = url;
            a.download = `event_registrations_${new Date().toISOString().split('T')[0]}.csv`;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
    }

    // ── Manual Registration Modal ──────────────────────────────────────────────
    const manualRegBtn = document.getElementById('manual-reg-btn');
    const manualRegModal = document.getElementById('manual-registration-modal');
    const closeManualRegBtn = document.getElementById('close-manual-reg-btn');
    const cancelManualRegBtn = document.getElementById('cancel-manual-reg-btn');
    const manualRegOverlay = document.getElementById('manual-reg-overlay');
    const manualRegForm = document.getElementById('manual-registration-form');
    
    // Toggle buttons
    const payCashBtn = document.getElementById('pay-cash-btn');
    const payRazorpayBtn = document.getElementById('pay-razorpay-btn');
    
    // Fee Display
    const feeContainer = document.getElementById('manual-reg-fee-container');
    const feeAmount = document.getElementById('manual-reg-fee-amount');
    const feeNotice = document.getElementById('manual-reg-fee-notice');
    const feeSummaryAmount = document.getElementById('manual-reg-fee-summary-amount');
    const submitBtn = document.getElementById('submit-manual-reg-btn');
    const submitText = document.getElementById('submit-manual-reg-text');
    
    let manualRegPaymentMethod = 'cash'; // Default
    let manualRegEventId = null;
    let manualRegEventData = null;
    let manualRegPhotoFile = null;
    let isPaymentConfirming = false; // Dedup guard for Razorpay

    // Initialize modal state
    function openManualRegModal() {
        manualRegEventId = eventFilter ? eventFilter.value : null;
        if (!manualRegEventId) {
            alert('Please select a specific Event from the filter dropdown first.');
            return;
        }

        // Use the event data already loaded from the dropdown API
        const selectedEvent = allLoadedEvents.find(e => String(e.id) === String(manualRegEventId));
        
        if (!selectedEvent) {
            alert('Selected event details not found.');
            return;
        }

        // Check if event is active
        if (selectedEvent.status && selectedEvent.status.toLowerCase() !== 'active' && selectedEvent.status.toLowerCase() !== 'upcoming') {
            alert(`This event is currently marked as ${selectedEvent.status}. Registrations are not allowed.`);
            return;
        }

        // Check if registration date has passed
        const closeDateStr = selectedEvent.registration_close || selectedEvent.registrationClose;
        if (closeDateStr) {
            const closeDate = new Date(closeDateStr);
            closeDate.setHours(23, 59, 59, 999);
            const now = new Date();
            
            if (now > closeDate) {
                alert(`Registration for this event is closed.\n(Closed on: ${new Date(closeDateStr).toLocaleDateString()})`);
                return;
            }
        }

        console.log("--- Selected Event Details from API ---");
        console.log(selectedEvent);
        
        manualRegEventData = selectedEvent;
        const fee = parseFloat(selectedEvent.registration_fee ?? selectedEvent.registrationFee ?? selectedEvent.fee) || 0;
        feeAmount.textContent = `₹ ${fee.toFixed(2)}`;
        feeSummaryAmount.textContent = `₹ ${fee.toFixed(2)}`;
        
        if (fee > 0) {
            feeContainer.classList.remove('hidden');
        } else {
            feeContainer.classList.add('hidden');
        }
        
        updateManualRegPaymentMethod(manualRegPaymentMethod, fee);
        manualRegModal.classList.remove('hidden');
    }

    function closeManualRegModal() {
        manualRegModal.classList.add('hidden');
        manualRegForm.reset();
        manualRegForm.classList.remove('hidden');
        document.getElementById('manual-registration-success').classList.add('hidden');
        manualRegPhotoFile = null;
        document.getElementById('manual-reg-photo-preview-area').classList.add('hidden');
        document.getElementById('manual-reg-photo-input-area').classList.remove('hidden');
        document.getElementById('manual-reg-phone-error').classList.add('hidden');
        document.getElementById('manual-reg-association').disabled = false;
        
        // Reset dropdown to all associations
        populateAssociationDropdown(allAssociationsList);
    }

    if (manualRegBtn) manualRegBtn.addEventListener('click', openManualRegModal);
    if (closeManualRegBtn) closeManualRegBtn.addEventListener('click', closeManualRegModal);
    if (cancelManualRegBtn) cancelManualRegBtn.addEventListener('click', closeManualRegModal);
    if (manualRegOverlay) manualRegOverlay.addEventListener('click', closeManualRegModal);

    // Payment Toggle Logic
    function updateManualRegPaymentMethod(method, fee = 0) {
        manualRegPaymentMethod = method;
        if (method === 'cash') {
            payCashBtn.classList.replace('border-gray-300', 'border-primary-600');
            payCashBtn.classList.replace('bg-white', 'bg-primary-50');
            payRazorpayBtn.classList.replace('border-primary-600', 'border-gray-300');
            payRazorpayBtn.classList.replace('bg-primary-50', 'bg-white');
            
            feeNotice.textContent = "This registration will be marked as paid immediately";
            document.getElementById('manual-reg-receipt-container').classList.remove('hidden');
            submitText.textContent = fee === 0 ? "Register (Free)" : "Register with Cash";
        } else {
            payRazorpayBtn.classList.replace('border-gray-300', 'border-primary-600');
            payRazorpayBtn.classList.replace('bg-white', 'bg-primary-50');
            payCashBtn.classList.replace('border-primary-600', 'border-gray-300');
            payCashBtn.classList.replace('bg-primary-50', 'bg-white');
            
            feeNotice.textContent = "You will be redirected to the payment gateway";
            document.getElementById('manual-reg-receipt-container').classList.add('hidden');
            submitText.textContent = fee === 0 ? "Register (Free)" : "Register & Pay via Razorpay";
        }
    }

    if (payCashBtn) payCashBtn.addEventListener('click', () => updateManualRegPaymentMethod('cash', parseFloat(manualRegEventData?.registrationFee ?? manualRegEventData?.fee) || 0));
    if (payRazorpayBtn) payRazorpayBtn.addEventListener('click', () => updateManualRegPaymentMethod('razorpay', parseFloat(manualRegEventData?.registrationFee ?? manualRegEventData?.fee) || 0));

    // Photo Upload Logic
    const manualRegPhotoInput = document.getElementById('manual-reg-photo');
    if (manualRegPhotoInput) {
        manualRegPhotoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            if (file.size > 30 * 1024 * 1024) { alert('Image too large (>30MB)'); e.target.value=''; return; }
            manualRegPhotoFile = file;
            const reader = new FileReader();
            reader.onload = (ev) => {
                document.getElementById('manual-reg-photo-preview').src = ev.target.result;
                document.getElementById('manual-reg-photo-input-area').classList.add('hidden');
                document.getElementById('manual-reg-photo-preview-area').classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        });
    }
    const removePhotoBtn = document.getElementById('manual-reg-remove-photo');
    if (removePhotoBtn) {
        removePhotoBtn.addEventListener('click', () => {
            manualRegPhotoFile = null;
            manualRegPhotoInput.value = '';
            document.getElementById('manual-reg-photo-preview-area').classList.add('hidden');
            document.getElementById('manual-reg-photo-input-area').classList.remove('hidden');
        });
    }

    // Phone check & City associations logic
    let phoneCheckTimeout = null;
    const phoneInput = document.getElementById('manual-reg-phone');
    const phoneChecking = document.getElementById('manual-reg-phone-checking');
    const phoneError = document.getElementById('manual-reg-phone-error');
    const phoneLoader = document.getElementById('manual-reg-phone-loader');

    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            clearTimeout(phoneCheckTimeout);
            const val = e.target.value.replace(/\D/g, '');
            if (val.length !== 10) {
                phoneError.classList.add('hidden');
                submitBtn.disabled = false;
                return;
            }
            phoneCheckTimeout = setTimeout(async () => {
                try {
                    phoneLoader.classList.remove('hidden');
                    phoneChecking.classList.remove('hidden');
                    phoneError.classList.add('hidden');
                    
                    const status = await window.api.checkPublicRegistrationStatus(manualRegEventId, val);
                    
                    if (status.isRegistered) {
                        phoneError.textContent = 'This phone number is already registered for this event. Please use a different number.';
                        phoneError.classList.remove('hidden');
                        submitBtn.disabled = true;
                    } else {
                        submitBtn.disabled = false;
                        
                        // Auto-fill member details if member exists but is not registered yet
                        const member = status.member || status.data?.member;
                        if (member) {
                            if (document.getElementById('manual-reg-name') && member.first_name) {
                                document.getElementById('manual-reg-name').value = `${member.first_name} ${member.last_name || ''}`.trim();
                            }
                            if (document.getElementById('manual-reg-email') && member.email) {
                                document.getElementById('manual-reg-email').value = member.email;
                            }
                            if (document.getElementById('manual-reg-business') && member.business) {
                                document.getElementById('manual-reg-business').value = member.business;
                            }
                            if (document.getElementById('manual-reg-businesstype') && member.business_type) {
                                document.getElementById('manual-reg-businesstype').value = member.business_type;
                            }
                            if (document.getElementById('manual-reg-city') && member.city) {
                                document.getElementById('manual-reg-city').value = member.city;
                                // Trigger change event if there is logic depending on city (e.g. associations)
                                document.getElementById('manual-reg-city').dispatchEvent(new Event('change'));
                            }
                            
                            // If they are associated with an association, wait for city associations to load, then select it
                            if (member.association_id && document.getElementById('manual-reg-association')) {
                                setTimeout(() => {
                                    const assocSelect = document.getElementById('manual-reg-association');
                                    if (assocSelect.querySelector(`option[value="${member.association_id}"]`)) {
                                        assocSelect.value = member.association_id;
                                    }
                                }, 1000); // Wait for associations dropdown to populate based on city change
                            }
                            
                            // Show a small toast/alert indicating data was auto-filled
                            const autoFillNotice = document.createElement('div');
                            autoFillNotice.className = 'text-green-600 text-sm mt-1 mb-2';
                            autoFillNotice.textContent = 'Member details auto-filled from database.';
                            
                            // Remove old notice if exists
                            const oldNotice = document.getElementById('auto-fill-notice');
                            if (oldNotice) oldNotice.remove();
                            
                            autoFillNotice.id = 'auto-fill-notice';
                            document.getElementById('manual-reg-phone').parentNode.appendChild(autoFillNotice);
                            setTimeout(() => autoFillNotice.remove(), 4000);
                        }
                    }
                } catch (err) {
                    console.error('Error checking registration status:', err);
                } finally {
                    phoneLoader.classList.add('hidden');
                    phoneChecking.classList.add('hidden');
                }
            }, 500);
        });
    }

    const cityInput = document.getElementById('manual-reg-city');
    const assocDropdown = document.getElementById('manual-reg-association');
    const assocLoader = document.getElementById('manual-reg-assoc-loader');
    
    function populateAssociationDropdown(list) {
        if (!assocDropdown) return;
        assocDropdown.innerHTML = '<option value="">Select an association (optional)</option>';
        list.forEach(a => {
            const opt = document.createElement('option');
            opt.value = a.id;
            opt.textContent = a.name + (a.city ? ` (${a.city})` : '');
            assocDropdown.appendChild(opt);
        });
        assocDropdown.disabled = false;
    }
    
    if (cityInput) {
        cityInput.addEventListener('input', (e) => {
            const city = e.target.value.trim().toLowerCase();
            if (!city) {
                populateAssociationDropdown(allAssociationsList);
                return;
            }
            const filtered = allAssociationsList.filter(a => (a.city || '').toLowerCase().includes(city));
            populateAssociationDropdown(filtered);
        });
    }

    // Success Screen Handlers
    document.getElementById('close-success-btn')?.addEventListener('click', closeManualRegModal);
    document.getElementById('register-another-btn')?.addEventListener('click', () => {
        manualRegForm.reset();
        manualRegForm.classList.remove('hidden');
        document.getElementById('manual-registration-success').classList.add('hidden');
        manualRegPhotoFile = null;
        document.getElementById('manual-reg-photo-preview-area').classList.add('hidden');
        document.getElementById('manual-reg-photo-input-area').classList.remove('hidden');
    });

    const downloadPassBtn = document.getElementById('download-pass-btn');
    if (downloadPassBtn) {
        let isDownloading = false;
        downloadPassBtn.addEventListener('click', async () => {
            if (isDownloading) return;
            const regIdEl = document.getElementById('success-reg-id');
            const regIdText = regIdEl ? regIdEl.textContent.replace('#', '').trim() : null;
            if (!regIdText || !manualRegEventId) return;
            
            isDownloading = true;
            downloadPassBtn.classList.add('opacity-75', 'cursor-not-allowed');
            const originalHtml = downloadPassBtn.innerHTML;
            downloadPassBtn.innerHTML = '<i data-lucide="loader-2" class="h-4 w-4 mr-2 animate-spin"></i> Downloading...';
            if (window.lucide) lucide.createIcons({ nameAttr: 'data-lucide', nodes: [downloadPassBtn] });

            try {
                const pdfBlob = await window.api.downloadRegistrationPdf(manualRegEventId, regIdText);
                const url = window.URL.createObjectURL(pdfBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `mandapam-visitor-pass-${regIdText}.pdf`;
                document.body.appendChild(link);
                link.click();
                setTimeout(() => {
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                }, 100);
            } catch (error) {
                console.error('Download error:', error);
                alert('Could not download the pass. Please try again.');
            } finally {
                isDownloading = false;
                downloadPassBtn.classList.remove('opacity-75', 'cursor-not-allowed');
                downloadPassBtn.innerHTML = originalHtml;
                if (window.lucide) lucide.createIcons({ nameAttr: 'data-lucide', nodes: [downloadPassBtn] });
            }
        });
    }

    // Form Submission
    if (manualRegForm) {
        manualRegForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            submitBtn.disabled = true;
            submitBtn.classList.add('opacity-50');
            const originalText = submitText.textContent;
            submitText.textContent = "Processing...";

            try {
                let photoUrl = null;
                if (manualRegPhotoFile) {
                    const uploadResult = await window.api.uploadProfileImage(manualRegPhotoFile);
                    photoUrl = uploadResult.url || uploadResult.image || uploadResult.filename;
                }

                const assocVal = document.getElementById('manual-reg-association').value;
                const payload = {
                    name: document.getElementById('manual-reg-name').value.trim(),
                    phone: document.getElementById('manual-reg-phone').value.replace(/\D/g, ''),
                    email: document.getElementById('manual-reg-email').value.trim() || null,
                    businessName: document.getElementById('manual-reg-business').value.trim(),
                    businessType: document.getElementById('manual-reg-businesstype').value || null,
                    city: document.getElementById('manual-reg-city').value.trim() || null,
                    associationId: assocVal ? parseInt(assocVal, 10) : null,
                    photo: photoUrl,
                    paymentMethod: manualRegPaymentMethod,
                    cashReceiptNumber: manualRegPaymentMethod === 'cash' ? (document.getElementById('manual-reg-receipt').value.trim() || null) : null
                };

                const fee = parseFloat(manualRegEventData.registration_fee ?? manualRegEventData.registrationFee ?? manualRegEventData.fee) || 0;


                if (manualRegPaymentMethod === 'cash') {
                    // Cash flow uses createManualRegistration
                    const response = await window.api.createManualRegistration(manualRegEventId, payload);
                    
                    // Show success screen
                    manualRegForm.classList.add('hidden');
                    const successData = response.data || response.registration || response;
                    
                    document.getElementById('success-reg-id').textContent = successData.id || '#' + Math.floor(Math.random() * 10000);
                    document.getElementById('success-reg-status').textContent = 'paid';
                    document.getElementById('success-reg-amount').textContent = `₹ ${fee}`;
                    document.getElementById('success-reg-method').textContent = 'cash';
                    document.getElementById('manual-registration-success').classList.remove('hidden');
                    
                    manualRegForm.reset(); // Make form fresh for next registration
                    
                    loadRegistrations(true); // refresh table
                    loadEventsDropdown(); // refresh dropdown data
                } else {
                    // Razorpay flow uses initiateRazorpayManualRegistration
                    const paymentData = await window.api.initiateRazorpayManualRegistration(manualRegEventId, payload);
                    
                    if (fee === 0 || paymentData.data?.is_free) {
                        alert('Free Registration successful!');
                        closeManualRegModal();
                        loadRegistrations(true);
                        loadEventsDropdown();
                        return;
                    }

                    // Extract Razorpay options correctly based on the new backend structure
                    const pOpts = paymentData.paymentOptions || paymentData.data?.paymentOptions || paymentData.data?.data?.paymentOptions;
                    const mData = paymentData.member || paymentData.data?.member || paymentData.data?.registration || paymentData.data?.data?.registration;
                    const mId = mData?.id || mData?.member_id;

                    if (!pOpts || !pOpts.key) {
                        console.error('Full response:', paymentData);
                        throw new Error('Payment gateway options not returned by the server. Cannot open Razorpay.');
                    }

                    if (typeof window.Razorpay === 'undefined') throw new Error('Payment gateway not loaded.');

                    // Hide the form to make it "vanish" while Razorpay is open
                    manualRegForm.classList.add('hidden');

                    const options = {
                        ...pOpts,
                        handler: async function (rzpResponse) {
                            if (isPaymentConfirming) return;
                            isPaymentConfirming = true;
                            
                            let paymentConfirmed = false;
                            
                            try {
                                const confirmData = await window.api.confirmRazorpayManualPayment({
                                    order_id: rzpResponse.razorpay_order_id,
                                    transaction_id: rzpResponse.razorpay_payment_id,
                                    signature: rzpResponse.razorpay_signature,
                                    status: 'success'
                                });
                                paymentConfirmed = true;
                            } catch (err) {
                                console.error('Confirm error:', err);
                                
                                const isNetworkError = err instanceof TypeError || err.name === 'AbortError' || err.name === 'NetworkError';
                                
                                if (isNetworkError) {
                                    console.warn('Network error detected. Polling checkPublicRegistrationStatus to verify payment...');
                                    alert('Payment received! Verifying registration (this may take a few seconds)...');
                                    
                                    const maxPollAttempts = 6;
                                    const pollInterval = 2000;
                                    
                                    for (let attempt = 1; attempt <= maxPollAttempts; attempt++) {
                                        await new Promise(resolve => setTimeout(resolve, pollInterval));
                                        try {
                                            const statusData = await window.api.checkPublicRegistrationStatus(manualRegEventId, payload.phone);
                                            if (statusData.isRegistered && statusData.registration?.paymentStatus === 'paid') {
                                                console.log('Registration confirmed via polling!');
                                                paymentConfirmed = true;
                                                break;
                                            }
                                        } catch (pollError) {
                                            console.error(`Poll attempt ${attempt} failed:`, pollError);
                                        }
                                    }
                                }
                                
                                if (!paymentConfirmed) {
                                    alert('Payment confirmation failed: ' + err.message);
                                }
                            } finally {
                                if (paymentConfirmed) {
                                    alert('Razorpay Registration successful!');
                                    closeManualRegModal();
                                    loadRegistrations(true);
                                    loadEventsDropdown();
                                }
                                isPaymentConfirming = false;
                                submitBtn.disabled = false;
                                submitBtn.classList.remove('opacity-50');
                                submitText.textContent = originalText;
                            }
                        },
                        modal: {
                            ondismiss: function() {
                                manualRegForm.classList.remove('hidden'); // UNHIDE form if user closes Razorpay
                                isPaymentConfirming = false;
                                submitBtn.disabled = false;
                                submitBtn.classList.remove('opacity-50');
                                submitText.textContent = originalText;
                            }
                        }
                    };

                    const rzp = new window.Razorpay(options);
                    rzp.on('payment.failed', function(fail) {
                        alert('Payment failed.');
                        manualRegForm.classList.remove('hidden'); // UNHIDE form if payment fails
                        isPaymentConfirming = false;
                        submitBtn.disabled = false;
                        submitBtn.classList.remove('opacity-50');
                        submitText.textContent = originalText;
                    });
                    rzp.open();
                    return; // Prevent reset below
                }

            } catch (err) {
                console.error(err);
                
                let errorMessage = err.message || 'Registration failed';
                
                // If it's a 422 validation error, extract the specific field errors
                if (err.response && err.response.status === 422 && err.response.data && err.response.data.errors) {
                    const validationErrors = Object.values(err.response.data.errors).flat().join('\n');
                    if (validationErrors) {
                        errorMessage = "Validation Error:\n" + validationErrors;
                    }
                }
                
                alert(errorMessage);
                manualRegForm.classList.remove('hidden'); // UNHIDE if error occurred
            } finally {
                submitBtn.disabled = false;
                submitBtn.classList.remove('opacity-50');
                submitText.textContent = originalText;
            }
        });
    }

    // ── Initial load ──────────────────────────────────────────────────────────
    async function loadEventsDropdown() {
        if (!eventFilter) return;
        try {
            const evtRes = await fetch(`${API_BASE}/events`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            if (evtRes.ok) {
                const evtJson = await evtRes.json();
                let eventsList = [];
                if (evtJson.data && Array.isArray(evtJson.data.results)) {
                    eventsList = evtJson.data.results;
                } else if (Array.isArray(evtJson.data)) {
                    eventsList = evtJson.data;
                } else if (Array.isArray(evtJson)) {
                    eventsList = evtJson;
                }
                
                allLoadedEvents = eventsList;
                
                const currentVal = eventFilter.value;
                eventFilter.innerHTML = '<option value="">All Events</option>';
                
                eventsList.forEach(e => {
                    const opt = document.createElement('option');
                    opt.value = e.id;
                    opt.textContent = e.title || e.name;
                    eventFilter.appendChild(opt);
                });
                
                eventFilter.value = currentVal || '';
            }
        } catch (evtErr) {
            console.error('[Registrations] Error fetching past events for dropdown:', evtErr);
        }
    }
    
    async function loadAllAssociations() {
        try {
            const res = await fetch(`${API_BASE}/associations`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
            });
            if (res.ok) {
                const json = await res.json();
                if (json.data && Array.isArray(json.data.results)) allAssociationsList = json.data.results;
                else if (Array.isArray(json.data)) allAssociationsList = json.data;
                else if (Array.isArray(json)) allAssociationsList = json;
                
                populateAssociationDropdown(allAssociationsList);
            }
        } catch (err) {
            console.error('[Registrations] Error fetching all associations:', err);
        }
    }

    loadEventsDropdown();
    loadAllAssociations();
    loadRegistrations();
});
