document.addEventListener('DOMContentLoaded', () => {
  const loginForm     = document.getElementById('loginForm');
  const togglePassword     = document.getElementById('togglePassword');
  const passwordInput      = document.getElementById('password');
  const submitBtn          = document.getElementById('submitBtn');
  const btnText            = document.getElementById('btnText');
  const btnLoading         = document.getElementById('btnLoading');

  const eyeIconTemplate    = document.getElementById('eye-icon').innerHTML;
  const eyeOffIconTemplate = document.getElementById('eye-off-icon').innerHTML;

  const tabAdmin           = document.getElementById('tabAdmin');
  const tabMember          = document.getElementById('tabMember');
  const adminFields        = document.getElementById('adminFields');
  const memberFields       = document.getElementById('memberFields');
  const adminFooter        = document.getElementById('adminFooter');
  const memberFooter       = document.getElementById('memberFooter');
  const authNote           = document.getElementById('authNote');
  const mobileInput        = document.getElementById('mobile');
  const otpInput           = document.getElementById('otp');
  const otpGroup           = document.getElementById('otpGroup');
  const btnLoadingText     = document.getElementById('btnLoadingText');
  
  let currentTab = 'admin'; // 'admin' or 'member'
  let otpSent = false;

  // ── Toast ──────────────────────────────────────────────────────────────────
  const showToast = (message, type = 'success') => {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `px-4 py-3 rounded shadow-lg text-white text-sm font-medium transition-opacity duration-300 ${
      type === 'success' ? 'bg-green-500'
      : type === 'info'  ? 'bg-blue-500'
      :                    'bg-red-500'
    }`;
    toast.style.opacity = '0';
    toast.textContent = message; // textContent – no XSS risk
    toastContainer.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => { toast.style.opacity = '1'; });

    // Auto-remove after 4 s
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  };

  // ── Password visibility toggle ─────────────────────────────────────────────
  togglePassword.addEventListener('click', () => {
    const isPassword = passwordInput.getAttribute('type') === 'password';
    passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
    togglePassword.innerHTML = isPassword ? eyeOffIconTemplate : eyeIconTemplate;
  });

  // ── Set loading state ──────────────────────────────────────────────────────
  const setLoading = (loading) => {
    submitBtn.disabled = loading;
    btnText.classList.toggle('hidden', loading);
    btnLoading.classList.toggle('hidden', !loading);
  };

  // ── Tab switching ────────────────────────────────────────────────────────
  const switchTab = (tab) => {
    currentTab = tab;
    
    // Reset forms & state
    loginForm.reset();
    otpSent = false;
    
    // Update tab styling
    if (tab === 'admin') {
      tabAdmin.className = "flex-1 py-3 text-sm font-medium border-b-2 border-primary-600 text-primary-600 focus:outline-none";
      tabMember.className = "flex-1 py-3 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 focus:outline-none";
      
      adminFields.classList.replace('hidden', 'block');
      adminFooter.classList.replace('hidden', 'block');
      authNote.classList.replace('hidden', 'block');
      
      memberFields.classList.replace('block', 'hidden');
      memberFooter.classList.replace('block', 'hidden');
      
      btnText.textContent = 'Sign in';
    } else {
      tabMember.className = "flex-1 py-3 text-sm font-medium border-b-2 border-primary-600 text-primary-600 focus:outline-none";
      tabAdmin.className = "flex-1 py-3 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 focus:outline-none";
      
      memberFields.classList.replace('hidden', 'block');
      memberFooter.classList.replace('hidden', 'block');
      
      adminFields.classList.replace('block', 'hidden');
      adminFooter.classList.replace('block', 'hidden');
      authNote.classList.replace('block', 'hidden');
      
      otpGroup.classList.add('hidden');
      mobileInput.readOnly = false;
      btnText.textContent = 'Send OTP';
    }
  };

  tabAdmin.addEventListener('click', () => switchTab('admin'));
  tabMember.addEventListener('click', () => switchTab('member'));

  // ── Send OTP API ──────────────────────────────────────────────────────────
  const requestOTP = async (mobileNumber) => {
    btnLoadingText.textContent = 'Sending OTP...';
    setLoading(true);
    try {
      const response = await fetch(`${window.CONFIG.API_BASE_URL}/members/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber: mobileNumber })
      });
      let data = {};
      try { data = await response.json(); } catch (_) {}
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send OTP');
      }
      
      showToast('OTP sent to your registered mobile number', 'success');
      otpSent = true;
      
      // Update UI for OTP entry
      mobileInput.readOnly = true;
      otpGroup.classList.remove('hidden');
      btnText.textContent = 'Verify & Login';
      
    } catch (error) {
      console.error('[OTP]', error);
      showToast(error.message || 'Network error while sending OTP', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── Form submit → real API call ────────────────────────────────────────────
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (currentTab === 'member' && !otpSent) {
      // Step 1: Send OTP
      const mobileNumber = mobileInput.value.trim();
      if (!/^\d{10}$/.test(mobileNumber)) {
        showToast('Please enter a valid 10-digit mobile number', 'error');
        return;
      }
      await requestOTP(mobileNumber);
      return;
    }

    let payload = {};
    if (currentTab === 'admin') {
      const email = document.getElementById('email').value.trim();
      const password = passwordInput.value;
      if (!email || !password) {
        showToast('Please fill in all fields', 'error');
        return;
      }
      payload = { email, password };
    } else {
      const mobile = mobileInput.value.trim();
      const otp = otpInput.value.trim();
      if (!otp || otp.length !== 6) {
        showToast('Please enter the 6-digit OTP', 'error');
        return;
      }
      payload = { mobileNumber: mobile, otp };
    }

    btnLoadingText.textContent = 'Signing in...';
    setLoading(true);

    try {
      const API_BASE = window.CONFIG.API_BASE_URL;
      const endpoint = currentTab === 'admin' ? `${API_BASE}/auth/login` : `${API_BASE}/members/auth/verify-otp`;

      console.log('[Login] POST →', endpoint);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000) // 30 seconds timeout
      });

      // Try to parse JSON regardless of status so we can show server messages
      let data = {};
      try { data = await response.json(); } catch (_) {}

      console.log('[Login] Response status:', response.status);
      console.log('[Login] Response data:', data);

      if (!response.ok) {
        // Surface the server's error message if available
        const serverMsg =
          data?.message ||
          data?.error   ||
          data?.msg     ||
          (response.status === 401 ? 'Invalid email or password' :
           response.status === 403 ? 'Access denied. Admin/Sub-Admin only.' :
           `Login failed (HTTP ${response.status})`);
        throw new Error(serverMsg);
      }

      // ── Success ─────────────────────────────────────────────────────────────
      // Support multiple common JWT response shapes:
      //   { token }  |  { data: { token } }  |  { accessToken }
      const token =
        data.token       ||
        data.accessToken ||
        data.data?.token ||
        data.data?.accessToken;

      const refreshToken =
        data.refreshToken ||
        data.data?.refreshToken;

      const user =
        data.user       ||
        data.data?.user ||
        data.admin      ||
        data.data?.admin||
        data.member     ||
        { email: payload.email || payload.mobileNumber, name: data.name, role: data.role };

      if (!token) {
        console.warn('[Login] No token found in response – storing session anyway:', data);
      }

      // Persist auth state
      if (token) localStorage.setItem('token', token);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user',      JSON.stringify(user));
      localStorage.setItem('userEmail', user?.email || payload.email || payload.mobileNumber);
      localStorage.setItem('userName',  user?.name || user?.first_name || '');
      localStorage.setItem('userRole',  user?.role || user?.type || '');

      const displayName = user?.name || user?.first_name || payload.email || payload.mobileNumber;
      console.log('[Login] ✅ Success — user:', displayName, '| role:', user?.role || user?.type);

      showToast(`Welcome back, ${displayName}!`, 'success');

      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = './dashboard.html';
      }, 900);

    } catch (error) {
      console.error('[Login] ❌ Error:', error);

      const isNetworkError = error instanceof TypeError;
      const isTimeout = error.name === 'TimeoutError' || error.name === 'AbortError';
      let msg = error.message || 'Login failed. Please try again.';
      
      if (isTimeout) {
        msg = `Connection Timed Out: The server at ${window.CONFIG.API_BASE_URL} took too long to respond (30s). Please try again.`;
      } else if (isNetworkError) {
        msg = `Network/CORS Error: Cannot reach server at ${window.CONFIG.API_BASE_URL}. Ensure backend is running and accessible.`;
      }

      showToast(msg, 'error');
      setLoading(false);
    }
  });
});
