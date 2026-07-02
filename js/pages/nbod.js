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
    const addNbodModal = document.getElementById('add-nbod-modal');
    
    // Buttons to toggle modal
    const addNbodBtn = document.getElementById('add-nbod-btn');
    const closeAddNbodBtn = document.getElementById('close-add-nbod');
    const cancelNbodBtn = document.getElementById('cancel-nbod-btn');
    const addNbodForm = document.getElementById('add-nbod-form');

    // Function to open modal
    const openModal = () => {
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

    if (addNbodBtn) addNbodBtn.addEventListener('click', openModal);
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

    // Form submission
    if (addNbodForm) {
        addNbodForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // Simulate API call
            const submitBtn = addNbodForm.querySelector('button[type="submit"]');
            const originalContent = submitBtn.innerHTML;
            
            submitBtn.innerHTML = `
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Adding Member...</span>
            `;
            submitBtn.disabled = true;

            setTimeout(() => {
                submitBtn.innerHTML = originalContent;
                submitBtn.disabled = false;
                closeModal();
                alert('NBOD member added successfully (simulated)!');
            }, 1000);
        });
    }
});
