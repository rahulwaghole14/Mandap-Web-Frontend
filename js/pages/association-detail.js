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

    // Set the View Members link immediately (synchronous — no race condition)
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
            
            // Pre-fill Edit Modal
            if (document.getElementById('form-name')) document.getElementById('form-name').value = data.name || '';
            if (document.getElementById('form-code')) document.getElementById('form-code').value = data.code || '';
            if (document.getElementById('form-address')) document.getElementById('form-address').value = data.address || '';
            if (document.getElementById('form-city')) document.getElementById('form-city').value = data.city || '';
            if (document.getElementById('form-district')) document.getElementById('form-district').value = data.district || '';
            if (document.getElementById('form-state')) document.getElementById('form-state').value = data.state || '';
            if (document.getElementById('form-pincode')) document.getElementById('form-pincode').value = data.pincode || '';
            if (document.getElementById('form-contact-person')) document.getElementById('form-contact-person').value = data.contact_person || '';
            if (document.getElementById('form-mobile')) document.getElementById('form-mobile').value = data.mobile || '';
            if (document.getElementById('form-email')) document.getElementById('form-email').value = data.email || '';
            if (document.getElementById('form-status')) document.getElementById('form-status').value = data.status || 'Active';
        } else {
            throw new Error(response.message || 'Failed to fetch association details');
        }
    } catch (error) {
        console.error('Error fetching association details:', error);
        alert('Failed to load association details. Please try again.');
    }

    // Form Save (PUT /associations/:id)
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
                const response = await window.api.updateAssociation(associationId, payload);
                if (response.success) {
                    alert('Association updated successfully!');
                    closeAllModals();
                    window.location.reload(); // Reload to show updated details
                } else {
                    let errMsg = response.message || 'Failed to update association.';
                    if (response.errors) {
                        errMsg += '\n' + Object.values(response.errors).flat().join('\n');
                    }
                    alert(errMsg);
                }
            } catch (error) {
                console.error('Error updating association:', error);
                alert('An error occurred while updating the association.');
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
            window.location.href = 'associations.html';
        });
    }
});
