document.addEventListener('DOMContentLoaded', async () => {
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

    // Open Modals
    document.getElementById('open-edit-modal').addEventListener('click', () => openModal('form'));
    document.getElementById('open-delete-modal').addEventListener('click', () => openModal('delete'));

    // API Integration
    const urlParams = new URLSearchParams(window.location.search);
    const associationId = urlParams.get('id');

    if (!associationId) {
        alert('No association ID provided.');
        window.location.href = 'associations.html';
        return;
    }

    const viewMembersBtn = document.getElementById('view-members-btn');
    if (viewMembersBtn) {
        viewMembersBtn.href = `association-members.html?id=${associationId}`;
    }

    try {
        const response = await window.api.getAssociationById(associationId);
        if (response && response.success && response.data) {
            const data = response.data;
            
            // Populate Header
            document.getElementById('assoc-header-name').textContent = data.name;
            const statusBadge = document.getElementById('assoc-status');
            statusBadge.textContent = data.status || 'Active';
            
            // Set status color
            if ((data.status || 'Active').toLowerCase() === 'active') {
                statusBadge.className = 'inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800';
            } else {
                statusBadge.className = 'inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-red-100 text-red-800';
            }

            // Populate Basic Info
            document.getElementById('assoc-name').textContent = data.name;
            document.getElementById('assoc-code').textContent = data.code || 'N/A';
            document.getElementById('assoc-contact-person').textContent = data.contact_person || 'N/A';

            // Populate Contact Info
            document.getElementById('assoc-address').textContent = data.address || 'N/A';
            
            const locationStr = [data.district, data.city, data.state].filter(Boolean).join(' / ');
            document.getElementById('assoc-location').textContent = locationStr || 'N/A';
            
            document.getElementById('assoc-pincode').textContent = data.pincode || 'N/A';
            document.getElementById('assoc-phone').textContent = data.mobile || 'N/A';
            document.getElementById('assoc-email').textContent = data.email || 'N/A';
            
            // Pre-fill Edit Modal (Optional, but good practice)
            const editNameInput = document.querySelector('#assoc-form input[type="text"]');
            if (editNameInput) editNameInput.value = data.name;
        } else {
            throw new Error(response.message || 'Failed to fetch association details');
        }
    } catch (error) {
        console.error('Error fetching association details:', error);
        alert('Failed to load association details. Please try again.');
    }

    // Mock Form Save
    const saveBtn = document.getElementById('save-assoc-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const form = document.getElementById('assoc-form');
            if (form.checkValidity()) {
                const prevText = saveBtn.innerHTML;
                saveBtn.innerHTML = '<i data-lucide="loader-2" class="h-4 w-4 animate-spin mr-2"></i> Saving...';
                saveBtn.disabled = true;
                lucide.createIcons();

                setTimeout(() => {
                    alert('Association updated successfully!');
                    saveBtn.innerHTML = prevText;
                    saveBtn.disabled = false;
                    closeAllModals();
                }, 800);
            } else {
                form.reportValidity();
            }
        });
    }

    // Mock Delete Save
    const deleteBtn = document.getElementById('confirm-delete-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            alert('Association deleted.');
            window.location.href = 'associations.html';
        });
    }
});
