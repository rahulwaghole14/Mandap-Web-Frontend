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

    // Mock Saves
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
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
});
