document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const API_BASE = window.CONFIG.API_BASE_URL;

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Set user info
    if (user.name) {
        const userNameEl = document.getElementById('user-name');
        if (userNameEl) userNameEl.textContent = user.name;
    }

    // Setup Edit Mode checks
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('id');
    const isEdit = !!eventId;
    
    // Store original event data for unmodified fields
    let originalEventData = {};

    if (isEdit) {
        document.getElementById('form-title').textContent = 'Edit Event';
        
        // Fetch event data from API
        fetch(`${API_BASE}/events/${eventId}`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        })
        .then(res => res.json())
        .then(data => {
            const evt = data.results || data.data || data;
            originalEventData = evt;
            
            document.getElementById('event-name').value = evt.title || '';
            document.getElementById('event-slug').value = evt.slug || '';
            document.getElementById('event-desc').value = evt.description || '';
            
            // Format dates for datetime-local input (YYYY-MM-DDThh:mm)
            if (evt.start_date) {
                let s = evt.start_date;
                if (s.length === 10) s += 'T09:00'; // Default time if missing
                document.getElementById('event-start').value = s.substring(0, 16);
            }
            if (evt.end_date) {
                let e = evt.end_date;
                if (e.length === 10) e += 'T18:00'; // Default time if missing
                document.getElementById('event-end').value = e.substring(0, 16);
            }
            if (evt.registration_open) document.getElementById('event-reg-open').value = evt.registration_open.substring(0, 10);
            if (evt.registration_close) document.getElementById('event-reg-close').value = evt.registration_close.substring(0, 10);
            
            // Smartly split the combined address string for the individual form inputs
            document.getElementById('event-venue').value = evt.venue || '';
            
            let addr = evt.address || '';
            let city = 'Pune';
            let state = 'Maharashtra';
            
            if (addr) {
                const parts = addr.split(',').map(p => p.trim());
                if (parts.length >= 3) {
                    state = parts.pop();
                    city = parts.pop();
                    addr = parts.join(', ');
                } else if (parts.length === 2) {
                    city = parts.pop();
                    addr = parts[0];
                }
            }
            
            document.getElementById('event-address').value = addr;
            document.getElementById('event-city').value = city;
            document.getElementById('event-state').value = state;
            document.getElementById('event-fee').value = evt.registration_fee || '0';
            document.getElementById('event-capacity').value = evt.capacity || '1200';
            document.getElementById('event-status').value = evt.status || 'active';
        })
        .catch(err => {
            console.error('[Events API] Error loading event:', err);
            alert('Could not load event details.');
        });
    }

    // Image Upload Logic (Keeping existing logic for UI)
    const imageInput = document.getElementById('event-image');
    const uploadPrompt = document.getElementById('upload-prompt');
    const previewContainer = document.getElementById('image-preview-container');
    const imagePreview = document.getElementById('image-preview');
    const removeImageBtn = document.getElementById('remove-image-btn');

    if (imageInput) {
        imageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    imagePreview.src = e.target.result;
                    uploadPrompt.classList.add('hidden');
                    previewContainer.classList.remove('hidden');
                }
                reader.readAsDataURL(file);
            }
        });
    }

    if (removeImageBtn) {
        removeImageBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            imageInput.value = '';
            imagePreview.src = '';
            uploadPrompt.classList.remove('hidden');
            previewContainer.classList.add('hidden');
        });
    }

    // Form Submission
    const form = document.getElementById('event-form');
    const submitBtn = document.getElementById('submit-btn');
    const submitText = document.getElementById('submit-text');
    const submitSpinner = document.getElementById('submit-spinner');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const startStr = document.getElementById('event-start').value;
            const endStr = document.getElementById('event-end').value;
            if (startStr && endStr) {
                if (new Date(endStr) <= new Date(startStr)) {
                    alert('End date/time must be after start date/time');
                    return;
                }
            }

            // Construct payload
            const address = document.getElementById('event-address').value;
            const city = document.getElementById('event-city').value;
            const district = document.getElementById('event-district').value;
            const state = document.getElementById('event-state').value;
            
            let slug = document.getElementById('event-slug').value.trim();
            if (!slug) {
                slug = document.getElementById('event-name').value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            }

            const payload = {
                title: document.getElementById('event-name').value,
                slug: slug,
                description: document.getElementById('event-desc').value,
                venue: document.getElementById('event-venue').value,
                address: [address, city, state].filter(Boolean).join(', '),
                start_date: startStr.substring(0, 10), // Extract YYYY-MM-DD for the API
                end_date: endStr.substring(0, 10),
                registration_open: document.getElementById('event-reg-open').value || startStr.substring(0, 10),
                registration_close: document.getElementById('event-reg-close').value || startStr.substring(0, 10),
                capacity: parseInt(document.getElementById('event-capacity').value, 10) || 1200,
                status: document.getElementById('event-status').value || "active"
            };
            
            // Optionally add fee if it's not empty
            const fee = document.getElementById('event-fee').value;
            if (fee) payload.registration_fee = fee;

            submitText.textContent = 'Saving...';
            submitSpinner.classList.remove('hidden');
            submitBtn.disabled = true;
            submitBtn.classList.add('opacity-75', 'cursor-not-allowed');

            try {
                const endpoint = isEdit ? `${API_BASE}/events/${eventId}` : `${API_BASE}/events`;
                const method = isEdit ? 'PUT' : 'POST';

                const response = await fetch(endpoint, {
                    method: method,
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    throw new Error(`API returned status: ${response.status}`);
                }

                alert(isEdit ? 'Event updated successfully!' : 'Event created successfully!');
                window.location.href = 'events.html';
                
            } catch (error) {
                console.error('[Events API] Error saving event:', error);
                alert('Failed to save event. Check console for details.');
                
                submitText.textContent = isEdit ? 'Update Event' : 'Create Event';
                submitSpinner.classList.add('hidden');
                submitBtn.disabled = false;
                submitBtn.classList.remove('opacity-75', 'cursor-not-allowed');
            }
        });
    }
});
