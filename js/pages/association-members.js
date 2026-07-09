document.addEventListener('DOMContentLoaded', () => {
    
    // Tab System
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const openAddMemberModalBtn = document.getElementById('open-add-member-modal');
    const openImportModalBtn = document.getElementById('open-import-modal');
    const addBtnText = document.getElementById('add-btn-text');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active classes
            tabBtns.forEach(t => {
                t.classList.remove('border-primary-500', 'text-primary-600');
                t.classList.add('border-transparent', 'text-gray-500');
            });
            tabContents.forEach(c => c.classList.add('hidden'));

            // Add active class
            btn.classList.remove('border-transparent', 'text-gray-500');
            btn.classList.add('border-primary-500', 'text-primary-600');
            
            const target = btn.getAttribute('data-target');
            document.getElementById(target).classList.remove('hidden');

            // Toggle top buttons
            if (target === 'bod-tab') {
                openImportModalBtn.classList.add('hidden');
                addBtnText.textContent = 'Add BOD Member';
            } else {
                openImportModalBtn.classList.remove('hidden');
                addBtnText.textContent = 'Add Member';
            }
        });
    });

    // Modal System
    const modalContainer = document.getElementById('modal-container');
    const modals = {
        addMember: document.getElementById('add-member-modal'),
        import: document.getElementById('import-modal')
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

    // Open Modals
    openAddMemberModalBtn.addEventListener('click', () => openModal('addMember'));
    openImportModalBtn.addEventListener('click', () => openModal('import'));

    // Mock Saves
    document.getElementById('save-member-btn').addEventListener('click', (e) => {
        e.preventDefault();
        const btn = e.target.closest('button');
        const prevText = btn.innerHTML;
        btn.innerHTML = '<i data-lucide="loader-2" class="h-4 w-4 animate-spin mr-2"></i> Saving...';
        btn.disabled = true;
        lucide.createIcons();

        setTimeout(() => {
            alert('Saved successfully!');
            btn.innerHTML = prevText;
            btn.disabled = false;
            closeAllModals();
        }, 800);
    });

    document.getElementById('process-import-btn').addEventListener('click', () => {
        alert('CSV Imported successfully!');
        closeAllModals();
    });

    // ----------------------------------------------------
    // Dynamic Data Loading
    // ----------------------------------------------------
    
    // Get ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const associationId = urlParams.get('id');

    // Set back-button href immediately (synchronous — no race condition)
    const backBtn = document.getElementById('back-to-detail-btn');
    if (backBtn) {
        backBtn.href = associationId ? `association-detail.html?id=${associationId}` : 'associations.html';
    }

    const loadAssociationData = async () => {
        if (!associationId) {
            document.getElementById('assoc-name-header').textContent = "Unknown Association";
            document.getElementById('members-table-body').innerHTML = `<tr><td colspan="4" class="text-center py-4 text-red-500">No Association ID provided.</td></tr>`;
            return;
        }

        const tbody = document.getElementById('members-table-body');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="4" class="px-6 py-4 text-center text-gray-500"><i data-lucide="loader-2" class="h-6 w-6 animate-spin mx-auto mb-2"></i> Loading members...</td></tr>`;
            if (window.lucide) lucide.createIcons();
        }

        try {
            // Fetch association details for the header
            if (window.api && window.api.getAssociationById) {
                const assocRes = await window.api.getAssociationById(associationId);
                if (assocRes.success && assocRes.data) {
                    document.getElementById('assoc-name-header').textContent = assocRes.data.name;
                }
            }
            
            // Fetch association members
            if (window.api && window.api.getAssociationMembers) {
                const membersRes = await window.api.getAssociationMembers(associationId);
                
                let members = [];
                if (membersRes.success && membersRes.data && Array.isArray(membersRes.data.results)) {
                    members = membersRes.data.results;
                } else if (Array.isArray(membersRes)) {
                    members = membersRes;
                }

                if (members.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-gray-500">No members found for this association.</td></tr>`;
                    return;
                }

                tbody.innerHTML = members.map(m => {
                    const firstName = m.first_name || '';
                    const lastName = m.last_name || '';
                    const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || 'NA';
                    const fullName = `${firstName} ${lastName}`.trim();
                    const memId = m.membership_number || 'N/A';
                    const business = m.business || 'N/A';
                    const mobile = m.mobile || 'N/A';
                    const location = m.address || 'N/A';
                    const type = m.type || 'Standard';

                    return `
                    <tr class="hover:bg-gray-50">
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="flex items-center">
                                <div class="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                                    <span class="text-sm font-medium text-primary-700">${initials}</span>
                                </div>
                                <div class="ml-4">
                                    <div class="text-sm font-medium text-gray-900">${fullName}</div>
                                    <div class="text-sm text-gray-500">ID: ${memId}</div>
                                </div>
                            </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm text-gray-900">${business}</div>
                            <div class="text-sm text-gray-500">${mobile}</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm text-gray-900">${location}</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">${type}</span>
                        </td>
                    </tr>`;
                }).join('');
            }

            // Fetch Association BOD
            if (window.api && window.api.getAssociationBOD) {
                const bodGrid = document.getElementById('bod-grid');
                if (bodGrid) {
                    bodGrid.innerHTML = `<div class="col-span-full text-center text-gray-500 py-8"><i data-lucide="loader-2" class="h-6 w-6 animate-spin mx-auto mb-2"></i> Loading Board of Directors...</div>`;
                    if (window.lucide) lucide.createIcons();

                    const bodRes = await window.api.getAssociationBOD(associationId);
                    let bodMembers = [];
                    if (bodRes.success && Array.isArray(bodRes.data)) {
                        bodMembers = bodRes.data;
                    }

                    if (bodMembers.length === 0) {
                        bodGrid.innerHTML = `<div class="col-span-full text-center text-gray-500 py-8">No Board of Directors found for this association.</div>`;
                    } else {
                        bodGrid.innerHTML = bodMembers.map(bod => {
                            const designation = bod.designation || 'Member';
                            const memberInfo = bod.member || {};
                            
                            const firstName = memberInfo.first_name || '';
                            const lastName = memberInfo.last_name || '';
                            let fullName = `${firstName} ${lastName}`.trim();
                            if (!fullName) fullName = bod.name || 'Unknown Member';
                            
                            const mobile = memberInfo.mobile || bod.contact_number || 'N/A';
                            
                            const startDate = bod.start_date ? new Date(bod.start_date).getFullYear() : 'N/A';
                            const endDate = bod.end_date ? new Date(bod.end_date).getFullYear() : 'Present';
                            const term = `${startDate} - ${endDate}`;

                            return `
                            <div class="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                <div class="p-6 relative">
                                <div class="absolute top-4 right-4 flex space-x-2">
                                    <button class="text-gray-400 hover:text-blue-600"><i data-lucide="edit" class="h-4 w-4"></i></button>
                                    <button class="text-gray-400 hover:text-red-600"><i data-lucide="trash-2" class="h-4 w-4"></i></button>
                                </div>
                                <div class="flex flex-col items-center">
                                    <div class="h-20 w-20 rounded-full bg-primary-100 flex items-center justify-center mb-4">
                                    <i data-lucide="user" class="h-10 w-10 text-primary-600"></i>
                                    </div>
                                    <h3 class="text-lg font-bold text-gray-900">${fullName}</h3>
                                    <span class="inline-flex px-3 py-1 mt-2 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">${designation}</span>
                                    
                                    <div class="mt-6 w-full space-y-3">
                                    <div class="flex items-center text-sm text-gray-600">
                                        <i data-lucide="phone" class="h-4 w-4 mr-3"></i>
                                        ${mobile}
                                    </div>
                                    <div class="flex items-center text-sm text-gray-600">
                                        <i data-lucide="calendar" class="h-4 w-4 mr-3"></i>
                                        Term: ${term}
                                    </div>
                                    </div>
                                </div>
                                </div>
                            </div>`;
                        }).join('');
                        
                        if (window.lucide) lucide.createIcons();
                    }
                }
            }
            
        } catch (err) {
            console.error('Error fetching association data:', err);
            document.getElementById('members-table-body').innerHTML = `<tr><td colspan="4" class="text-center py-4 text-red-500">Failed to load members.</td></tr>`;
        }
    };

    loadAssociationData();

});
