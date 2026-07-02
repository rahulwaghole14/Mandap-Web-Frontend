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
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'login.html';
        });
    }

    // Modal elements
    const modalOverlay = document.getElementById('modal-overlay');
    const deleteModal = document.getElementById('delete-modal');
    
    // Buttons to toggle delete modal
    const deleteBtns = document.querySelectorAll('.delete-event-btn');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    
    let eventToDelete = null;

    // Function to open delete modal
    const openDeleteModal = (e) => {
        eventToDelete = e.currentTarget;
        modalOverlay.classList.remove('hidden');
        deleteModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    };

    // Function to close modal
    const closeModal = () => {
        modalOverlay.classList.add('hidden');
        deleteModal.classList.add('hidden');
        document.body.style.overflow = '';
        eventToDelete = null;
    };

    // Attach event listeners
    deleteBtns.forEach(btn => btn.addEventListener('click', openDeleteModal));
    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeModal);
    
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', () => {
            if (eventToDelete) {
                // Find parent card and remove it (simulate delete)
                const card = eventToDelete.closest('.bg-white.rounded-xl');
                if (card) {
                    card.remove();
                }
            }
            closeModal();
            alert('Event deleted successfully (simulated)!');
        });
    }

    // Close modal when clicking outside
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeModal();
            }
        });
    }
});
