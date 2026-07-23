document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    let allVendors = [];

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
        fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }).catch(error => console.error('[Logout] Error:', error));
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

    // Modal elements
    const modalOverlay = document.getElementById('modal-overlay');
    const addVendorModal = document.getElementById('add-vendor-modal');
    
    // Buttons to toggle modal
    const addVendorBtn = document.getElementById('add-vendor-btn');
    const closeAddVendorBtn = document.getElementById('close-add-vendor');
    const cancelVendorBtn = document.getElementById('cancel-vendor-btn');
    const addVendorForm = document.getElementById('add-vendor-form');

    // Function to open modal
    const openModal = () => {
        modalOverlay.classList.remove('hidden');
        addVendorModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    };

    // Function to close modal
    const closeModal = () => {
        modalOverlay.classList.add('hidden');
        addVendorModal.classList.add('hidden');
        document.body.style.overflow = '';
        addVendorForm.reset();
    };

    if (addVendorBtn) {
        addVendorBtn.addEventListener('click', () => {
            document.getElementById('vendor-modal-title').textContent = 'Add New Vendor';
            document.getElementById('vendor-modal-subtitle').textContent = 'Register a new vendor in the Mandapam Association';
            document.getElementById('vendor-submit-text').textContent = 'Add Vendor';
            document.getElementById('vendor-id-input').value = '';
            addVendorForm.reset();
            openModal();
        });
    }
    if (closeAddVendorBtn) closeAddVendorBtn.addEventListener('click', closeModal);
    if (cancelVendorBtn) cancelVendorBtn.addEventListener('click', closeModal);

    // Close modal when clicking outside
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeModal();
                const viewVendorModal = document.getElementById('view-vendor-modal');
                if (viewVendorModal) viewVendorModal.classList.add('hidden');
            }
        });
    }

    // Form submission
    if (addVendorForm) {
        addVendorForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('vendor-submit-btn');
            const originalContent = submitBtn.innerHTML;
            
            submitBtn.innerHTML = `
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
            `;
            submitBtn.disabled = true;

            const vendorId = document.getElementById('vendor-id-input').value;
            const isEdit = !!vendorId;
            const formData = new FormData(addVendorForm);

            // Map form field names (snake_case) → API field names (camelCase)
            const FIELD_MAP = {
                'name':          'name',
                'business_name': 'businessName',
                'business_type': 'businessType',
                'phone':         'phone',
                'email':         'email',
                'address':       'address',
                'city':          'city',
                'district':      'district',
                'state':         'state',
                'pincode':       'pincode',
                'status':        'status',
                'description':   'description',
            };

            const payload = {};
            for (const [formField, apiField] of Object.entries(FIELD_MAP)) {
                const val = formData.get(formField);
                if (val && val.trim() !== '') {
                    payload[apiField] = val.trim();
                    payload[formField] = val.trim();
                }
            }

            // associationId is required by the backend
            payload.associationId = 1;

    const API_BASE = window.CONFIG.API_BASE_URL;
            const endpoint = isEdit ? `${API_BASE}/vendors/${vendorId}` : `${API_BASE}/vendors`;
            const method = isEdit ? 'PUT' : 'POST';

            console.log(`[Vendors] ${method} ${endpoint}`, payload);

            try {
                const res = await fetch(endpoint, {
                    method,
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload),
                    cache: 'no-store'
                });
                
                const json = await res.json();
                
                if (res.ok && (json.success || json.vendor)) {
                    closeModal();
                    loadVendors(true); // silent refresh — keep table visible while updating
                    alert(`Vendor ${isEdit ? 'updated' : 'added'} successfully!`);
                } else {
                    const msg = json.message || json.error || 'Operation failed. Please try again.';
                    alert(`Error: ${msg}`);
                }
            } catch (error) {
                console.error('[Vendors] Save error:', error);
                alert('Network error. Please check your connection and try again.');
            } finally {
                submitBtn.innerHTML = originalContent;
                submitBtn.disabled = false;
                // Scope lucide to the modal only — not the whole page
                const addVendorModal = document.getElementById('add-vendor-modal');
                if (window.lucide && addVendorModal) {
                    lucide.createIcons({ nameAttr: 'data-lucide', attrs: {}, nodes: [addVendorModal] });
                }
            }
        });
    }

    // Load Vendors Function
    // silent=true means don't clear the table while fetching (used by Refresh)
    async function loadVendors(silent = false) {
        const tableBody = document.getElementById('vendors-table-body');
        const totalCount = document.getElementById('total-count');
    const API_BASE = window.CONFIG.API_BASE_URL;

        if (!tableBody) return;

        // Only show loading state on first load, not on manual refresh
        if (!silent) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-6 py-10 text-center text-gray-400">
                        <div class="flex flex-col items-center justify-center">
                            <svg class="animate-spin h-8 w-8 mb-2 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                            </svg>
                            <p>Loading vendors...</p>
                        </div>
                    </td>
                </tr>
            `;
        }

        try {
            const res = await fetch(`${API_BASE}/vendors`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                cache: 'no-store'  // Always bypass HTTP cache for fresh data
            });

            if (!res.ok) throw new Error('Failed to fetch vendors');

            const json = await res.json();
            
            if (Array.isArray(json)) {
                allVendors = json;
                if (totalCount) totalCount.textContent = allVendors.length;
                applyFilters();
            } else if (json.data && Array.isArray(json.data)) {
                allVendors = json.data;
                if (totalCount) totalCount.textContent = json.total || allVendors.length;
                applyFilters();
            } else if (json.success && json.vendors) {
                allVendors = json.vendors;
                if (totalCount) totalCount.textContent = json.total || allVendors.length;
                applyFilters();
            } else {
                throw new Error(json.message || 'Invalid API response format');
            }
        } catch (error) {
            console.error('[Vendors] Error loading vendors:', error);
            // Only replace table on error if we already cleared it
            if (!silent || allVendors.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="7" class="px-6 py-10 text-center text-red-500">
                            <div class="flex flex-col items-center justify-center">
                                <i data-lucide="alert-circle" class="h-8 w-8 text-red-400 mb-2"></i>
                                <p>Failed to load vendors. Please try again.</p>
                            </div>
                        </td>
                    </tr>
                `;
                if (window.lucide) lucide.createIcons();
            }
        }
    }

    // Render Vendors based on filtered array
    function renderVendors(vendorsToRender) {
        const tableBody = document.getElementById('vendors-table-body');
        const showingCount = document.getElementById('showing-count');
        
        if (!tableBody) return;
        
        if (showingCount) showingCount.textContent = vendorsToRender.length || 0;

        if (vendorsToRender.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-6 py-10 text-center text-gray-500">
                        <div class="flex flex-col items-center justify-center">
                            <i data-lucide="inbox" class="h-8 w-8 text-gray-400 mb-2"></i>
                            <p>No vendors found matching your criteria</p>
                        </div>
                    </td>
                </tr>
            `;
        } else {
            tableBody.innerHTML = vendorsToRender.map(vendor => {
                // Determine status badge color
                let statusColor = 'bg-gray-100 text-gray-800';
                if (vendor.status === 'Active') statusColor = 'bg-green-100 text-green-800';
                else if (vendor.status === 'Pending') statusColor = 'bg-yellow-100 text-yellow-800';
                else if (vendor.status === 'Suspended') statusColor = 'bg-red-100 text-red-800';

                // Format dates securely
                const joinedDate = vendor.created_at ? new Date(vendor.created_at).toLocaleDateString() : 'N/A';

                return `
                    <tr class="hover:bg-gray-50 transition-colors">
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div>
                                <div class="text-sm font-medium text-gray-900">${vendor.name || 'N/A'}</div>
                                <div class="text-sm text-gray-500">${vendor.business_name || 'N/A'}</div>
                            </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div>
                                <div class="text-sm text-gray-900">+91 ${vendor.phone || 'N/A'}</div>
                                <div class="text-sm text-gray-500">${vendor.email || 'N/A'}</div>
                            </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div>
                                <div class="text-sm text-gray-900">${vendor.city || 'N/A'}</div>
                                <div class="text-sm text-gray-500">${vendor.city || ''}, ${vendor.state || ''}</div>
                            </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                ${vendor.business_type || 'N/A'}
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColor}">
                                ${vendor.status || 'Unknown'}
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div>Joined: ${joinedDate}</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div class="flex space-x-2">
                                <button class="text-blue-600 hover:text-blue-900 p-1 view-vendor-btn" data-id="${vendor.id}" title="View Details">
                                    <i data-lucide="eye" class="h-4 w-4 pointer-events-none"></i>
                                </button>
                                <button class="text-yellow-600 hover:text-yellow-900 p-1 edit-vendor-btn" data-id="${vendor.id}" title="Edit Vendor">
                                    <i data-lucide="edit" class="h-4 w-4 pointer-events-none"></i>
                                </button>
                                <button class="text-red-600 hover:text-red-900 p-1 delete-vendor-btn" data-id="${vendor.id}" title="Delete Vendor">
                                    <i data-lucide="trash-2" class="h-4 w-4 pointer-events-none"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        }
        
        // Re-initialize lucide icons ONLY within the table to avoid replacing the refresh button icon
        if (window.lucide) {
            lucide.createIcons({ nameAttr: 'data-lucide', attrs: {}, nodes: [tableBody] });
        }
    }

    // Apply filters logic
    function applyFilters() {
        const searchInput = document.getElementById('search-vendor');
        const cityFilter = document.getElementById('filter-city');
        const categoryFilter = document.getElementById('filter-category');
        const statusFilter = document.getElementById('filter-status');

        const searchVal = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const cityVal = cityFilter ? cityFilter.value.toLowerCase().trim() : '';
        const categoryVal = categoryFilter ? categoryFilter.value.toLowerCase().trim() : '';
        const statusVal = statusFilter ? statusFilter.value.toLowerCase().trim() : '';

        const filtered = allVendors.filter(v => {
            const matchesSearch = !searchVal || 
                (v.name && v.name.toLowerCase().includes(searchVal)) || 
                (v.business_name && v.business_name.toLowerCase().includes(searchVal)) ||
                (v.email && v.email.toLowerCase().includes(searchVal)) ||
                (v.phone && v.phone.includes(searchVal));
            
            const matchesCity = !cityVal || (v.city && v.city.toLowerCase() === cityVal);
            const matchesCategory = !categoryVal || (v.business_type && v.business_type.toLowerCase() === categoryVal);
            const matchesStatus = !statusVal || (v.status && v.status.toLowerCase() === statusVal);

            return matchesSearch && matchesCity && matchesCategory && matchesStatus;
        });

        renderVendors(filtered);
    }

    // Bind filter event listeners
    const searchInput = document.getElementById('search-vendor');
    const cityFilter = document.getElementById('filter-city');
    const categoryFilter = document.getElementById('filter-category');
    const statusFilter = document.getElementById('filter-status');
    
    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (cityFilter) cityFilter.addEventListener('change', applyFilters);
    if (categoryFilter) categoryFilter.addEventListener('change', applyFilters);
    if (statusFilter) statusFilter.addEventListener('change', applyFilters);

    // Action handlers
    const tableBody = document.getElementById('vendors-table-body');
    if (tableBody) {
        tableBody.addEventListener('click', (e) => {
            const viewBtn = e.target.closest('.view-vendor-btn');
            const editBtn = e.target.closest('.edit-vendor-btn');
            const deleteBtn = e.target.closest('.delete-vendor-btn');

            if (viewBtn) handleViewVendor(parseInt(viewBtn.dataset.id, 10));
            else if (editBtn) handleEditVendor(parseInt(editBtn.dataset.id, 10));
            else if (deleteBtn) handleDeleteVendor(parseInt(deleteBtn.dataset.id, 10));
        });
    }

    function handleEditVendor(id) {
        const vendor = allVendors.find(v => v.id === id);
        if (!vendor) return;

        document.getElementById('vendor-modal-title').textContent = 'Edit Vendor';
        document.getElementById('vendor-modal-subtitle').textContent = 'Update vendor details';
        document.getElementById('vendor-submit-text').textContent = 'Save Changes';
        document.getElementById('vendor-id-input').value = vendor.id;
        
        // Populate form
        if (addVendorForm.elements['name']) addVendorForm.elements['name'].value = vendor.name || '';
        if (addVendorForm.elements['business_name']) addVendorForm.elements['business_name'].value = vendor.business_name || '';
        if (addVendorForm.elements['business_type']) addVendorForm.elements['business_type'].value = vendor.business_type || '';
        if (addVendorForm.elements['status']) addVendorForm.elements['status'].value = vendor.status || '';
        if (addVendorForm.elements['created_at']) addVendorForm.elements['created_at'].value = vendor.created_at ? vendor.created_at.split(' ')[0] : '';
        if (addVendorForm.elements['phone']) addVendorForm.elements['phone'].value = vendor.phone || '';
        if (addVendorForm.elements['email']) addVendorForm.elements['email'].value = vendor.email || '';
        if (addVendorForm.elements['address']) addVendorForm.elements['address'].value = vendor.address || '';
        if (addVendorForm.elements['state']) addVendorForm.elements['state'].value = vendor.state || '';
        if (addVendorForm.elements['district']) addVendorForm.elements['district'].value = vendor.district || '';
        if (addVendorForm.elements['city']) addVendorForm.elements['city'].value = vendor.city || '';
        if (addVendorForm.elements['pincode']) addVendorForm.elements['pincode'].value = vendor.pincode || '';
        if (addVendorForm.elements['description']) addVendorForm.elements['description'].value = vendor.description || '';

        openModal();
    }

    async function handleDeleteVendor(id) {
        const vendor = allVendors.find(v => v.id === id);
        const vendorName = vendor ? vendor.name : `Vendor #${id}`;

        if (!confirm(`Are you sure you want to delete "${vendorName}"?\nThis action cannot be undone.`)) return;

        // Optimistically remove row from table immediately for fast UX
        const rowBtn = document.querySelector(`.delete-vendor-btn[data-id="${id}"]`);
        const row = rowBtn ? rowBtn.closest('tr') : null;
        if (row) {
            row.style.opacity = '0.4';
            row.style.pointerEvents = 'none';
        }

        try {
    const API_BASE = window.CONFIG.API_BASE_URL;
            const res = await fetch(`${API_BASE}/vendors/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                cache: 'no-store'
            });

            const json = await res.json();

            if (res.ok && json.success) {
                // Remove from local cache immediately — no need to re-fetch
                allVendors = allVendors.filter(v => v.id !== id);
                applyFilters(); // re-render with the item removed
                
                // Update total count
                const totalCount = document.getElementById('total-count');
                if (totalCount) totalCount.textContent = allVendors.length;

                console.log(`[Vendors] Deleted vendor ${id}:`, json.message);
            } else {
                // Restore row visibility on failure
                if (row) {
                    row.style.opacity = '';
                    row.style.pointerEvents = '';
                }
                const msg = json.message || json.error || 'Failed to delete vendor.';
                alert(`Error: ${msg}`);
            }
        } catch (error) {
            console.error('[Vendors] Delete error:', error);
            // Restore row on network error
            if (row) {
                row.style.opacity = '';
                row.style.pointerEvents = '';
            }
            alert('Network error. Could not delete vendor. Please try again.');
        }
    }

    const viewVendorModal = document.getElementById('view-vendor-modal');
    const closeViewVendorBtn = document.getElementById('close-view-vendor');
    const viewVendorContent = document.getElementById('view-vendor-content');

    if (closeViewVendorBtn) {
        closeViewVendorBtn.addEventListener('click', () => {
            modalOverlay.classList.add('hidden');
            viewVendorModal.classList.add('hidden');
            document.body.style.overflow = '';
        });
    }

    function handleViewVendor(id) {
        const vendor = allVendors.find(v => v.id === id);
        if (!vendor) return;

        viewVendorContent.innerHTML = `
            <div class="grid grid-cols-2 gap-4 text-sm">
                <div><span class="text-gray-500">Name:</span> <br><span class="font-medium text-gray-900">${vendor.name || 'N/A'}</span></div>
                <div><span class="text-gray-500">Business:</span> <br><span class="font-medium text-gray-900">${vendor.business_name || 'N/A'}</span></div>
                <div><span class="text-gray-500">Email:</span> <br><span class="font-medium text-gray-900">${vendor.email || 'N/A'}</span></div>
                <div><span class="text-gray-500">Phone:</span> <br><span class="font-medium text-gray-900">${vendor.phone || 'N/A'}</span></div>
                <div><span class="text-gray-500">Category:</span> <br><span class="font-medium text-gray-900">${vendor.business_type || 'N/A'}</span></div>
                <div><span class="text-gray-500">Status:</span> <br><span class="font-medium text-gray-900">${vendor.status || 'N/A'}</span></div>
                <div class="col-span-2"><span class="text-gray-500">Address:</span> <br><span class="font-medium text-gray-900">${vendor.address || ''}, ${vendor.city || ''}, ${vendor.district || ''}, ${vendor.state || ''} - ${vendor.pincode || ''}</span></div>
            </div>
        `;

        modalOverlay.classList.remove('hidden');
        viewVendorModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    // Refresh and Export handlers
    const refreshVendorsBtn = document.getElementById('refresh-vendors-btn');
    const exportVendorsBtn = document.getElementById('export-vendors-btn');

    if (refreshVendorsBtn) {
        refreshVendorsBtn.addEventListener('click', () => {
            refreshVendorsBtn.disabled = true;
            // Mark the button so we can find/animate its icon via CSS
            refreshVendorsBtn.classList.add('refreshing');
            
            loadVendors(true).finally(() => {
                refreshVendorsBtn.classList.remove('refreshing');
                refreshVendorsBtn.disabled = false;
            });
        });
    }

    if (exportVendorsBtn) {
        exportVendorsBtn.addEventListener('click', () => {
            if (!allVendors || allVendors.length === 0) {
                alert('No vendors available to export.');
                return;
            }

            // Create CSV headers
            const headers = ['ID', 'Name', 'Business Name', 'Category', 'Status', 'Phone', 'Email', 'City', 'State', 'Joined Date'];
            
            // Map data to CSV rows
            const csvRows = [headers.join(',')];
            
            allVendors.forEach(vendor => {
                const row = [
                    vendor.id || '',
                    `"${(vendor.name || '').replace(/"/g, '""')}"`,
                    `"${(vendor.business_name || '').replace(/"/g, '""')}"`,
                    `"${(vendor.business_type || '').replace(/"/g, '""')}"`,
                    `"${(vendor.status || '').replace(/"/g, '""')}"`,
                    `"${(vendor.phone || '').replace(/"/g, '""')}"`,
                    `"${(vendor.email || '').replace(/"/g, '""')}"`,
                    `"${(vendor.city || '').replace(/"/g, '""')}"`,
                    `"${(vendor.state || '').replace(/"/g, '""')}"`,
                    `"${(vendor.created_at || '').replace(/"/g, '""')}"`
                ];
                csvRows.push(row.join(','));
            });

            // Create blob and download
            const csvString = csvRows.join('\n');
            const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', `vendors_export_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }

    // Initial load
    loadVendors();
});
