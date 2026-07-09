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

    // Tab Switching Logic
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Reset styles on all buttons
            tabBtns.forEach(b => {
                b.classList.remove('bg-primary-600', 'text-white');
                b.classList.add('text-gray-600', 'hover:bg-gray-100');
            });

            // Set active style on clicked button
            btn.classList.remove('text-gray-600', 'hover:bg-gray-100');
            btn.classList.add('bg-primary-600', 'text-white');

            // Hide all contents
            tabContents.forEach(content => {
                content.classList.add('hidden');
            });

            // Show target content
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).classList.remove('hidden');
        });
    });

    // Exhibitor Modal Logic
    const modalOverlay = document.getElementById('modal-overlay');
    const exhibitorModal = document.getElementById('exhibitor-modal');
    const addExhibitorBtn = document.getElementById('add-exhibitor-btn');
    const closeExhibitorModalBtn = document.getElementById('close-exhibitor-modal');
    const cancelExhibitorBtn = document.getElementById('cancel-exhibitor-btn');
    const addExhibitorForm = document.getElementById('add-exhibitor-form');

    const openModal = () => {
        modalOverlay.classList.remove('hidden');
        exhibitorModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    };

    const closeModal = () => {
        modalOverlay.classList.add('hidden');
        exhibitorModal.classList.add('hidden');
        document.body.style.overflow = '';
        if (addExhibitorForm) addExhibitorForm.reset();
    };

    if (addExhibitorBtn) addExhibitorBtn.addEventListener('click', openModal);
    if (closeExhibitorModalBtn) closeExhibitorModalBtn.addEventListener('click', closeModal);
    if (cancelExhibitorBtn) cancelExhibitorBtn.addEventListener('click', closeModal);

    // Close on overlay click
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeModal();
            }
        });
    }

    // Handle Form Submit
    if (addExhibitorForm) {
        addExhibitorForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Exhibitor added successfully (simulated)!');
            closeModal();
        });
    }
});
