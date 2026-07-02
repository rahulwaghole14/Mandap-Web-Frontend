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

    // Setup Edit Mode checks (if ID is in query string)
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('id');
    const isEdit = !!eventId;

    if (isEdit) {
        document.getElementById('form-title').textContent = 'Edit Event';
        // Simulate data loading
        setTimeout(() => {
            document.getElementById('event-name').value = 'Annual General Meeting 2026';
            document.getElementById('event-desc').value = 'Detailed description of the AGM...';
            document.getElementById('event-start').value = '2026-01-15T09:00';
            document.getElementById('event-end').value = '2026-01-16T18:00';
            document.getElementById('event-address').value = 'Shivaji Nagar';
            document.getElementById('event-city').value = 'Pune';
            document.getElementById('event-district').value = 'Pune';
            document.getElementById('event-fee').value = '500';
        }, 500);
    }

    // Image Upload Logic
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
            e.stopPropagation(); // prevent triggering the file input
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
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Validation: end date must be after start date
            const startStr = document.getElementById('event-start').value;
            const endStr = document.getElementById('event-end').value;
            if (startStr && endStr) {
                if (new Date(endStr) <= new Date(startStr)) {
                    alert('End date/time must be after start date/time');
                    return;
                }
            }

            // Simulate saving
            submitText.textContent = 'Saving...';
            submitSpinner.classList.remove('hidden');
            submitBtn.disabled = true;
            submitBtn.classList.add('opacity-75', 'cursor-not-allowed');

            setTimeout(() => {
                alert(isEdit ? 'Event updated successfully!' : 'Event created successfully!');
                window.location.href = 'events.html';
            }, 1000);
        });
    }

});
