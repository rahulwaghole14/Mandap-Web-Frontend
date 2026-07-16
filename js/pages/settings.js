document.addEventListener('DOMContentLoaded', () => {
    
    // Tab System
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

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
        });
    });

    // Toggle Switches (Notifications)
    const toggleBtns = document.querySelectorAll('.toggle-btn');
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const isChecked = btn.getAttribute('aria-checked') === 'true';
            const span = btn.querySelector('span');

            if (isChecked) {
                btn.setAttribute('aria-checked', 'false');
                btn.classList.remove('bg-primary-600');
                btn.classList.add('bg-gray-200');
                span.classList.remove('translate-x-5');
                span.classList.add('translate-x-0');
            } else {
                btn.setAttribute('aria-checked', 'true');
                btn.classList.remove('bg-gray-200');
                btn.classList.add('bg-primary-600');
                span.classList.remove('translate-x-0');
                span.classList.add('translate-x-5');
            }
        });
    });

    // Profile Photo Upload Preview
    const changePhotoBtn = document.getElementById('change-photo-btn');
    const photoInput = document.getElementById('profile-photo-input');
    const photoPreview = document.getElementById('profile-photo-preview');
    const photoIcon = document.getElementById('profile-photo-icon');
    
    if (changePhotoBtn && photoInput) {
        changePhotoBtn.addEventListener('click', () => {
            photoInput.click();
        });
        
        photoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    if (photoPreview && photoIcon) {
                        photoPreview.src = e.target.result;
                        photoPreview.classList.remove('hidden');
                        photoIcon.classList.add('hidden');
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Handle Profile Form Submission
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!profileForm.checkValidity()) {
                profileForm.reportValidity();
                return;
            }
            
            const btn = profileForm.querySelector('.submit-btn');
            const prevText = btn.innerHTML;
            btn.innerHTML = '<i data-lucide="loader-2" class="h-4 w-4 animate-spin mr-2"></i> <span>Saving...</span>';
            btn.disabled = true;
            if (window.lucide) lucide.createIcons();
            
            const photoInput = document.getElementById('profile-photo-input');
            const hasPhoto = photoInput && photoInput.files && photoInput.files.length > 0;
            
            try {
                const token = localStorage.getItem('token');
                const API_BASE = window.CONFIG.API_BASE_URL;
                let endpoint = `${API_BASE}/auth/profile`;
                let reqOptions = {};
                
                if (hasPhoto) {
                    const formData = new FormData();
                    formData.append('name', document.getElementById('profile-name')?.value || '');
                    formData.append('email', document.getElementById('profile-email')?.value || '');
                    if (document.getElementById('profile-phone')?.value) formData.append('phone', document.getElementById('profile-phone')?.value);
                    if (document.getElementById('profile-district')?.value) formData.append('district', document.getElementById('profile-district')?.value);
                    
                    // The backend developer confirmed they use multipart
                    formData.append('profile_image', photoInput.files[0]);
                    formData.append('image', photoInput.files[0]); // Fallback 1
                    formData.append('photo', photoInput.files[0]); // Fallback 2
                    
                    // We must spoof PUT because standard PUT does not parse multipart/form-data natively in PHP
                    formData.append('_method', 'PUT'); 
                    
                    reqOptions = {
                        method: 'POST', // POST is required for multipart/form-data
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/json'
                            // Do not set Content-Type for FormData, browser sets it automatically with boundary
                        },
                        body: formData
                    };
                } else {
                    const payload = {
                        name: document.getElementById('profile-name')?.value,
                        email: document.getElementById('profile-email')?.value,
                        phone: document.getElementById('profile-phone')?.value,
                        district: document.getElementById('profile-district')?.value
                    };
                    
                    reqOptions = {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify(payload)
                    };
                }
                
                const res = await fetch(endpoint, reqOptions);
                
                if (res.ok) {
                    const json = await res.json();
                    console.log('[PUT /auth/profile] Response:', json);
                    alert('Profile updated successfully!');
                    
                    if (json.data && json.data.user) {
                        const user = json.data.user;
                        localStorage.setItem('user', JSON.stringify(user));
                        localStorage.setItem('userName', user.name || '');
                        localStorage.setItem('userEmail', user.email || '');
                        
                        const gNameEl = document.getElementById('user-name');
                        if (gNameEl) gNameEl.textContent = user.name;
                        const gEmailEl = document.getElementById('user-email');
                        if (gEmailEl) gEmailEl.textContent = user.email;
                    }
                } else {
                    const error = await res.json();
                    alert('Failed to update profile: ' + (error.message || 'Unknown error'));
                }
            } catch (err) {
                console.error('[Settings] Update profile error:', err);
                alert('An error occurred while updating the profile.');
            } finally {
                btn.innerHTML = prevText;
                btn.disabled = false;
                if (window.lucide) lucide.createIcons();
            }
        });
    }

    // Mock Saves
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        if (form.id === 'profile-form') return; // Skip profile form
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            if (form.checkValidity()) {
                const btn = form.querySelector('.submit-btn');
                const prevText = btn.innerHTML;
                
                // Set loading state
                btn.innerHTML = '<i data-lucide="loader-2" class="h-4 w-4 animate-spin mr-2"></i> <span>Saving...</span>';
                btn.disabled = true;
                lucide.createIcons();

                // Mock API call delay
                setTimeout(() => {
                    alert('Settings saved successfully!');
                    btn.innerHTML = prevText;
                    btn.disabled = false;
                    lucide.createIcons();
                }, 800);
            } else {
                form.reportValidity();
            }
        });
    });
    // Load Admin Profile
    async function loadAdminProfile() {
        const token = localStorage.getItem('token');
        if (!token) return;
    const API_BASE = window.CONFIG.API_BASE_URL;
        
        try {
            const res = await fetch(`${API_BASE}/auth/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (res.ok) {
                const json = await res.json();
                console.log('[GET /auth/profile] Response (Settings):', json);
                
                const user = json.data?.user;
                if (user) {
                    const nameInput = document.getElementById('profile-name');
                    const emailInput = document.getElementById('profile-email');
                    const roleInput = document.getElementById('profile-role');
                    const phoneInput = document.getElementById('profile-phone');
                    const districtInput = document.getElementById('profile-district');

                    if (nameInput) nameInput.value = user.name || '';
                    if (emailInput) emailInput.value = user.email || '';
                    if (roleInput) roleInput.value = user.role || '';
                    if (phoneInput) phoneInput.value = user.phone || '';
                    if (districtInput) districtInput.value = user.district || '';
                    
                    // Update role text in permissions tab
                    const roleText = document.querySelector('#permissions-tab .capitalize');
                    if (roleText) roleText.textContent = user.role || 'admin';
                    
                    // Display profile image if it exists
                    if (user.profile_image) {
                        const photoPreview = document.getElementById('profile-photo-preview');
                        const photoIcon = document.getElementById('profile-photo-icon');
                        if (photoPreview && photoIcon) {
                            const imgUrl = user.profile_image;
                            photoPreview.src = imgUrl.startsWith('http') ? imgUrl : `${API_BASE.replace('/api', '')}/${imgUrl.replace(new RegExp('^/'), '')}`;
                            photoPreview.classList.remove('hidden');
                            photoIcon.classList.add('hidden');
                        }
                    }

                    // Update localStorage so other parts of the app have the freshest data
                    localStorage.setItem('user', JSON.stringify(user));
                    localStorage.setItem('userName', user.name || '');
                    localStorage.setItem('userEmail', user.email || '');
                    localStorage.setItem('userRole', user.role || '');
                }
            }
        } catch (error) {
            console.error('[Settings] Error loading admin profile:', error);
        }
    }
    loadAdminProfile();
    
    // ── Security Form (Change Password) ────────────────────────────────────────
    const securityForm = document.getElementById('security-form');
    if (securityForm) {
        securityForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            
            if (newPassword !== confirmPassword) {
                alert('New password and confirm password do not match.');
                return;
            }
            
            if (newPassword.length < 8) {
                alert('New password must be at least 8 characters long.');
                return;
            }
            
            const btn = securityForm.querySelector('button[type="submit"]');
            const prevText = btn.innerHTML;
            btn.innerHTML = 'Saving...';
            btn.disabled = true;
            
            try {
                const token = localStorage.getItem('token');
                const API_BASE = window.CONFIG.API_BASE_URL;
                const endpoint = `${API_BASE}/auth/password`;
                
                const response = await fetch(endpoint, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        current_password: currentPassword,
                        new_password: newPassword,
                        confirm_password: confirmPassword
                    })
                });
                
                const json = await response.json();
                
                if (json.success) {
                    alert('Password updated successfully.');
                    securityForm.reset();
                } else {
                    alert(json.message || 'Failed to update password.');
                }
            } catch (error) {
                console.error('[Security] Error updating password:', error);
                alert('An error occurred while updating the password.');
            } finally {
                btn.innerHTML = prevText;
                btn.disabled = false;
            }
        });
    }


    // ── Logout ─────────────────────────────────────────────────────────────────
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

});
