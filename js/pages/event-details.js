document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Set user info
    if (user.name) {
        const userNameEl = document.getElementById('user-name');
        if (userNameEl) userNameEl.textContent = user.name;
    }

    // Logout functionality
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
    const token = localStorage.getItem('token');
    const API_BASE = window.CONFIG.API_BASE_URL;
    
    if (token) {
      try {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
        console.error('[Logout] Error:', error);
      }
    }
    
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    window.location.href = 'login.html';
  });
    }

    // Tab Switching Logic
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Reset styles on all buttons
            tabBtns.forEach(b => {
                b.classList.remove('bg-primary-600', 'text-white');
                b.classList.add('text-gray-600', 'hover:bg-gray-100');
            });

            // Set active style on clicked button
            btn.classList.remove('text-gray-600', 'hover:bg-gray-100');
            btn.classList.add('bg-primary-600', 'text-white');

            // Hide all contents
            tabContents.forEach(content => {
                content.classList.add('hidden');
            });

            // Show target content
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).classList.remove('hidden');
        });
    });

    // Exhibitor Modal Logic
    const modalOverlay = document.getElementById('modal-overlay');
    const exhibitorModal = document.getElementById('exhibitor-modal');
    const addExhibitorBtn = document.getElementById('add-exhibitor-btn');
    const closeExhibitorModalBtn = document.getElementById('close-exhibitor-modal');
    const cancelExhibitorBtn = document.getElementById('cancel-exhibitor-btn');
    const addExhibitorForm = document.getElementById('add-exhibitor-form');

    const openModal = () => {
        modalOverlay.classList.remove('hidden');
        exhibitorModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    };

    const closeModal = () => {
        modalOverlay.classList.add('hidden');
        exhibitorModal.classList.add('hidden');
        document.body.style.overflow = '';
        if (addExhibitorForm) addExhibitorForm.reset();
    };

    if (addExhibitorBtn) addExhibitorBtn.addEventListener('click', openModal);
    if (closeExhibitorModalBtn) closeExhibitorModalBtn.addEventListener('click', closeModal);
    if (cancelExhibitorBtn) cancelExhibitorBtn.addEventListener('click', closeModal);

    // Close on overlay click
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeModal();
            }
        });
    }

    // Handle Form Submit
    if (addExhibitorForm) {
        addExhibitorForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = addExhibitorForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Adding...';
            submitBtn.disabled = true;

            const companyName = document.getElementById('exh-company-name').value;
            const stallNumber = document.getElementById('exh-stall-number').value;
            const contactPerson = document.getElementById('exh-contact-person').value;

            const payload = {
                event_id: eventId,
                company_name: companyName,
                stall_number: stallNumber,
                contact_person: contactPerson,
                display_order: 1,
                status: "active"
            };

            try {
                const res = await fetch(`${API_BASE}/events/exhibitor`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                const json = await res.json();

                if (!res.ok) {
                    throw new Error(json.message || 'Failed to add exhibitor');
                }

                if (json.success) {
                    alert('Exhibitor assigned to stall successfully.');
                    
                    // Add the new exhibitor to the UI instantly
                    const listContainer = document.getElementById('exhibitors-list');
                    if (listContainer) {
                        const newExh = document.createElement('div');
                        newExh.className = 'border border-gray-200 p-4 rounded-lg';
                        newExh.innerHTML = `
                            <h4 class="font-bold text-gray-900">${json.data.company_name}</h4>
                            <p class="text-sm text-gray-500 mb-2">Stall ${json.data.stall_number || 'TBD'}</p>
                            <p class="text-sm text-gray-700">Contact: ${json.data.contact_person || 'N/A'}</p>
                        `;
                        listContainer.prepend(newExh);
                    }
                    
                    closeModal();
                } else {
                    throw new Error(json.message || 'Failed to add exhibitor');
                }
            } catch (err) {
                alert(err.message);
                console.error('Error adding exhibitor:', err);
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // --- Load Event Details ---
    const API_BASE = window.CONFIG.API_BASE_URL;
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('id');

    if (eventId && token) {
        fetch(`${API_BASE}/events/${eventId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        })
        .then(res => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.json();
        })
        .then(json => {
            const evt = json.data || json;
            
            // Populate Basic Info
            const titleEl = document.getElementById('event-title');
            if (titleEl) titleEl.textContent = evt.title || evt.name || 'Untitled Event';
            
            const subtitleEl = document.getElementById('event-subtitle');
            if (subtitleEl) subtitleEl.textContent = evt.venue || evt.location || 'Location TBD';
            
            const descEl = document.getElementById('event-description-display');
            if (descEl) descEl.textContent = evt.description || 'No description provided.';
            
            const feeEl = document.getElementById('event-fee-display');
            if (feeEl) feeEl.textContent = evt.registration_fee ? `₹ ${evt.registration_fee}` : 'Free';
            
            const locEl = document.getElementById('event-location-display');
            if (locEl) {
                const addr = [evt.venue, evt.address, evt.city, evt.state].filter(Boolean).join(', ');
                locEl.textContent = addr || evt.location || 'Location TBD';
            }
            
            const dateEl = document.getElementById('event-date-display');
            if (dateEl) {
                const startStr = evt.start_date || evt.startDate;
                const endStr = evt.end_date || evt.endDate;
                if (startStr && endStr) {
                    const s = new Date(startStr).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
                    const e = new Date(endStr).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
                    dateEl.textContent = s === e ? s : `${s} - ${e}`;
                } else if (startStr) {
                    dateEl.textContent = new Date(startStr).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
                } else {
                    dateEl.textContent = 'Date TBD';
                }
            }
            
            // Handle Image
            const imgData = evt.event_image || evt.image || evt.imageURL || evt.banner;
            if (imgData) {
                let imgUrl = null;
                if (typeof imgData === 'string' && imgData.startsWith('http')) {
                    imgUrl = imgData;
                } else if (window.api && typeof window.api.getImageUrl === 'function') {
                    imgUrl = window.api.getImageUrl(imgData);
                } else {
                    imgUrl = `${API_BASE.replace('/api', '')}/storage/${imgData}`;
                }
                
                if (imgUrl) {
                    const container = document.getElementById('event-image-container');
                    const placeholder = document.getElementById('event-image-placeholder');
                    if (container) {
                        container.style.backgroundImage = `url('${imgUrl}')`;
                        if (placeholder) placeholder.classList.add('hidden');
                    }
                }
            }
        })
        .catch(err => {
            console.error('[Event Details] Error loading event:', err);
        });

        // --- Load Exhibitors ---
        fetch(`${API_BASE}/events/${eventId}/exhibitors`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        })
        .then(res => res.json())
        .then(json => {
            if (json.success && json.data) {
                const exhibitors = Array.isArray(json.data.results) ? json.data.results : (Array.isArray(json.data) ? json.data : []);
                const listContainer = document.getElementById('exhibitors-list');
                
                if (listContainer) {
                    if (exhibitors.length === 0) {
                        listContainer.innerHTML = '<p class="text-sm text-gray-500 col-span-2">No exhibitors assigned to this event yet.</p>';
                    } else {
                        listContainer.innerHTML = exhibitors.map(exh => `
                            <div class="border border-gray-200 p-4 rounded-lg">
                                <h4 class="font-bold text-gray-900">${exh.company_name}</h4>
                                <p class="text-sm text-gray-500 mb-2">Stall ${exh.stall_number || 'TBD'}</p>
                                <p class="text-sm text-gray-700">Contact: ${exh.contact_person || 'N/A'}</p>
                            </div>
                        `).join('');
                    }
                }
            }
        })
        .catch(err => {
            console.error('[Event Details] Error loading exhibitors:', err);
        });

        // --- Load Registrations ---
        fetch(`${API_BASE}/events/${eventId}/registrations`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        })
        .then(res => res.json())
        .then(json => {
            if (json.success && json.data) {
                const registrations = Array.isArray(json.data.results) ? json.data.results : (Array.isArray(json.data) ? json.data : []);
                const regContainer = document.getElementById('registrations-list');
                
                if (regContainer) {
                    if (registrations.length === 0) {
                        regContainer.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center text-sm text-gray-500">No registrations found.</td></tr>';
                    } else {
                        regContainer.innerHTML = registrations.map(reg => {
                            const name = reg.name || reg.memberName || reg.member_name || reg.participant_name || (reg.member && reg.member.name) || `Member #${reg.member_id}`;
                            const phone = reg.phone || reg.memberPhone || reg.member_phone || reg.mobile || (reg.member && reg.member.phone) || '—';
                            const email = reg.email || reg.memberEmail || reg.member_email || (reg.member && reg.member.email) || '';
                            const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                            
                            let statusClass = 'bg-gray-100 text-gray-800';
                            let statusText = reg.registration_status || reg.status || 'Unknown';
                            
                            if (statusText.toLowerCase() === 'approved' || statusText.toLowerCase() === 'registered') {
                                statusClass = 'bg-green-100 text-green-800';
                            } else if (statusText.toLowerCase() === 'pending') {
                                statusClass = 'bg-yellow-100 text-yellow-800';
                            } else if (statusText.toLowerCase() === 'cancelled') {
                                statusClass = 'bg-red-100 text-red-800';
                            }
                            
                            const amount = reg.amount != null ? `₹${reg.amount}` : (reg.payment_amount != null ? `₹${reg.payment_amount}` : '—');
                            const paymentStatus = reg.payment_status || 'N/A';
                            const regCode = reg.registration_code || reg.reg_code || `REG-${String(reg.id).padStart(5,'0')}`;

                            return `
                                <tr>
                                  <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="flex items-center">
                                      <div class="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                                        <span class="text-xs font-medium text-gray-600">${initials}</span>
                                      </div>
                                      <div>
                                        <div class="text-sm font-medium text-gray-900">${name}</div>
                                        <div class="text-xs text-gray-500">${regCode}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="text-sm text-gray-900 flex items-center">
                                        <i data-lucide="phone" class="h-3 w-3 mr-1 text-gray-400"></i> ${phone}
                                    </div>
                                    ${email ? `<div class="text-xs text-gray-500 mt-1">${email}</div>` : ''}
                                  </td>
                                  <td class="px-6 py-4 whitespace-nowrap">
                                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">
                                      ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}
                                    </span>
                                  </td>
                                  <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="text-sm font-medium text-gray-900">${amount}</div>
                                    <div class="text-xs text-gray-400 mt-1">Payment: ${paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)}</div>
                                  </td>
                                </tr>
                            `;
                        }).join('');
                    }
                    
                    if (window.lucide) lucide.createIcons();

                    // --- Calculate Overview Stats ---
                    const totalCountEl = document.getElementById('reg-total-count');
                    const attendedCountEl = document.getElementById('reg-attended-count');
                    const pendingCountEl = document.getElementById('reg-pending-count');
                    const totalFeesEl = document.getElementById('reg-total-fees');

                    let attendedCount = 0;
                    let pendingCount = 0;
                    let paidCount = 0;

                    registrations.forEach(reg => {
                        if (reg.attendance_status && reg.attendance_status.toLowerCase() === 'attended') attendedCount++;
                        if (reg.registration_status && reg.registration_status.toLowerCase() === 'pending') pendingCount++;
                        if (reg.payment_status && reg.payment_status.toLowerCase() === 'paid') paidCount++;
                    });

                    if (totalCountEl) totalCountEl.textContent = registrations.length;
                    if (attendedCountEl) attendedCountEl.textContent = attendedCount;
                    if (pendingCountEl) pendingCountEl.textContent = pendingCount;

                    const feeDisplay = document.getElementById('event-fee-display');
                    let feeAmount = 0;
                    if (feeDisplay && feeDisplay.textContent.includes('₹')) {
                        feeAmount = parseFloat(feeDisplay.textContent.replace(/[^\d.-]/g, '')) || 0;
                    }
                    if (totalFeesEl) {
                        const totalRevenue = feeAmount * paidCount;
                        if (totalRevenue >= 1000) {
                            totalFeesEl.textContent = `₹${(totalRevenue/1000).toFixed(1)}k`;
                        } else {
                            totalFeesEl.textContent = `₹${totalRevenue}`;
                        }
                    }

                    // --- Export CSV Functionality ---
                    const exportCsvBtn = document.getElementById('export-csv-btn');
                    if (exportCsvBtn) {
                        // Remove old listeners by replacing clone
                        const newBtn = exportCsvBtn.cloneNode(true);
                        exportCsvBtn.parentNode.replaceChild(newBtn, exportCsvBtn);
                        
                        newBtn.addEventListener('click', (e) => {
                            e.preventDefault();
                            if (registrations.length === 0) {
                                alert('No registrations to export.');
                                return;
                            }

                            const headers = ['Registration ID', 'Member ID', 'Registration Status', 'Payment Status', 'Attendance Status', 'QR Code Ref', 'Created At'];
                            const csvRows = [];
                            csvRows.push(headers.join(','));

                            registrations.forEach(reg => {
                                const row = [
                                    reg.id,
                                    reg.member_id,
                                    reg.registration_status || '',
                                    reg.payment_status || '',
                                    reg.attendance_status || '',
                                    reg.qr_code_ref || '',
                                    reg.created_at || ''
                                ];
                                const escapedRow = row.map(cell => {
                                    if (cell === null || cell === undefined) return '""';
                                    const str = String(cell);
                                    return `"${str.replace(/"/g, '""')}"`;
                                });
                                csvRows.push(escapedRow.join(','));
                            });

                            const csvContent = "data:text/csv;charset=utf-8," + csvRows.join('\\n');
                            const encodedUri = encodeURI(csvContent);
                            const link = document.createElement('a');
                            link.setAttribute('href', encodedUri);
                            link.setAttribute('download', `event_${eventId}_registrations.csv`);
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        });
                    }
                }
            }
        })
        .catch(err => {
            console.error('[Event Details] Error loading registrations:', err);
        });

    } else {
        console.warn('[Event Details] No event ID provided in URL');
    }
});
