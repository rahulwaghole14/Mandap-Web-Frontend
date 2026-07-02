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
});
