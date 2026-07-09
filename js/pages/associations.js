document.addEventListener('DOMContentLoaded', () => {
    // Modal System
    const modalContainer = document.getElementById('modal-container');
    const modals = {
        form: document.getElementById('assoc-form-modal'),
        delete: document.getElementById('delete-modal')
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

    document.querySelectorAll('.close-modal-btn').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });
    document.getElementById('modal-overlay').addEventListener('click', closeAllModals);

    // Open Add Modal
    document.getElementById('open-add-modal').addEventListener('click', () => {
        document.getElementById('form-modal-title').textContent = 'Add Association';
        document.getElementById('assoc-form').reset();
        delete document.getElementById('assoc-form').dataset.editId;
        openModal('form');
    });

    let allAssociations = [];
    let filteredAssociations = [];
    let currentPage = 1;
    const itemsPerPage = 10;
    const tableBody = document.getElementById('associations-table-body');
    
    const loadData = async () => {
        if (!tableBody) return;
        tableBody.innerHTML = `<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500"><i data-lucide="loader-2" class="h-6 w-6 animate-spin mx-auto mb-2"></i> Loading associations...</td></tr>`;
        if (window.lucide) lucide.createIcons();
        
        try {
            const API_BASE = window.CONFIG.API_BASE_URL;
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/associations`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
            });
            if (!res.ok) throw new Error('Failed to fetch associations');
            
            const json = await res.json();
            if (json.success && json.data && Array.isArray(json.data.results)) {
                allAssociations = json.data.results;
            } else if (Array.isArray(json)) {
                allAssociations = json;
            } else {
                allAssociations = [];
            }
            
            // Populate City filter uniquely based on loaded data
            const citySelect = document.getElementById('filter-city');
            if (citySelect) {
                const uniqueCities = [...new Set(allAssociations.map(a => a.city).filter(c => c))].sort();
                citySelect.innerHTML = '<option value="">All Cities</option>' + 
                    uniqueCities.map(c => `<option value="${c}">${c}</option>`).join('');
            }
            
            applyFilters();
        } catch (err) {
            console.error('[Associations] Load error:', err);
            if (tableBody) tableBody.innerHTML = `<tr><td colspan="5" class="px-6 py-4 text-center text-red-500">Failed to load associations</td></tr>`;
        }
    };

    const applyFilters = () => {
        const searchTerm = (document.getElementById('search-assoc-input')?.value || '').toLowerCase();
        const cityFilter = document.getElementById('filter-city')?.value || '';
        const statusFilter = document.getElementById('filter-status')?.value || '';
        
        filteredAssociations = allAssociations.filter(a => {
            const matchesSearch = 
                (a.name || '').toLowerCase().includes(searchTerm) || 
                (a.code || '').toLowerCase().includes(searchTerm) ||
                (a.email || '').toLowerCase().includes(searchTerm);
            
            const matchesCity = cityFilter === '' || a.city === cityFilter;
            const matchesStatus = statusFilter === '' || (a.status || '') === statusFilter;
            
            return matchesSearch && matchesCity && matchesStatus;
        });
        
        currentPage = 1;
        renderAssociations();
    };

    // Attach Filter Listeners
    document.getElementById('search-assoc-input')?.addEventListener('input', applyFilters);
    document.getElementById('filter-city')?.addEventListener('change', applyFilters);
    document.getElementById('filter-status')?.addEventListener('change', applyFilters);

    // Export CSV
    document.getElementById('export-csv-btn')?.addEventListener('click', () => {
        if (allAssociations.length === 0) {
            alert("No data available to export.");
            return;
        }
        const headers = ['ID', 'Name', 'Code', 'Address', 'City', 'District', 'State', 'Pincode', 'Contact Person', 'Mobile', 'Email', 'Status', 'Created At'];
        const rows = allAssociations.map(a => [
            a.id,
            `"${(a.name || '').replace(/"/g, '""')}"`,
            a.code || '',
            `"${(a.address || '').replace(/"/g, '""')}"`,
            a.city || '',
            a.district || '',
            a.state || '',
            a.pincode || '',
            `"${(a.contact_person || '').replace(/"/g, '""')}"`,
            a.mobile || '',
            a.email || '',
            a.status || '',
            a.created_at || ''
        ]);
        
        const csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n" 
            + rows.map(e => e.join(",")).join("\n");
            
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "associations_export.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
    
    const renderAssociations = () => {
        if (!tableBody) return;
        if (filteredAssociations.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">No associations found.</td></tr>`;
            updatePaginationUI(1, 1);
            return;
        }
        
        const totalPages = Math.ceil(filteredAssociations.length / itemsPerPage) || 1;
        if (currentPage > totalPages) currentPage = totalPages;
        if (currentPage < 1) currentPage = 1;
        
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pageData = filteredAssociations.slice(startIndex, endIndex);

        tableBody.innerHTML = pageData.map(a => {
            const name = a.name || 'Unnamed Association';
            const code = a.code || 'N/A';
            const city = a.city || 'N/A';
            const state = a.state || 'N/A';
            const email = a.email || 'N/A';
            const mobile = a.mobile || 'N/A';
            const statusClass = (a.status || '').toLowerCase() === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
            
            return `
            <tr class="hover:bg-gray-50 transition-colors" data-id="${a.id}">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                    <div class="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
                        <i data-lucide="building" class="h-5 w-5 text-primary-600"></i>
                    </div>
                    <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900 assoc-name">${name}</div>
                        <div class="text-sm text-gray-500">Code: ${code}</div>
                    </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div>
                    <div class="text-sm text-gray-900">${city}</div>
                    <div class="text-sm text-gray-500">${state}</div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div>
                    <div class="text-sm text-gray-900">${email}</div>
                    <div class="text-sm text-gray-500">${mobile}</div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusClass}">
                    ${a.status || 'Active'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex space-x-2">
                    <a href="association-detail.html?id=${a.id}" class="text-blue-600 hover:text-blue-900 p-1" title="View Details">
                        <i data-lucide="eye" class="h-4 w-4"></i>
                    </a>
                    <button class="text-yellow-600 hover:text-yellow-900 p-1 edit-btn" title="Edit Association">
                        <i data-lucide="edit" class="h-4 w-4"></i>
                    </button>
                    <button class="text-red-600 hover:text-red-900 p-1 delete-btn" title="Delete Association">
                        <i data-lucide="trash-2" class="h-4 w-4"></i>
                    </button>
                    </div>
                </td>
            </tr>`;
        }).join('');
        
        updatePaginationUI(currentPage, totalPages);
        if (window.lucide) lucide.createIcons();
    };

    const updatePaginationUI = (current, total) => {
        const prevBtn = document.getElementById('prev-page-btn');
        const nextBtn = document.getElementById('next-page-btn');
        const indicator = document.getElementById('page-indicator');
        
        if (prevBtn) prevBtn.disabled = current <= 1;
        if (nextBtn) nextBtn.disabled = current >= total;
        if (indicator) indicator.textContent = `Page ${current} of ${total}`;
    };

    document.getElementById('prev-page-btn')?.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderAssociations();
        }
    });

    document.getElementById('next-page-btn')?.addEventListener('click', () => {
        const totalPages = Math.ceil(filteredAssociations.length / itemsPerPage) || 1;
        if (currentPage < totalPages) {
            currentPage++;
            renderAssociations();
        }
    });

    // Row Actions via Event Delegation
    if (tableBody) {
        tableBody.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;
            const tr = btn.closest('tr');
            if (!tr) return;
            const id = tr.getAttribute('data-id');
            
            if (btn.classList.contains('edit-btn')) {
                document.getElementById('form-modal-title').textContent = 'Edit Association';
                const assoc = allAssociations.find(a => a.id == id);
                if (assoc) {
                    if (document.getElementById('form-name')) document.getElementById('form-name').value = assoc.name || '';
                    if (document.getElementById('form-code')) document.getElementById('form-code').value = assoc.code || '';
                    if (document.getElementById('form-address')) document.getElementById('form-address').value = assoc.address || '';
                    if (document.getElementById('form-city')) document.getElementById('form-city').value = assoc.city || '';
                    if (document.getElementById('form-district')) document.getElementById('form-district').value = assoc.district || '';
                    if (document.getElementById('form-state')) document.getElementById('form-state').value = assoc.state || '';
                    if (document.getElementById('form-pincode')) document.getElementById('form-pincode').value = assoc.pincode || '';
                    if (document.getElementById('form-contact-person')) document.getElementById('form-contact-person').value = assoc.contact_person || '';
                    if (document.getElementById('form-mobile')) document.getElementById('form-mobile').value = assoc.mobile || '';
                    if (document.getElementById('form-email')) document.getElementById('form-email').value = assoc.email || '';
                    if (document.getElementById('form-status')) document.getElementById('form-status').value = assoc.status || 'Active';
                }
                document.getElementById('assoc-form').dataset.editId = id;
                openModal('form');
            } else if (btn.classList.contains('delete-btn')) {
                // Note: Full delete logic to be implemented here
                openModal('delete');
            }
        });
    }

    // Form Save (Add / Update)
    const saveBtn = document.getElementById('save-assoc-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const form = document.getElementById('assoc-form');
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const payload = {
                name: document.getElementById('form-name').value,
                code: document.getElementById('form-code').value,
                address: document.getElementById('form-address').value,
                city: document.getElementById('form-city').value,
                district: document.getElementById('form-district').value,
                state: document.getElementById('form-state').value,
                pincode: document.getElementById('form-pincode').value,
                contact_person: document.getElementById('form-contact-person').value,
                mobile: document.getElementById('form-mobile').value,
                email: document.getElementById('form-email').value,
                status: document.getElementById('form-status').value
            };

            const prevText = saveBtn.innerHTML;
            saveBtn.innerHTML = '<i data-lucide="loader-2" class="h-4 w-4 animate-spin mr-2"></i> Saving...';
            saveBtn.disabled = true;
            if (window.lucide) lucide.createIcons();

            try {
                const editId = form.dataset.editId;
                
                if (editId) {
                    // Update existing (PUT)
                    const API_BASE = window.CONFIG.API_BASE_URL;
                    const token = localStorage.getItem('token');
                    
                    const res = await fetch(`${API_BASE}/associations/${editId}`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify(payload)
                    });

                    const json = await res.json();
                    
                    if (res.ok && json.success) {
                        alert('Association updated successfully!');
                        closeAllModals();
                        loadData(); // Refresh the table
                    } else {
                        let errMsg = json.message || 'Failed to update association.';
                        if (json.errors) {
                            errMsg += '\n' + Object.values(json.errors).flat().join('\n');
                        }
                        alert(errMsg);
                    }
                } else {
                    // Create new (POST)
                    const API_BASE = window.CONFIG.API_BASE_URL;
                    const token = localStorage.getItem('token');
                    
                    const res = await fetch(`${API_BASE}/associations`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify(payload)
                    });

                    const json = await res.json();
                    
                    if (res.ok && json.success) {
                        alert('Association saved successfully!');
                        closeAllModals();
                        loadData(); // Refresh the table
                    } else {
                        let errMsg = json.message || 'Failed to save association.';
                        if (json.errors) {
                            errMsg += '\n' + Object.values(json.errors).flat().join('\n');
                        }
                        alert(errMsg);
                    }
                }
            } catch (err) {
                console.error('[Associations Form Error]', err);
                alert('An error occurred while saving the association.');
            } finally {
                saveBtn.innerHTML = prevText;
                saveBtn.disabled = false;
            }
        });
    }

    // Mock Delete Save
    const deleteBtn = document.getElementById('confirm-delete-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            alert('Association deleted.');
            closeAllModals();
        });
    }

    // Init
    loadData();
});
