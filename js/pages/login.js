document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const togglePassword = document.getElementById('togglePassword');
  const passwordInput = document.getElementById('password');
  const togglePasswordIcon = document.getElementById('togglePasswordIcon');
  
  const eyeIconTemplate = document.getElementById('eye-icon').innerHTML;
  const eyeOffIconTemplate = document.getElementById('eye-off-icon').innerHTML;
  
  const submitBtn = document.getElementById('submitBtn');
  const btnText = document.getElementById('btnText');
  const btnLoading = document.getElementById('btnLoading');
  
  // Create a toast notification function since we don't have react-hot-toast
  const showToast = (message, type = 'success') => {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `px-4 py-3 rounded shadow-lg text-white text-sm font-medium transition-opacity duration-300 ${
      type === 'success' ? 'bg-green-500' : 'bg-red-500'
    }`;
    toast.textContent = message;
    
    toastContainer.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
      toast.style.opacity = '1';
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3000);
  };

  // Toggle password visibility
  togglePassword.addEventListener('click', () => {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    
    if (type === 'password') {
      togglePassword.innerHTML = eyeIconTemplate;
    } else {
      togglePassword.innerHTML = eyeOffIconTemplate;
    }
  });

  // Handle form submission
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = passwordInput.value;
    
    if (!email || !password) {
      showToast('Please fill in all fields', 'error');
      return;
    }
    
    // Simulate loading state
    submitBtn.disabled = true;
    btnText.classList.add('hidden');
    btnLoading.classList.remove('hidden');
    
    // Simulate network request delay (like the React app calling AuthContext)
    setTimeout(() => {
      // Dummy credential validation
      const validEmails = ['admin@mandapam.com', 'manager@mandapam.com', 'subadmin@mandapam.com', 'user@mandapam.com'];
      
      if (validEmails.includes(email) && password.length >= 6) {
        console.log('Login simulated successfully', { email });
        
        showToast('Login successful!', 'success');
        
        // Store a mock token just in case other pages need it
        localStorage.setItem('token', 'mock-html-token');
        localStorage.setItem('userEmail', email);
        
        // Redirect to dashboard (assuming dashboard.html exists)
        setTimeout(() => {
          window.location.href = './dashboard.html';
        }, 1000);
      } else {
        // Reset button state
        submitBtn.disabled = false;
        btnText.classList.remove('hidden');
        btnLoading.classList.add('hidden');
        
        showToast('Invalid email or password', 'error');
      }
    }, 1500);
  });
});
