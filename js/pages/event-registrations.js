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
            const res = await fetch(`${API_BASE}/event-registrations`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                cache: 'no-store'
            });

            console.log(`[Registrations] GET ${API_BASE}/event-registrations → ${res.status}`);
            const json = await res.json();
            console.log('[Registrations] Response:', json);

            if (!res.ok) {
                throw new Error(json.error || json.message || `Server error ${res.status}`);
            }

            // Handle all response shapes: array / { data } / { registrations } / { success, data }
            if (Array.isArray(json))                             allRegistrations = json;
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
    function renderRegistrations(list) {
        if (!tableBody) return;
        if (showingCountEl) showingCountEl.textContent = list.length;

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
            const name        = r.name || r.member_name || r.participant_name || 'N/A';
            const initials    = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
            const rawPhone    = r.phone || r.mobile || '—';
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
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${pColor} mt-1">${payment || '—'}</span>
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

        const filtered = allRegistrations.filter(r => {
            const name      = (r.name || r.member_name || '').toLowerCase();
            const phone     = (r.phone || r.mobile || '').toLowerCase();
            const email     = (r.email || '').toLowerCase();
            const eventName = (r.event_name || r.event?.title || '').toLowerCase();
            const rStatus   = (r.status || r.registration_status || '').toLowerCase();
            const rPayment  = (r.payment_status || '').toLowerCase();

            return (!search  || name.includes(search) || phone.includes(search) || email.includes(search)) &&
                   (!event   || eventName.includes(event)) &&
                   (!status  || rStatus  === status) &&
                   (!payment || rPayment === payment);
        });

        renderRegistrations(filtered);
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
            const rows = allRegistrations.map(r => [
                r.id || '',
                `"${(r.name || r.member_name || '').replace(/"/g,'""')}"`,
                `"${(r.phone || r.mobile || '').replace(/"/g,'""')}"`,
                `"${(r.email || '').replace(/"/g,'""')}"`,
                `"${(r.event_name || r.event?.title || '').replace(/"/g,'""')}"`,
                `"${(r.registration_code || `REG-${String(r.id).padStart(5,'0')}`).replace(/"/g,'""')}"`,
                r.status || '',
                r.payment_status || '',
                r.amount || r.payment_amount || 0,
                `"${(r.created_at || r.registered_at || '').replace(/"/g,'""')}"`
            ].join(','));
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

    // ── Initial load ──────────────────────────────────────────────────────────
    loadRegistrations();
});
