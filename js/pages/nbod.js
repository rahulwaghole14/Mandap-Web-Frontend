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

    // Modal elements
    const modalOverlay = document.getElementById('modal-overlay');
    const addNbodModal = document.getElementById('add-nbod-modal');
    
    // Buttons to toggle modal
    const addNbodBtn = document.getElementById('add-nbod-btn');
    const closeAddNbodBtn = document.getElementById('close-add-nbod');
    const cancelNbodBtn = document.getElementById('cancel-nbod-btn');
    const addNbodForm = document.getElementById('add-nbod-form');

    // State for tracking if we are editing an existing member
    let currentEditBodId = null;

    // Function to open modal (optionally for editing)
    const openModal = (mode = 'add') => {
        if (mode === 'add') {
            document.querySelector('#add-nbod-modal h2').textContent = 'Add NBOD Member';
            const submitBtn = addNbodForm.querySelector('button[type="submit"] span');
            if (submitBtn) submitBtn.textContent = 'Add as NBOD Member';
            currentEditBodId = null;
            if (addNbodForm) addNbodForm.reset();
        } else {
            document.querySelector('#add-nbod-modal h2').textContent = 'Edit NBOD Member';
            const submitBtn = addNbodForm.querySelector('button[type="submit"] span');
            if (submitBtn) submitBtn.textContent = 'Update NBOD Member';
        }
        modalOverlay.classList.remove('hidden');
        addNbodModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    };

    // Function to close modal
    const closeModal = () => {
        modalOverlay.classList.add('hidden');
        addNbodModal.classList.add('hidden');
        document.body.style.overflow = '';
        if (addNbodForm) addNbodForm.reset();
    };

    if (addNbodBtn) addNbodBtn.addEventListener('click', () => openModal('add'));
    if (closeAddNbodBtn) closeAddNbodBtn.addEventListener('click', closeModal);
    if (cancelNbodBtn) cancelNbodBtn.addEventListener('click', closeModal);

    // Close modal when clicking outside
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeModal();
            }
        });
    }

    // Data state
    let allBods = [];
    let membersDict = {};
    const tableBody = document.getElementById('nbod-table-body');
    
    const loadData = async () => {
        if (!tableBody) return;
        tableBody.innerHTML = `<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500"><i data-lucide="loader-2" class="h-6 w-6 animate-spin mx-auto mb-2"></i> Loading board members...</td></tr>`;
        if (window.lucide) lucide.createIcons();
        
        try {
            const API_BASE = window.CONFIG.API_BASE_URL;
            const token = localStorage.getItem('token');
            
            // 1. Fetch Members to resolve member names and contact details
            try {
                const memRes = await fetch(`${API_BASE}/members`, {
                    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
                });
                if (memRes.ok) {
                    const memJson = await memRes.json();
                    let membersList = [];
                    if (memJson.success && memJson.data && Array.isArray(memJson.data.results)) {
                        membersList = memJson.data.results;
                    } else if (Array.isArray(memJson)) {
                        membersList = memJson;
                    }
                    membersList.forEach(m => { membersDict[m.id] = m; });
                    
                    const memberSelect = document.getElementById('form-member-id');
                    if (memberSelect) {
                        memberSelect.innerHTML = '<option value="">Select a member</option>' + 
                            membersList.map(m => {
                                const name = `${m.first_name || ''} ${m.last_name || ''}`.trim();
                                return `<option value="${m.id}">${name} (${m.mobile || 'No Mobile'})</option>`;
                            }).join('');
                    }
                }
            } catch (e) {
                console.warn('[NBOD] Failed to load members dictionary:', e);
            }
            
            // 2. Fetch BOD
            const bodRes = await fetch(`${API_BASE}/bod`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
            });
            if (!bodRes.ok) throw new Error('Failed to fetch BOD');
            
            const bodJson = await bodRes.json();
            if (bodJson.success && bodJson.data && Array.isArray(bodJson.data.results)) {
                allBods = bodJson.data.results;
            } else if (Array.isArray(bodJson)) {
                allBods = bodJson;
            } else {
                allBods = [];
            }
            
            renderBods(allBods);
        } catch (err) {
            console.error('[NBOD] Load error:', err);
            if (tableBody) tableBody.innerHTML = `<tr><td colspan="6" class="px-6 py-4 text-center text-red-500">Failed to load Board of Directors</td></tr>`;
        }
    };
    
    const renderBods = (list) => {
        if (!tableBody) return;
        if (list.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">No board members found.</td></tr>`;
            return;
        }
        
        tableBody.innerHTML = list.map(b => {
            const member = membersDict[b.member_id] || {};
            const fullName = member.first_name ? `${member.first_name} ${member.last_name || ''}`.trim() : `Member #${b.member_id}`;
            const initials = member.first_name ? (member.first_name[0] + (member.last_name?.[0] || '')).toUpperCase() : 'NA';
            const email = member.email || 'N/A';
            const mobile = member.mobile || 'N/A';
            const addedDate = b.created_at ? new Date(b.created_at).toLocaleDateString() : 'N/A';
            
            const statusClass = (b.status || '').toLowerCase() === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
            
            return `
            <tr class="hover:bg-gray-50 transition-colors" data-id="${b.id}">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                    <div class="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <span class="text-sm font-medium text-primary-700">${initials}</span>
                    </div>
                    <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">${fullName}</div>
                        <div class="text-sm text-gray-500">Added: ${addedDate}</div>
                    </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    ${b.designation || 'N/A'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div>
                    <div class="text-sm text-gray-900">${mobile}</div>
                    <div class="text-sm text-gray-500">${email}</div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusClass}">
                    ${b.status || 'Active'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Admin
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
    
    // Form submission
    if (addNbodForm) {
        addNbodForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const member_id = document.getElementById('form-member-id')?.value;
            const designation = document.getElementById('form-designation')?.value;
            const association_id = document.getElementById('form-association-id')?.value;
            const start_date = document.getElementById('form-start-date')?.value;
            const end_date = document.getElementById('form-end-date')?.value;
            const status = document.getElementById('form-status')?.checked ? "Active" : "Inactive";
            
            if (!member_id || !designation || !association_id || !start_date || !end_date) {
                alert("Please fill all required fields.");
                return;
            }
            
            const payload = {
                member_id: parseInt(member_id),
                designation,
                association_id: parseInt(association_id),
                start_date,
                end_date,
                status
            };

            const submitBtn = addNbodForm.querySelector('button[type="submit"]');
            const originalContent = submitBtn.innerHTML;
            
            submitBtn.innerHTML = `
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Adding...</span>
            `;
            submitBtn.disabled = true;

            try {
                const API_BASE = window.CONFIG.API_BASE_URL;
                const token = localStorage.getItem('token');
                
                const res = await fetch(currentEditBodId ? `${API_BASE}/bod/${currentEditBodId}` : `${API_BASE}/bod`, {
                    method: currentEditBodId ? 'PUT' : 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });
                
                const json = await res.json();
                
                if (res.ok && json.success) {
                    closeModal();
                    loadData(); // Refresh the table
                    setTimeout(() => alert(currentEditBodId ? 'Board member updated successfully!' : 'Board member added successfully!'), 300);
                } else {
                    let errMsg = json.message || (currentEditBodId ? 'Failed to update board member.' : 'Failed to add board member.');
                    if (json.errors) {
                        errMsg += '\n' + Object.values(json.errors).flat().join('\n');
                    }
                    alert(errMsg);
                }
            } catch (error) {
                console.error('[NBOD Form Error]', error);
                alert('An error occurred while saving the board member.');
            } finally {
                submitBtn.innerHTML = originalContent;
                submitBtn.disabled = false;
            }
        });
    }

    // View Modal Elements
    const viewNbodModal = document.getElementById('view-nbod-modal');
    const closeViewBtn = document.getElementById('close-view-nbod');
    const closeViewBtnBottom = document.getElementById('close-view-btn-bottom');
    const refreshBtn = document.getElementById('refresh-nbod-btn');
    
    // Refresh Logic
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            const icon = refreshBtn.querySelector('i');
            if(icon) icon.classList.add('animate-spin');
            loadData().finally(() => {
                if(icon) icon.classList.remove('animate-spin');
            });
        });
    }
    
    // Open View Modal logic
    const openViewModal = (id) => {
        const b = allBods.find(item => item.id == id);
        if (!b) return;
        const member = membersDict[b.member_id] || {};
        
        document.getElementById('view-initials').textContent = member.first_name ? (member.first_name[0] + (member.last_name?.[0] || '')).toUpperCase() : 'NA';
        document.getElementById('view-name').textContent = member.first_name ? `${member.first_name} ${member.last_name || ''}`.trim() : `Member #${b.member_id}`;
        document.getElementById('view-designation').textContent = b.designation || 'N/A';
        document.getElementById('view-mobile').textContent = member.mobile || 'N/A';
        document.getElementById('view-email').textContent = member.email || 'N/A';
        document.getElementById('view-added').textContent = b.created_at ? new Date(b.created_at).toLocaleDateString() : 'N/A';
        
        const statusEl = document.getElementById('view-status');
        statusEl.textContent = b.status || 'Active';
        statusEl.className = `inline-flex px-2 py-1 text-xs font-semibold rounded-full ${(b.status || '').toLowerCase() === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`;
        
        modalOverlay.classList.remove('hidden');
        viewNbodModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    };
    
    const closeViewModal = () => {
        modalOverlay.classList.add('hidden');
        viewNbodModal.classList.add('hidden');
        document.body.style.overflow = '';
    };

    if (closeViewBtn) closeViewBtn.addEventListener('click', closeViewModal);
    if (closeViewBtnBottom) closeViewBtnBottom.addEventListener('click', closeViewModal);
    
    // Listen for clicks on table action buttons
    if (tableBody) {
        tableBody.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;
            const tr = btn.closest('tr');
            if (!tr) return;
            const id = tr.getAttribute('data-id');
            
            if (btn.classList.contains('view-btn')) {
                openViewModal(id);
            } else if (btn.classList.contains('edit-btn')) {
                const b = allBods.find(item => item.id == id);
                if (b) {
                    currentEditBodId = b.id;
                    openModal('edit');
                    
                    document.getElementById('form-member-id').value = b.member_id;
                    document.getElementById('form-designation').value = b.designation;
                    document.getElementById('form-association-id').value = b.association_id;
                    document.getElementById('form-start-date').value = b.start_date ? b.start_date.substring(0, 10) : '';
                    document.getElementById('form-end-date').value = b.end_date ? b.end_date.substring(0, 10) : '';
                    document.getElementById('form-status').checked = (b.status === 'Active');
                }
            } else if (btn.classList.contains('delete-btn')) {
                if (confirm('Are you sure you want to delete this board member? This action cannot be undone.')) {
                    const API_BASE = window.CONFIG.API_BASE_URL;
                    const token = localStorage.getItem('token');
                    
                    const originalHtml = btn.innerHTML;
                    btn.innerHTML = '<i data-lucide="loader-2" class="h-4 w-4 animate-spin"></i>';
                    btn.disabled = true;
                    if (window.lucide) lucide.createIcons();

                    fetch(`${API_BASE}/bod/${id}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/json'
                        }
                    })
                    .then(res => res.json())
                    .then(json => {
                        if (json.success) {
                            setTimeout(() => alert('Board member deleted successfully!'), 300);
                            loadData(); // Refresh the table
                        } else {
                            alert(json.message || 'Failed to delete board member.');
                            btn.innerHTML = originalHtml;
                            btn.disabled = false;
                        }
                    })
                    .catch(err => {
                        console.error('[NBOD Delete Error]', err);
                        alert('An error occurred while deleting the board member.');
                        btn.innerHTML = originalHtml;
                        btn.disabled = false;
                    });
                }
            }
        });
    }

    // Init
    loadData();
});
