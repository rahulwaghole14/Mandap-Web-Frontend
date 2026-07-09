document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    if (user.name) {
        const userNameEl = document.getElementById('user-name');
        if (userNameEl) userNameEl.textContent = user.name;
    }

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

    // Modal System
    const modalContainer = document.getElementById('modal-container');
    const modals = {
        form: document.getElementById('member-form-modal'),
        view: document.getElementById('view-member-modal'),
        import: document.getElementById('import-csv-modal'),
        delete: document.getElementById('delete-member-modal')
    };

    const closeAllModals = () => {
        modalContainer.classList.add('hidden');
        Object.values(modals).forEach(modal => modal.classList.add('hidden'));
        document.body.style.overflow = '';
    };

    const openModal = (modalName) => {
        closeAllModals();
        if (modals[modalName]) {
            modalContainer.classList.remove('hidden');
            modals[modalName].classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    };

    // Close buttons binding
    document.querySelectorAll('.close-modal-btn').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });

    // Close on overlay click
    document.getElementById('modal-overlay').addEventListener('click', closeAllModals);

    // Header buttons
    document.getElementById('open-add-modal').addEventListener('click', () => {
        document.getElementById('form-modal-title').textContent = 'Add Member';
        document.getElementById('member-form').reset();
        currentEditMemberId = null;
        openModal('form');
    });

    document.getElementById('open-import-modal').addEventListener('click', () => {
        openModal('import');
    });

    let allMembers = [];
    const tableBody = document.getElementById('members-table-body');

    const loadMembers = async () => {
        try {
            const API_BASE = window.CONFIG.API_BASE_URL;
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/members`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            
            if (json.success && json.data && Array.isArray(json.data.results)) {
                allMembers = json.data.results;
            } else if (Array.isArray(json)) {
                allMembers = json;
            } else {
                allMembers = [];
            }
            
            // Populate city filter dynamically
            const cityFilter = document.getElementById('city-filter');
            if (cityFilter) {
                const uniqueCities = [...new Set(allMembers.map(m => {
                    const parts = (m.address || '').split(',');
                    return parts.length >= 2 ? parts[parts.length - 2].trim() : m.address?.trim();
                }).filter(Boolean))].sort();
                
                cityFilter.innerHTML = '<option value="">All Cities</option>' + 
                    uniqueCities.map(city => `<option value="${city}">${city}</option>`).join('');
            }

            // Populate type filter dynamically
            const typeFilter = document.getElementById('type-filter');
            if (typeFilter) {
                const uniqueTypes = [...new Set(allMembers.map(m => m.type?.trim()).filter(Boolean))].sort();
                typeFilter.innerHTML = '<option value="">Business Type</option>' + 
                    uniqueTypes.map(t => `<option value="${t}">${t}</option>`).join('');
            }
            
            applyFilters();
        } catch (err) {
            console.error('[Members] Failed to load members:', err);
            if (tableBody) {
                tableBody.innerHTML = `<tr><td colspan="6" class="px-6 py-4 text-center text-red-500">Failed to load members</td></tr>`;
            }
        }
    };

    const renderMembers = (members) => {
        if (!tableBody) return;
        if (members.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">No members found.</td></tr>`;
            return;
        }

        tableBody.innerHTML = members.map(m => {
            const initials = (m.first_name?.[0] || '') + (m.last_name?.[0] || '');
            const fullName = `${m.first_name || ''} ${m.last_name || ''}`.trim();
            const location = m.address || 'N/A';
            const status = m.status || 'Active';
            const badgeClass = status.toLowerCase() === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';

            return `
            <tr class="hover:bg-gray-50 transition-colors member-row" data-id="${m.id}">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                    <div class="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <span class="text-sm font-medium text-primary-700">${initials}</span>
                    </div>
                    <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">${fullName}</div>
                        <div class="text-sm text-gray-500">ID: ${m.membership_number || 'N/A'}</div>
                    </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div>
                    <div class="text-sm text-gray-900">${m.business || 'N/A'}</div>
                    <div class="text-sm text-gray-500">${m.mobile || 'N/A'}</div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${location}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    ${m.type || 'N/A'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">Assoc #${m.association_id || 'N/A'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex space-x-2">
                    <button class="text-blue-600 hover:text-blue-900 p-1 view-btn" title="View Details">
                        <i data-lucide="eye" class="h-4 w-4"></i>
                    </button>
                    <button class="text-yellow-600 hover:text-yellow-900 p-1 edit-btn" title="Edit Member">
                        <i data-lucide="edit" class="h-4 w-4"></i>
                    </button>
                    <button class="text-red-600 hover:text-red-900 p-1 delete-btn" title="Delete Member">
                        <i data-lucide="trash-2" class="h-4 w-4"></i>
                    </button>
                    </div>
                </td>
            </tr>`;
        }).join('');
        if (window.lucide) lucide.createIcons();
    };

    const applyFilters = () => {
        const searchInput = document.getElementById('search-input');
        const cityFilter = document.getElementById('city-filter');
        const typeFilter = document.getElementById('type-filter');

        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        const selectedCity = cityFilter ? cityFilter.value.toLowerCase() : '';
        const selectedType = typeFilter ? typeFilter.value.toLowerCase() : '';

        const filtered = allMembers.filter(m => {
            const fullName = `${m.first_name || ''} ${m.last_name || ''}`.toLowerCase();
            const email = (m.email || '').toLowerCase();
            const mobile = (m.mobile || '').toLowerCase();
            const address = (m.address || '').toLowerCase();
            const type = (m.type || '').toLowerCase();

            const matchesSearch = !searchTerm || 
                fullName.includes(searchTerm) || 
                email.includes(searchTerm) || 
                mobile.includes(searchTerm);
            
            const matchesCity = !selectedCity || address.includes(selectedCity);
            const matchesType = !selectedType || type === selectedType;

            return matchesSearch && matchesCity && matchesType;
        });

        renderMembers(filtered);
    };

    // Attach event listeners to filters
    ['search-input', 'city-filter', 'type-filter'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener(id === 'search-input' ? 'input' : 'change', applyFilters);
        }
    });

    if (tableBody) {
        tableBody.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;
            const row = btn.closest('tr');
            if (!row) return;
            
            const memberId = row.getAttribute('data-id');
            const member = allMembers.find(m => m.id.toString() === memberId);
            if (!member) return;

            if (btn.classList.contains('view-btn')) {
                document.getElementById('view-name').textContent = `${member.first_name || ''} ${member.last_name || ''}`;
                document.getElementById('view-id').textContent = member.membership_number || 'N/A';
                document.getElementById('view-business').textContent = member.business || 'N/A';
                document.getElementById('view-type').textContent = member.type || 'N/A';
                document.getElementById('view-phone').textContent = member.mobile || 'N/A';
                document.getElementById('view-location').textContent = member.address || 'N/A';
                openModal('view');
            } else if (btn.classList.contains('edit-btn')) {
                document.getElementById('form-modal-title').textContent = 'Edit Member';
                currentEditMemberId = memberId;
                document.getElementById('member-name').value = `${member.first_name || ''} ${member.last_name || ''}`.trim();
                document.getElementById('member-phone').value = member.mobile || '';
                
                const businessEl = document.getElementById('member-business');
                if (businessEl) businessEl.value = member.business || '';
                
                const typeEl = document.getElementById('member-type');
                if (typeEl) {
                    // Check if the option exists, if not, create it
                    let optionExists = Array.from(typeEl.options).some(opt => opt.value === member.type);
                    if (!optionExists && member.type) {
                        const newOpt = new Option(member.type, member.type);
                        typeEl.add(newOpt);
                    }
                    typeEl.value = member.type || '';
                }
                
                // Try parsing address to fill city/district roughly
                const parts = (member.address || '').split(',');
                if (parts.length >= 2) {
                    document.getElementById('member-city').value = parts[parts.length - 2].trim();
                    document.getElementById('member-district').value = parts[parts.length - 1].trim();
                } else {
                    document.getElementById('member-city').value = member.address || '';
                }
                openModal('form');
            } else if (btn.classList.contains('delete-btn')) {
                currentDeleteMemberId = memberId;
                openModal('delete');
            }
        });
    }

    // Load initial data
    loadMembers();

    // Form Submissions (Mock & Edit API Integration)
    let currentEditMemberId = null;
    
    const saveBtn = document.getElementById('save-member-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const form = document.getElementById('member-form');
            if (form.checkValidity()) {
                const prevText = saveBtn.innerHTML;
                saveBtn.innerHTML = '<i data-lucide="loader-2" class="h-4 w-4 animate-spin mr-2"></i> Saving...';
                saveBtn.disabled = true;
                if (window.lucide) lucide.createIcons();

                try {
                    // 1. Prepare Payload
                    const fullName = document.getElementById('member-name').value.trim();
                    const nameParts = fullName.split(' ');
                    const firstName = nameParts[0];
                    const lastName = nameParts.slice(1).join(' ') || ' ';
                    
                    const address = document.getElementById('member-city').value + ', ' + document.getElementById('member-district').value;
                    
                    const uniqueSuffix = Date.now().toString().slice(-6);
                    const isEdit = !!currentEditMemberId;
                    let existingMember = null;
                    if (isEdit) {
                        existingMember = allMembers.find(m => m.id.toString() === currentEditMemberId.toString());
                    }
                    
                    const payload = {
                        first_name: firstName,
                        last_name: lastName,
                        mobile: document.getElementById('member-phone').value,
                        email: existingMember?.email || `user${uniqueSuffix}@example.com`,
                        gender: existingMember?.gender || "Male",
                        dob: existingMember?.dob || "1992-09-14",
                        business: document.getElementById('member-business') ? document.getElementById('member-business').value : existingMember?.business || "",
                        type: document.getElementById('member-type') ? document.getElementById('member-type').value : existingMember?.type || "",
                        address: address,
                        association_id: existingMember?.association_id || 5,
                        membership_number: existingMember?.membership_number || `MEM-${uniqueSuffix}`,
                        status: existingMember?.status || "Active"
                    };

                    const API_BASE = window.CONFIG.API_BASE_URL;
                    const token = localStorage.getItem('token');

                    // 2. Determine Endpoint and Method
                    const endpoint = isEdit ? `${API_BASE}/members/${currentEditMemberId}` : `${API_BASE}/members`;
                    const method = isEdit ? 'PUT' : 'POST';

                    // 3. Make the API Call
                    const res = await fetch(endpoint, {
                        method: method,
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(payload)
                    });

                    const json = await res.json();
                    
                    if (!res.ok) {
                        let errorMsg = json.message || `Failed to ${isEdit ? 'update' : 'create'} member`;
                        // Extract detailed validation errors from Laravel if present
                        if (json.errors && typeof json.errors === 'object') {
                            const details = Object.values(json.errors).flat().join(', ');
                            if (details) errorMsg += `: ${details}`;
                        }
                        throw new Error(errorMsg);
                    }
                    
                    alert(`Member ${isEdit ? 'updated' : 'created'} successfully!`);
                    currentEditMemberId = null;
                    await loadMembers(); // Refresh the table
                } catch (err) {
                    console.error('[Members] Form Submission Error:', err);
                    alert(err.message || 'An error occurred while saving the member.');
                } finally {
                    saveBtn.innerHTML = prevText;
                    saveBtn.disabled = false;
                    closeAllModals();
                }
            } else {
                form.reportValidity();
            }
        });
    }

    let currentDeleteMemberId = null;
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', async () => {
            if (!currentDeleteMemberId) return;

            const prevText = confirmDeleteBtn.innerHTML;
            confirmDeleteBtn.innerHTML = '<i data-lucide="loader-2" class="h-4 w-4 animate-spin mr-2"></i> Deleting...';
            confirmDeleteBtn.disabled = true;
            if (window.lucide) lucide.createIcons();

            try {
                const API_BASE = window.CONFIG.API_BASE_URL;
                const token = localStorage.getItem('token');
                
                const res = await fetch(`${API_BASE}/members/${currentDeleteMemberId}`, {
                    method: 'DELETE',
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });

                const json = await res.json();
                
                if (!res.ok) {
                    let errorMsg = json.message || 'Failed to delete member';
                    if (json.errors && typeof json.errors === 'object') {
                        const details = Object.values(json.errors).flat().join(', ');
                        if (details) errorMsg += `: ${details}`;
                    }
                    throw new Error(errorMsg);
                }
                
                alert('Member deleted successfully!');
                currentDeleteMemberId = null;
                await loadMembers();
                closeAllModals();
            } catch (err) {
                console.error('[Members] Delete Error:', err);
                alert(err.message || 'An error occurred while deleting the member.');
            } finally {
                confirmDeleteBtn.innerHTML = prevText;
                confirmDeleteBtn.disabled = false;
            }
        });
    }

    const processImportBtn = document.getElementById('process-import-btn');
    const csvInput = document.getElementById('csv-upload-input');
    
    if (csvInput) {
        csvInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const textEl = csvInput.parentElement.querySelector('p.text-gray-600');
                if (textEl) textEl.textContent = `Selected: ${file.name}`;
            }
        });
    }

    if (processImportBtn && csvInput) {
        processImportBtn.addEventListener('click', async () => {
            const file = csvInput.files[0];
            if (!file) {
                alert('Please select a CSV file first.');
                return;
            }
            
            const prevText = processImportBtn.innerHTML;
            processImportBtn.innerHTML = '<i data-lucide="loader-2" class="h-4 w-4 animate-spin mr-2"></i> Processing...';
            processImportBtn.disabled = true;
            if (window.lucide) lucide.createIcons();

            try {
                const text = await file.text();
                const lines = text.split('\n').map(l => l.trim()).filter(l => l);
                if (lines.length <= 1) throw new Error('CSV is empty or missing data rows.');
                
                const API_BASE = window.CONFIG.API_BASE_URL;
                const token = localStorage.getItem('token');
                let successCount = 0;
                let errorCount = 0;

                for (let i = 1; i < lines.length; i++) {
                    const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
                    if (cols.length < 2) continue;
                    let fullName = cols[0] || 'Unknown';
                    if (fullName.length < 2) fullName += 'User';
                    
                    const nameParts = fullName.split(' ');
                    let firstName = nameParts[0];
                    if (firstName.length < 2) firstName += 'X';
                    
                    let lastName = nameParts.slice(1).join(' ').trim();
                    if (!lastName) lastName = 'User';
                    
                    let phone = cols[1] || '';
                    phone = phone.replace(/[^0-9]/g, ''); // strip non-numeric
                    if (phone.length < 10) phone = phone.padEnd(10, '0');
                    if (phone.length > 10) phone = phone.slice(0, 10);
                    
                    const city = cols[4] || '';
                    const district = cols[5] || '';
                    const address = (city && district) ? `${city}, ${district}` : (city || district || 'Unknown');
                    
                    const uniqueSuffix = Date.now().toString().slice(-6) + i;
                    
                    const payload = {
                        first_name: firstName,
                        last_name: lastName,
                        mobile: phone,
                        email: `user${uniqueSuffix}@example.com`,
                        gender: "Male",
                        dob: "1992-09-14",
                        business: cols[2] || 'Unknown',
                        type: cols[3] || 'Unknown',
                        address: address,
                        association_id: 5,
                        membership_number: `MEM-${uniqueSuffix}`,
                        status: "Active"
                    };

                    try {
                        const res = await fetch(`${API_BASE}/members`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify(payload)
                        });
                        
                        if (res.ok) {
                            successCount++;
                        } else {
                            errorCount++;
                            console.warn(`[Import] Failed row ${i}`, await res.text());
                        }
                    } catch(e) {
                        errorCount++;
                    }
                }
                
                alert(`Import complete! Successfully added ${successCount} members. Failed: ${errorCount}`);
                closeAllModals();
                loadMembers();
            } catch (err) {
                alert('Error parsing CSV: ' + err.message);
            } finally {
                processImportBtn.innerHTML = prevText;
                processImportBtn.disabled = false;
                csvInput.value = '';
                const textEl = csvInput.parentElement.querySelector('p.text-gray-600');
                if (textEl) textEl.textContent = 'Drag and drop your CSV file here';
            }
        });
    }

    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            if (allMembers.length === 0) {
                alert('No members to export.');
                return;
            }
            
            const headers = ['name', 'phone', 'businessName', 'businessType', 'city', 'district'];
            const rows = allMembers.map(m => {
                const fullName = `${m.first_name || ''} ${m.last_name || ''}`.trim();
                const parts = (m.address || '').split(',');
                const district = parts.length >= 2 ? parts[parts.length - 1].trim() : '';
                const city = parts.length >= 2 ? parts[parts.length - 2].trim() : (m.address || '');
                
                return [
                    `"${fullName.replace(/"/g, '""')}"`,
                    `"${(m.mobile || '').replace(/"/g, '""')}"`,
                    `"${(m.business || '').replace(/"/g, '""')}"`,
                    `"${(m.type || '').replace(/"/g, '""')}"`,
                    `"${city.replace(/"/g, '""')}"`,
                    `"${district.replace(/"/g, '""')}"`
                ];
            });
            
            const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'members_export.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }
});
