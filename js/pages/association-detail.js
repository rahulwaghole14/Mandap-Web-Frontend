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

    // Open Modals
    document.getElementById('open-edit-modal').addEventListener('click', () => openModal('form'));
    document.getElementById('open-delete-modal').addEventListener('click', () => openModal('delete'));

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
