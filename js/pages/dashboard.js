document.addEventListener('DOMContentLoaded', () => {
  // ── Auth Guard ─────────────────────────────────────────────────────────────
  const token = localStorage.getItem('token');
  const userRaw = localStorage.getItem('user');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  // ── Parse stored user data ─────────────────────────────────────────────────
  let user = {};
  try { user = JSON.parse(userRaw) || {}; } catch (_) {}

  const userName  = user.name  || localStorage.getItem('userName')  || 'Admin';
  const userEmail = user.email || localStorage.getItem('userEmail') || '';
  const userRole  = user.role  || localStorage.getItem('userRole')  || 'admin';

  // ── Populate sidebar user info ─────────────────────────────────────────────
  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  setEl('user-name',  userName);
  setEl('user-email', userEmail);
  setEl('user-role',  userRole.charAt(0).toUpperCase() + userRole.slice(1));

  // ── Admin Info Card ────────────────────────────────────────────────────────
  setEl('admin-card-name',  userName);
  setEl('admin-card-email', userEmail);
  setEl('admin-card-role',  userRole.charAt(0).toUpperCase() + userRole.slice(1));
  setEl('admin-card-login', new Date().toLocaleString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }));

  // ── Dashboard welcome subtitle ─────────────────────────────────────────────
  setEl('welcome-subtitle', `Welcome back, ${userName}! Here's your platform overview.`);

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
    const token = localStorage.getItem('token');
    const API_BASE = window.CONFIG.API_BASE_URL;
    
    if (token) {
      try {
        fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }).catch(error => console.error('[Logout] Error:', error));
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

  // ── Load dashboard stats from API ──────────────────────────────────────────
  loadStats();

  async function loadStats() {
    const API_BASE = window.CONFIG.API_BASE_URL;
    const headers  = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    try {
      const res = await fetch(`${API_BASE}/dashboard/stats`, { headers });
      if (!res.ok) throw new Error('Failed to fetch stats');
      
      const json = await res.json();
      const data = json.data;

      if (!data) return;

      // Vendors
      if (data.vendors) {
        setEl('stat-vendors-total',  data.vendors.total || 0);
        setEl('stat-vendors-active', `${data.vendors.active || 0} Active`);
      }

      // Members
      if (data.members) {
        setEl('stat-members-total',  data.members.total || 0);
        setEl('stat-members-active', `${data.members.active || 0} Active`);
      }

      // Events
      if (data.events) {
        setEl('stat-events-total',    data.events.total || 0);
        setEl('stat-events-upcoming', `${data.events.upcoming || 0} Upcoming`);
      }

      // BOD Members
      if (data.bod) {
        setEl('stat-bod-total',  data.bod.total || 0);
        setEl('stat-bod-active', `${data.bod.active || 0} Active`);
      }

      // Associations
      if (data.associations) {
        setEl('stat-assoc-total',  data.associations.total || 0);
        setEl('stat-assoc-active', `${data.associations.active || 0} Active`);
      }

    } catch (error) {
      console.error('[Dashboard] Error loading stats:', error);
    }
  }
});
