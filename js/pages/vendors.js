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
    const addVendorModal = document.getElementById('add-vendor-modal');
    
    // Buttons to toggle modal
    const addVendorBtn = document.getElementById('add-vendor-btn');
    const closeAddVendorBtn = document.getElementById('close-add-vendor');
    const cancelVendorBtn = document.getElementById('cancel-vendor-btn');
    const addVendorForm = document.getElementById('add-vendor-form');

    // Function to open modal
    const openModal = () => {
        modalOverlay.classList.remove('hidden');
        addVendorModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    };

    // Function to close modal
    const closeModal = () => {
        modalOverlay.classList.add('hidden');
        addVendorModal.classList.add('hidden');
        document.body.style.overflow = '';
        addVendorForm.reset();
    };

    if (addVendorBtn) addVendorBtn.addEventListener('click', openModal);
    if (closeAddVendorBtn) closeAddVendorBtn.addEventListener('click', closeModal);
    if (cancelVendorBtn) cancelVendorBtn.addEventListener('click', closeModal);

    // Close modal when clicking outside
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeModal();
            }
        });
    }

    // Form submission
    if (addVendorForm) {
        addVendorForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // Simulate API call
            const submitBtn = addVendorForm.querySelector('button[type="submit"]');
            const originalContent = submitBtn.innerHTML;
            
            submitBtn.innerHTML = `
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Adding Vendor...</span>
            `;
            submitBtn.disabled = true;

            setTimeout(() => {
                submitBtn.innerHTML = originalContent;
                submitBtn.disabled = false;
                closeModal();
                alert('Vendor added successfully (simulated)!');
            }, 1000);
        });
    }
});
