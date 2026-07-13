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

    // Load associations
    const assocSelect = document.getElementById('event-association');
    if (assocSelect) {
        fetch(`${API_BASE}/associations`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        })
        .then(res => res.json())
        .then(json => {
            let assocs = [];
            if (json.success && json.data && Array.isArray(json.data.results)) {
                assocs = json.data.results;
            } else if (Array.isArray(json)) {
                assocs = json;
            } else if (json.data && Array.isArray(json.data)) {
                assocs = json.data;
            }

            if (assocs.length > 0) {
                assocSelect.innerHTML = '<option value="">Select Association</option>';
                assocs.forEach(a => {
                    const opt = document.createElement('option');
                    opt.value = a.id;
                    opt.textContent = a.name || a.title || `Association ${a.id}`;
                    assocSelect.appendChild(opt);
                });
                
                // If editing and we already loaded event data, set it now
                if (isEdit && originalEventData.association_id) {
                    assocSelect.value = originalEventData.association_id;
                }
            }
        })
        .catch(err => console.error('Failed to load associations:', err));
    }

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
            
            const assocEl = document.getElementById('event-association');
            if (assocEl && evt.association_id) assocEl.value = evt.association_id;
            
            const featEl = document.getElementById('event-featured');
            if (featEl) featEl.checked = evt.featured == 1 || evt.featured == true;
            
            if (evt.event_image || evt.image) {
                const imgUrl = evt.event_image || evt.image;
                const previewContainer = document.getElementById('image-preview-container');
                const imagePreview = document.getElementById('image-preview');
                const uploadPrompt = document.getElementById('upload-prompt');
                
                if (imagePreview && previewContainer && uploadPrompt) {
                    imagePreview.src = imgUrl.startsWith('http') ? imgUrl : `${API_BASE.replace('/api', '')}/storage/${imgUrl}`;
                    uploadPrompt.classList.add('hidden');
                    previewContainer.classList.remove('hidden');
                }
            }
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
                // Validation: Max 5MB
                if (file.size > 5 * 1024 * 1024) {
                    alert('Image size must be less than 5MB.');
                    imageInput.value = ''; // clear input
                    return;
                }

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

            // Construct payload as FormData for direct image upload
            const formData = new FormData();
            
            const address = document.getElementById('event-address').value;
            const city = document.getElementById('event-city').value;
            const district = document.getElementById('event-district').value;
            const state = document.getElementById('event-state').value;
            
            let slug = document.getElementById('event-slug').value.trim();
            if (!slug) {
                slug = document.getElementById('event-name').value;
            }
            // Strictly enforce slug format (lowercase, numbers, hyphens only)
            slug = slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

            formData.append('title', document.getElementById('event-name').value);
            formData.append('slug', slug);
            formData.append('description', document.getElementById('event-desc').value);
            formData.append('venue', document.getElementById('event-venue').value);
            formData.append('address', [address, city, state].filter(Boolean).join(', '));
            formData.append('start_date', startStr.substring(0, 10));
            formData.append('end_date', endStr.substring(0, 10));
            formData.append('registration_open', document.getElementById('event-reg-open').value || startStr.substring(0, 10));
            formData.append('registration_close', document.getElementById('event-reg-close').value || startStr.substring(0, 10));
            formData.append('capacity', parseInt(document.getElementById('event-capacity').value, 10) || 1200);
            formData.append('status', document.getElementById('event-status').value || "active");
            
            formData.append('location', city);
            
            const assocId = document.getElementById('event-association')?.value;
            if (assocId) formData.append('association_id', assocId);
            
            // Laravel boolean accepts 1 / 0. Using 1/0 instead of true/false string
            formData.append('featured', document.getElementById('event-featured')?.checked ? 1 : 0);

            const fee = document.getElementById('event-fee').value;
            if (fee) formData.append('registration_fee', fee);

            // Append image
            const imageInputEl = document.getElementById('event-image');
            if (imageInputEl && imageInputEl.files.length > 0) {
                // Send strictly the exact key the DB expects to prevent Postman validation discrepancies
                formData.append('event_image', imageInputEl.files[0]);
            }

            submitText.textContent = 'Saving...';
            submitSpinner.classList.remove('hidden');
            submitBtn.disabled = true;
            submitBtn.classList.add('opacity-75', 'cursor-not-allowed');

            try {
                // Use POST for both, but spoof PUT for edits to bypass PHP's FormData limitations
                let endpoint = isEdit ? `${API_BASE}/events/${eventId}` : `${API_BASE}/events`;
                let method = 'POST';

                if (isEdit) {
                    formData.append('_method', 'PUT');
                    // Also append to URL to ensure Laravel intercepts it before body parsing
                    endpoint += '?_method=PUT';
                }

                console.log('--- Debug: Sending FormData ---');
                console.log('Endpoint:', endpoint);
                console.log('Method:', method);
                for (let [key, value] of formData.entries()) {
                    console.log(key + ':', value instanceof File ? `[File] ${value.name} (${value.size} bytes)` : value);
                }
                console.log('-------------------------------');

                const response = await fetch(endpoint, {
                    method: method,
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                        // Do NOT set Content-Type for FormData
                    },
                    body: formData
                });

                if (!response.ok) {
                    let errMsg = `API returned status: ${response.status}`;
                    try {
                        const errData = await response.json();
                        console.error('Validation Errors:', errData);
                        if (errData.errors) {
                            const messages = Object.values(errData.errors).flat().join('\n');
                            errMsg = `Validation Failed:\n${messages}`;
                        } else if (errData.message) {
                            errMsg = errData.message;
                        }
                    } catch(e) {}
                    throw new Error(errMsg);
                }

                alert(isEdit ? 'Event updated successfully!' : 'Event created successfully!');
                window.location.href = 'events.html';
                
            } catch (error) {
                console.error('[Events API] Error saving event:', error);
                alert(error.message || 'Failed to save event. Check console for details.');
                
                submitText.textContent = isEdit ? 'Update Event' : 'Create Event';
                submitSpinner.classList.add('hidden');
                submitBtn.disabled = false;
                submitBtn.classList.remove('opacity-75', 'cursor-not-allowed');
            }
        });
    }
});
