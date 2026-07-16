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
  loadRecentMembers();
  loadTopAssociations();

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

      // Render Performance Chart
      renderPerformanceChart(data);

    } catch (error) {
      console.error('[Dashboard] Error loading stats:', error);
    }
  }

  function renderPerformanceChart(data) {
    if (!window.Chart) {
      console.warn('[Dashboard] Chart.js is not loaded.');
      return;
    }

    const ctx = document.getElementById('performanceChart');
    if (!ctx) return;

    // Destroy existing chart if it exists (for refresh)
    if (window.performanceChartInstance) {
      window.performanceChartInstance.destroy();
    }

    // Extract totals
    const membersTotal = data.members?.total || 0;
    const assocTotal = data.associations?.total || 0;
    const bodTotal = data.bod?.total || 0;
    const vendorsTotal = data.vendors?.total || 0;
    const eventsTotal = data.events?.total || 0;

    window.performanceChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Members', 'Assoc.', 'BOD', 'Vendors', 'Events'],
        datasets: [{
          label: 'Total Count',
          data: [membersTotal, assocTotal, bodTotal, vendorsTotal, eventsTotal],
          backgroundColor: [
            'rgba(16, 185, 129, 0.7)', // emerald-500
            'rgba(99, 102, 241, 0.7)', // indigo-500
            'rgba(234, 179, 8, 0.7)',  // yellow-500
            'rgba(59, 130, 246, 0.7)', // blue-500
            'rgba(168, 85, 247, 0.7)'  // purple-500
          ],
          borderColor: [
            'rgb(16, 185, 129)',
            'rgb(99, 102, 241)',
            'rgb(234, 179, 8)',
            'rgb(59, 130, 246)',
            'rgb(168, 85, 247)'
          ],
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false // Hide legend
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0
            }
          }
        }
      }
    });
  }

  async function loadRecentMembers() {
    const API_BASE = window.CONFIG.API_BASE_URL;
    const headers  = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    try {
      const res = await fetch(`${API_BASE}/members`, { headers });
      if (!res.ok) throw new Error('Failed to fetch members');
      
      const json = await res.json();
      let members = [];
      if (json.success && json.data && Array.isArray(json.data.results)) {
        members = json.data.results;
      } else if (Array.isArray(json)) {
        members = json;
      }
      
      if (!members || members.length === 0) return;

      // Sort by created_at (descending) or by id (descending)
      members.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : a.id;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : b.id;
          return dateB - dateA;
      });
      
      // Get top 5 recent members
      const recentMembers = members.slice(0, 5);
      
      const tbody = document.getElementById('recent-members-tbody');
      if (!tbody) return;
      
      tbody.innerHTML = '';
      
      recentMembers.forEach(member => {
        // Format date
        let joinedDateStr = 'Unknown';
        let timeAgoStr = 'N/A';
        if (member.created_at) {
            const joinedDate = new Date(member.created_at);
            joinedDateStr = joinedDate.toLocaleDateString('en-IN');
            
            const diffTime = Math.abs(new Date() - joinedDate);
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays === 0) timeAgoStr = 'Today';
            else if (diffDays === 1) timeAgoStr = 'Yesterday';
            else timeAgoStr = `${diffDays} days ago`;
        }

        // Calculate age
        let dobStr = 'Unknown';
        let ageStr = '';
        if (member.dob) {
            const dob = new Date(member.dob);
            if (!isNaN(dob.getTime())) {
                dobStr = dob.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: '2-digit' });
                const ageDifMs = Date.now() - dob.getTime();
                const ageDate = new Date(ageDifMs); 
                const age = Math.abs(ageDate.getUTCFullYear() - 1970);
                ageStr = `Age: ${age} years`;
            } else {
                dobStr = member.dob;
            }
        }

        const city = member.address ? (member.address.split(',')[member.address.split(',').length - 2] || member.address).trim() : (member.city || 'Unknown City');
        const fullName = member.full_name || member.name || `${member.first_name || ''} ${member.last_name || ''}`.trim() || 'Unknown';
        const assocName = member.association ? member.association.name : (member.association_id ? `Assoc #${member.association_id}` : 'N/A');
        
        let avatarHtml = `<div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center"><i data-lucide="user" class="h-5 w-5 text-blue-600"></i></div>`;
        if (member.profile_image) {
            const imgUrl = member.profile_image.startsWith('http') ? member.profile_image : `${API_BASE.replace('/api', '')}/storage/${member.profile_image}`;
            avatarHtml = `<img src="${imgUrl}" alt="${fullName}" class="h-10 w-10 rounded-full object-cover">`;
        }

        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-50 transition-colors';
        tr.innerHTML = `
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="flex items-center">
              <div class="flex-shrink-0 h-10 w-10">
                ${avatarHtml}
              </div>
              <div class="ml-4">
                <div class="text-sm font-medium text-gray-900">${fullName}</div>
                <div class="text-sm text-gray-500">${city}</div>
              </div>
            </div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm text-gray-900">${assocName}</div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm text-gray-900">${member.business || 'N/A'}</div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm text-gray-900">${dobStr}</div>
            <div class="text-xs text-gray-500">${ageStr}</div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm text-gray-900">${member.mobile || 'N/A'}</div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm text-gray-900">${timeAgoStr}</div>
            <div class="text-xs text-gray-500">${joinedDateStr}</div>
          </td>
        `;
        tbody.appendChild(tr);
      });
      
      if (window.lucide) lucide.createIcons();

    } catch (error) {
      console.error('[Dashboard] Error loading recent members:', error);
    }
  }

  async function loadTopAssociations() {
    const API_BASE = window.CONFIG.API_BASE_URL;
    const headers  = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    try {
      const res = await fetch(`${API_BASE}/associations`, { headers });
      if (!res.ok) throw new Error('Failed to fetch associations');
      
      const json = await res.json();
      let associations = [];
      if (json.success && json.data && Array.isArray(json.data.results)) {
        associations = json.data.results;
      } else if (Array.isArray(json)) {
        associations = json;
      }
      
      if (!associations || associations.length === 0) {
        const listEl = document.getElementById('top-associations-list');
        if (listEl) listEl.innerHTML = '<li class="py-3 text-sm text-gray-500 text-center">No associations found.</li>';
        return;
      }

      // Sort by members_count if available, otherwise by created_at or id
      associations.sort((a, b) => {
          if (a.members_count !== undefined && b.members_count !== undefined) {
              return b.members_count - a.members_count;
          }
          const dateA = a.created_at ? new Date(a.created_at).getTime() : a.id;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : b.id;
          return dateB - dateA;
      });
      
      const topAssoc = associations.slice(0, 5);
      
      const listEl = document.getElementById('top-associations-list');
      if (!listEl) return;
      
      listEl.innerHTML = '';
      
      topAssoc.forEach(assoc => {
        const name = assoc.name || 'Unnamed';
        const city = assoc.city || 'Unknown City';
        const state = assoc.state || '';
        const location = [city, state].filter(Boolean).join(', ');
        
        let membersHtml = '';
        if (assoc.members_count !== undefined) {
            membersHtml = `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">${assoc.members_count} Members</span>`;
        } else {
            membersHtml = `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">${assoc.status || 'Active'}</span>`;
        }

        const li = document.createElement('li');
        li.className = 'py-3 flex justify-between items-center hover:bg-gray-50 transition-colors px-2 -mx-2 rounded-lg';
        li.innerHTML = `
          <div class="flex items-center">
            <div class="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
              <i data-lucide="building" class="h-5 w-5 text-primary-600"></i>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-900">${name}</p>
              <p class="text-xs text-gray-500">${location}</p>
            </div>
          </div>
          <div>
            ${membersHtml}
          </div>
        `;
        listEl.appendChild(li);
      });
      
      if (window.lucide) lucide.createIcons();

    } catch (error) {
      console.error('[Dashboard] Error loading top associations:', error);
      const listEl = document.getElementById('top-associations-list');
      if (listEl) {
          listEl.innerHTML = '<li class="py-3 text-sm text-red-500 text-center">Error loading associations</li>';
      }
    }
  }
});
