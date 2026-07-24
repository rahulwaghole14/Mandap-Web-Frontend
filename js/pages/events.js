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
                fetch(`${API_BASE}/auth/logout`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' }
                }).catch(e => console.error('[Logout] Error:', e));
            } catch (e) { console.error('[Logout] Error:', e); }
            ['token','refreshToken','user','userEmail','userName','userRole'].forEach(k => localStorage.removeItem(k));
            window.location.href = 'login.html';
        });
    }

    // ── State ─────────────────────────────────────────────────────────────────
    const API_BASE = window.CONFIG.API_BASE_URL;
    let allEvents = [];

    // ── DOM refs ──────────────────────────────────────────────────────────────
    const eventsGrid     = document.getElementById('events-grid');
    const searchInput    = document.getElementById('search-input');
    const typeFilter     = document.getElementById('type-filter');
    const locationFilter = document.getElementById('location-filter');
    const refreshBtn     = document.getElementById('refresh-btn');

    const modalOverlay     = document.getElementById('modal-overlay');
    const deleteModal      = document.getElementById('delete-modal');
    const cancelDeleteBtn  = document.getElementById('cancel-delete-btn');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    let eventToDelete      = null;

    // ── Load ──────────────────────────────────────────────────────────────────
    async function loadEvents(silent = false) {
        if (!eventsGrid) return;

        if (!silent) {
            eventsGrid.innerHTML = `
                <div class="col-span-full py-10 flex flex-col items-center justify-center text-gray-400">
                    <svg class="animate-spin h-8 w-8 mb-4 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                    </svg>
                    <p>Loading events...</p>
                </div>`;
        }

        try {
            // Fetch all events by using a high limit to match the UI's expectation of client-side filtering without pagination controls
            const res = await fetch(`${API_BASE}/events?limit=1000`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                cache: 'no-store'
            });

            const json = await res.json();
            console.log('[Events] Raw API response:', json);
            if (!res.ok) throw new Error(json.error || json.message || `Server error ${res.status}`);

            if (Array.isArray(json))                             allEvents = json;
            else if (Array.isArray(json.data))                   allEvents = json.data;
            else if (json.success && Array.isArray(json.data))   allEvents = json.data;
            else if (Array.isArray(json.results))                allEvents = json.results;
            else if (json.status === 'success' && Array.isArray(json.results)) allEvents = json.results;
            else if (json.data && Array.isArray(json.data.results)) allEvents = json.data.results;
            else if (json.data && Array.isArray(json.data.data)) allEvents = json.data.data;
            else                                                 throw new Error('Unexpected API response format');

            // Extract unique types and locations for dynamic filters
            if (typeFilter && locationFilter) {
                const types = new Set(Array.from(typeFilter.options).map(o => o.value).filter(Boolean));
                const locations = new Set(Array.from(locationFilter.options).map(o => o.value).filter(Boolean));
                
                allEvents.forEach(evt => {
                    if (evt.type) types.add(evt.type);
                    
                    const loc = (evt.address || evt.venue || evt.location || '');
                    if (loc) {
                        const parts = loc.split(',');
                        if (parts.length >= 2) {
                            locations.add(parts[parts.length - 2].trim());
                        } else {
                            locations.add(loc.trim());
                        }
                    }
                });
                
                const typeVal = typeFilter.value;
                const locVal = locationFilter.value;
                
                typeFilter.innerHTML = '<option value="">All Types</option>';
                [...types].filter(Boolean).sort().forEach(t => {
                    const opt = document.createElement('option');
                    opt.value = opt.textContent = t;
                    typeFilter.appendChild(opt);
                });
                
                locationFilter.innerHTML = '<option value="">All Locations</option>';
                [...locations].filter(Boolean).sort().forEach(l => {
                    const opt = document.createElement('option');
                    opt.value = opt.textContent = l;
                    locationFilter.appendChild(opt);
                });
                
                typeFilter.value = typeVal;
                locationFilter.value = locVal;
            }

            applyFilters();
        } catch (err) {
            console.error('[Events] Error:', err);
            if (!silent || allEvents.length === 0) {
                eventsGrid.innerHTML = `
                    <div class="col-span-full py-10 flex flex-col items-center text-red-500">
                        <i data-lucide="alert-circle" class="h-8 w-8 text-red-400 mb-2"></i>
                        <p class="font-medium">Failed to load events</p>
                        <p class="text-xs text-gray-400 mt-1">${err.message}</p>
                    </div>`;
                if (window.lucide) lucide.createIcons({ nameAttr: 'data-lucide', nodes: [eventsGrid] });
            }
        }
    }

    // ── Render ────────────────────────────────────────────────────────────────
    function renderEvents(list) {
        if (!eventsGrid) return;

        if (list.length === 0) {
            eventsGrid.innerHTML = `
                <div class="col-span-full py-10 flex flex-col items-center text-gray-500">
                    <i data-lucide="inbox" class="h-10 w-10 text-gray-400 mb-2"></i>
                    <p class="font-medium text-lg">No events found</p>
                    <p class="text-sm mt-1">Try adjusting your filters or create a new event.</p>
                </div>`;
            if (window.lucide) lucide.createIcons({ nameAttr: 'data-lucide', nodes: [eventsGrid] });
            return;
        }

        eventsGrid.innerHTML = list.map(evt => {
            const id        = evt.id;
            const title     = evt.title || evt.name || 'Untitled Event';
            const location  = evt.venue ? (evt.address ? `${evt.venue}, ${evt.address}` : evt.venue) : (evt.address || evt.location || 'Location TBD');
            const capacity  = evt.capacity || 'Unlimited';
            const eventType = evt.type || 'Event';
            
            // Format dates safely
            const startDate = (evt.start_date || evt.startDate || '').replace(' ', 'T');
            const endDate   = (evt.end_date || evt.endDate || '').replace(' ', 'T');
            const sDate     = startDate ? new Date(startDate) : null;
            const eDate     = endDate ? new Date(endDate) : null;
            let dateStr     = 'Date TBD';
            
            if (sDate && !isNaN(sDate)) {
                const sStr = sDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
                if (eDate && !isNaN(eDate) && eDate.getTime() !== sDate.getTime()) {
                    const eStr = eDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
                    dateStr = `${sStr} - ${eStr}`;
                } else {
                    dateStr = sStr;
                }
            }

            // Determine status
            const now = new Date();
            let status = 'Upcoming';
            let statusColor = 'bg-green-100 text-green-800';
            
            if (evt.status) {
                const s = evt.status.toLowerCase();
                if (s === 'active') {
                    status = 'Active';
                    statusColor = 'bg-blue-100 text-blue-800';
                } else if (s === 'cancelled') {
                    status = 'Cancelled';
                    statusColor = 'bg-red-100 text-red-800';
                } else {
                    status = evt.status.charAt(0).toUpperCase() + evt.status.slice(1);
                }
            }

            if (eDate && eDate < now && status !== 'Cancelled') {
                status = 'Past';
                statusColor = 'bg-gray-100 text-gray-800';
            }

            // Handle image correctly
            let imgUrl = null;
            const imgData = evt.event_image || evt.image || evt.imageURL || evt.banner;
            if (imgData) {
                // If there's an API utility to format image URLs, we can use it.
                // Assuming basic formatting if window.api.getImageUrl doesn't exist on this page
                if (typeof imgData === 'string' && imgData.startsWith('http')) {
                    imgUrl = imgData;
                } else if (window.api && typeof window.api.getImageUrl === 'function') {
                    imgUrl = window.api.getImageUrl(imgData);
                } else {
                    imgUrl = `${API_BASE.replace('/api', '')}/storage/${imgData}`;
                }
            }

            const imgHtml = imgUrl 
                ? `<img src="${imgUrl}" alt="${title}" class="w-full h-full object-cover">`
                : `<div class="absolute inset-0 flex items-center justify-center text-gray-400"><i data-lucide="image" class="h-12 w-12 opacity-50"></i></div>`;

            return `
            <div class="bg-white rounded-xl shadow overflow-hidden group flex flex-col" data-id="${id}">
              <div class="relative h-48 bg-gray-200">
                ${imgHtml}
                <div class="absolute top-4 right-4 flex space-x-2">
                  <span class="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 shadow-sm">
                    ${eventType}
                  </span>
                  <span class="px-2 py-1 text-xs font-semibold rounded-full ${statusColor} shadow-sm">
                    ${status}
                  </span>
                </div>
              </div>
              <div class="p-5 flex-1 flex flex-col">
                <h3 class="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">${title}</h3>
                <div class="space-y-2 mb-4 flex-1">
                  <div class="flex items-center text-sm text-gray-600">
                    <i data-lucide="calendar" class="h-4 w-4 mr-2"></i>
                    <span>${dateStr}</span>
                  </div>
                  <div class="flex items-center text-sm text-gray-600">
                    <i data-lucide="map-pin" class="h-4 w-4 mr-2"></i>
                    <span class="truncate">${location}</span>
                  </div>
                  <div class="flex items-center text-sm text-gray-600">
                    <i data-lucide="users" class="h-4 w-4 mr-2"></i>
                    <span>Capacity: ${capacity}</span>
                  </div>
                </div>
                <div class="flex justify-between items-center pt-4 border-t border-gray-100 mt-auto">
                  <a href="event-details.html?id=${id}" class="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center">
                    <i data-lucide="eye" class="h-4 w-4 mr-1"></i>
                    View Details
                  </a>
                  <div class="flex space-x-2">
                    <a href="event-form?id=${id}" class="p-2 text-gray-400 hover:text-yellow-600 transition-colors inline-block cursor-pointer" title="Edit Event">
                      <i data-lucide="edit" class="h-4 w-4 pointer-events-none"></i>
                    </a>
                    <button class="p-2 text-gray-400 hover:text-red-600 transition-colors delete-event-btn" data-id="${id}" title="Delete Event">
                      <i data-lucide="trash-2" class="h-4 w-4"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>`;
        }).join('');

        if (window.lucide) lucide.createIcons({ nameAttr: 'data-lucide', nodes: [eventsGrid] });

        // Bind delete buttons dynamically
        eventsGrid.querySelectorAll('.delete-event-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                eventToDelete = e.currentTarget.dataset.id;
                modalOverlay.classList.remove('hidden');
                deleteModal.classList.remove('hidden');
                document.body.style.overflow = 'hidden';
            });
        });
    }

    // ── Filters ───────────────────────────────────────────────────────────────
    function applyFilters() {
        const search = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const selectedType = typeFilter ? typeFilter.value.toLowerCase().trim() : '';
        const selectedLocation = locationFilter ? locationFilter.value.toLowerCase().trim() : '';

        const filtered = allEvents.filter(evt => {
            const title = (evt.title || evt.name || '').toLowerCase();
            const locationStr = (evt.address || evt.venue || evt.location || '').toLowerCase();
            const typeStr = (evt.type || 'Event').toLowerCase();
            
            const matchesSearch = !search || title.includes(search) || locationStr.includes(search);
            const matchesType = !selectedType || typeStr === selectedType;
            const matchesLocation = !selectedLocation || locationStr.includes(selectedLocation);
            
            return matchesSearch && matchesType && matchesLocation;
        });

        renderEvents(filtered);
    }

    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (typeFilter) typeFilter.addEventListener('change', applyFilters);
    if (locationFilter) locationFilter.addEventListener('change', applyFilters);

    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            refreshBtn.disabled = true;
            loadEvents(true).finally(() => { refreshBtn.disabled = false; });
        });
    }

    // ── Delete Modal Handlers ─────────────────────────────────────────────────
    const closeModal = () => {
        if (!modalOverlay || !deleteModal) return;
        modalOverlay.classList.add('hidden');
        deleteModal.classList.add('hidden');
        document.body.style.overflow = '';
        eventToDelete = null;
    };

    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeModal);
    if (modalOverlay) modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });

    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', async () => {
            if (!eventToDelete) return;
            
            try {
                confirmDeleteBtn.disabled = true;
                confirmDeleteBtn.textContent = 'Deleting...';
                
                const res = await fetch(`${API_BASE}/events/${eventToDelete}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
                });

                if (!res.ok) {
                    let errMsg = `Failed to delete event (Status: ${res.status})`;
                    try {
                        const errJson = await res.json();
                        console.error('[Events] Backend Delete Error Response:', errJson);
                        if (errJson.errors && typeof errJson.errors === 'object') {
                            // Extract validation errors (e.g., Laravel 422)
                            errMsg = Object.values(errJson.errors).flat().join(', ');
                        } else if (errJson.message || errJson.error) {
                            errMsg = errJson.message || errJson.error;
                        }
                    } catch (e) {
                        // ignore JSON parse error for 204 or non-json responses
                    }
                    throw new Error(errMsg);
                }
                
                // Remove from state
                allEvents = allEvents.filter(e => e.id.toString() !== eventToDelete);
                applyFilters(); // Re-render without hitting API again
            } catch (err) {
                console.error('[Events] Delete error:', err);
                alert(err.message || 'An error occurred while deleting the event.');
            } finally {
                confirmDeleteBtn.disabled = false;
                confirmDeleteBtn.textContent = 'Delete';
                closeModal();
            }
        });
    }

    // ── Init ──────────────────────────────────────────────────────────────────
    loadEvents();
});
