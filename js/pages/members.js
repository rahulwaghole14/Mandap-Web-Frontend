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
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
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
        openModal('form');
    });

    document.getElementById('open-import-modal').addEventListener('click', () => {
        openModal('import');
    });

    // Table Actions
    const tableRows = document.querySelectorAll('.member-row');
    tableRows.forEach(row => {
        const viewBtn = row.querySelector('.view-btn');
        const editBtn = row.querySelector('.edit-btn');
        const deleteBtn = row.querySelector('.delete-btn');

        if (viewBtn) {
            viewBtn.addEventListener('click', (e) => {
                // Populate mock data based on row
                document.getElementById('view-name').textContent = row.querySelector('.text-gray-900').textContent;
                openModal('view');
            });
        }

        if (editBtn) {
            editBtn.addEventListener('click', (e) => {
                document.getElementById('form-modal-title').textContent = 'Edit Member';
                // Mock populate form
                document.getElementById('member-name').value = row.querySelector('.text-gray-900').textContent;
                openModal('form');
            });
        }

        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                openModal('delete');
            });
        }
    });

    // Form Submissions (Mock)
    const saveBtn = document.getElementById('save-member-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const form = document.getElementById('member-form');
            if (form.checkValidity()) {
                const prevText = saveBtn.innerHTML;
                saveBtn.innerHTML = '<i data-lucide="loader-2" class="h-4 w-4 animate-spin mr-2"></i> Saving...';
                saveBtn.disabled = true;
                lucide.createIcons();

                setTimeout(() => {
                    alert('Member saved successfully!');
                    saveBtn.innerHTML = prevText;
                    saveBtn.disabled = false;
                    closeAllModals();
                }, 800);
            } else {
                form.reportValidity();
            }
        });
    }

    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', () => {
            alert('Member deleted.');
            closeAllModals();
        });
    }

    const processImportBtn = document.getElementById('process-import-btn');
    if (processImportBtn) {
        processImportBtn.addEventListener('click', () => {
            alert('CSV imported successfully!');
            closeAllModals();
        });
    }
});
