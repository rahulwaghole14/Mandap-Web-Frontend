document.addEventListener('DOMContentLoaded', () => {
  const loginForm     = document.getElementById('loginForm');
  const togglePassword     = document.getElementById('togglePassword');
  const passwordInput      = document.getElementById('password');
  const submitBtn          = document.getElementById('submitBtn');
  const btnText            = document.getElementById('btnText');
  const btnLoading         = document.getElementById('btnLoading');

  const eyeIconTemplate    = document.getElementById('eye-icon').innerHTML;
  const eyeOffIconTemplate = document.getElementById('eye-off-icon').innerHTML;

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

  // ── Form submit → real API call ────────────────────────────────────────────
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email    = document.getElementById('email').value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    setLoading(true);

    try {
      const API_BASE = window.CONFIG.API_BASE_URL;
      const endpoint = `${API_BASE}/auth/login`;

      console.log('[Login] POST →', endpoint);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
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
        { email, name: data.name, role: data.role };

      if (!token) {
        console.warn('[Login] No token found in response – storing session anyway:', data);
      }

      // Persist auth state
      if (token) localStorage.setItem('token', token);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user',      JSON.stringify(user));
      localStorage.setItem('userEmail', user?.email || email);
      localStorage.setItem('userName',  user?.name  || '');
      localStorage.setItem('userRole',  user?.role  || '');

      console.log('[Login] ✅ Success — user:', user?.name || email, '| role:', user?.role);

      showToast(`Welcome back, ${user?.name || email}!`, 'success');

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
