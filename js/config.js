// ============================================================
// CENTRAL CONFIG — dynamically determines backend IP
// ============================================================

const getApiBaseUrl = () => {
    const hostname = window.location.hostname;
    if (hostname === 'mandapassociation.com' || hostname === 'www.mandapassociation.com') {
        return 'https://mandapassociation.com/mandapam-backend-php/public/api';
    }
    // For local development on this machine (PHP server runs on port 8000)
    return 'http://127.0.0.1:8000/api';
};

// Legacy window.CONFIG kept for backward compatibility with
// any page that still reads window.CONFIG.API_BASE_URL
const CONFIG = {
    API_BASE_URL: getApiBaseUrl(),

    // Event slug to event ID mapping for public registration pages
    EVENT_SLUGS: {
        'annual-decorators-expo-2026': 1,
        'national-cataering-summit-2026': 2,
        'annual-expo-2026': 5,
        'international-event-design-decoration-expo-2027': 4,
    },

    // Cloudinary configuration
    CLOUDINARY: {
        CLOUD_NAME: '',         // Set your Cloudinary cloud name here
        UPLOAD_PRESET: '',      // Set your Cloudinary unsigned upload preset here
        USE_CLOUDINARY: false,
    },

    // Razorpay configuration (Frontend only needs KEY_ID, but SECRET is included per request)
    RAZORPAY: {
        KEY_ID: 'rzp_test_TDk3Ebfc77WEcB',
        KEY_SECRET: 'vYBmTEhJjlpIgg7rIqUmt4pj'
    }
};

CONFIG.CLOUDINARY.USE_CLOUDINARY = !!CONFIG.CLOUDINARY.CLOUD_NAME && !!CONFIG.CLOUDINARY.UPLOAD_PRESET;

window.CONFIG = CONFIG;

// ============================================================
// RBAC (Role-Based Access Control)
// ============================================================

(function () {
    const userRole = localStorage.getItem('userRole') || '';
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const hasRole = (role) => {
        const storedRole = userRole.toLowerCase();
        const objRole = (user?.role || '').toLowerCase();
        const checkRole = role.toLowerCase();

        // Handle typo where backend returns 'manger' instead of 'manager'
        const isManagerTypo = checkRole === 'manager' && (storedRole === 'manger' || objRole === 'manger');

        return storedRole === checkRole || objRole === checkRole || isManagerTypo;
    };

    const hasPermission = (permission) => {
        if (!userRole) return false;

        if (hasRole('admin')) return true;

        if (hasRole('manager')) {
            const managerPermissions = [
                'events:read',
                'registrations:read',
                'registrations:verify'
            ];
            return managerPermissions.includes(permission);
        }

        if (hasRole('sub-admin')) {
            const subAdminPermissions = [
                'vendors:read',
                'vendors:write',
                'events:read',
                'events:write',
                'bod:read',
                'bod:write',
                'members:read',
                'members:write'
            ];
            return subAdminPermissions.includes(permission);
        }

        return false;
    };

    const navigation = [
        { name: 'Dashboard', href: 'dashboard.html', icon: 'layout-dashboard', permission: null, show: !hasRole('manager') },
        { name: 'Vendors', href: 'vendors.html', icon: 'users', permission: 'vendors:read', show: true },
        { name: 'Events', href: 'events.html', icon: 'calendar', permission: 'events:read', show: !hasRole('manager') },
        { name: 'Registrations', href: 'event-registrations.html', icon: 'clipboard-list', permission: null, show: hasRole('manager') || hasRole('admin') },
        { name: 'NBOD', href: 'nbod.html', icon: 'award', permission: 'bod:read', show: true },
        { name: 'Members', href: 'members.html', icon: 'building', permission: 'members:read', show: true },
        { name: 'Associations', href: 'associations.html', icon: 'map-pin', permission: null, show: !hasRole('manager') },
    ];

    const shouldShowNavigationItem = (item) => {
        if (!item.permission) return true;
        if (hasRole('admin')) return true;
        if (hasRole('sub-admin')) return hasPermission(item.permission);
        return hasPermission(item.permission);
    };

    window.auth = {
        hasRole,
        hasPermission,
        navigation,
        shouldShowNavigationItem
    };

    // Route Protection Guard
    const pathname = window.location.pathname;
    const pageName = pathname.split('/').pop() || 'index.html';
    // USER FLOW COMMENTED OUT: delete-account.html removed from public pages (was user/member self-service)
    // The page still exists but user-flow JS is disabled — only admin/manager can access protected pages
    const publicPages = ['login.html', 'index.html', '', 'test-events-integration.html'];
    // NOTE: 'delete-account.html' and 'event-registration.html' were formerly accessible to members (user flow)
    // They are now only reachable if you are authenticated as admin or manager.

    if (!publicPages.includes(pageName) && pageName.endsWith('.html') && userRole) {
        // Manager Route Redirects
        if (hasRole('manager')) {
            const allowedForManager = ['event-registrations.html', 'event-registration.html', 'settings.html', 'delete-account.html'];
            if (!allowedForManager.includes(pageName)) {
                window.location.href = 'event-registrations.html';
                return;
            }
        }

        // Other role route protection based on sidebar navigation
        const currentNavItem = navigation.find(item => item.href === pageName);
        if (currentNavItem) {
            const shouldShow = shouldShowNavigationItem(currentNavItem) && currentNavItem.show !== false;
            if (!shouldShow) {
                // Not authorized to view this page
                window.location.href = 'dashboard.html';
                return;
            }
        }
    }

    // Dynamic Sidebar Rendering
    document.addEventListener('DOMContentLoaded', () => {
        const navContainer = document.querySelector('nav.flex-1');
        if (navContainer) {
            navContainer.className = 'flex-1 px-3 py-2 space-y-1 overflow-hidden';
            navContainer.innerHTML = ''; // Clear hardcoded links

            navigation.forEach(item => {
                const shouldShow = shouldShowNavigationItem(item);
                if (item.show === false || !shouldShow) return;

                const isActive = (pageName === item.href) ||
                    (pageName === '' && item.href === 'dashboard.html');

                const a = document.createElement('a');
                a.href = item.href;
                a.className = `flex items-center space-x-3 px-3 py-1.5 rounded-lg transition-colors ${isActive
                    ? 'bg-primary-600 text-white font-semibold'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`;

                a.innerHTML = `
                    <i data-lucide="${item.icon}" class="h-5 w-5 flex-shrink-0"></i>
                    <span class="text-sm font-medium">${item.name}</span>
                `;

                navContainer.appendChild(a);
            });

            if (window.lucide) {
                lucide.createIcons({ nameAttr: 'data-lucide', nodes: [navContainer] });
            }
        }

        // Dynamic Sidebar Footer & Logout Integration
        const sidebar = document.querySelector('aside, .w-64.bg-gray-900');
        if (sidebar) {
            // Make header & user info sections compact if present
            const headerSection = sidebar.querySelector('.border-b.border-gray-700, .p-6');
            if (headerSection) {
                headerSection.classList.remove('p-6');
                headerSection.classList.add('px-4', 'py-3');
            }
            const userInfoSection = sidebar.querySelectorAll('.border-b.border-gray-700')[1];
            if (userInfoSection) {
                userInfoSection.classList.remove('p-4');
                userInfoSection.classList.add('px-4', 'py-2.5');
            }

            let footer = sidebar.querySelector('.border-t.border-gray-700');
            if (!footer) {
                footer = document.createElement('div');
                footer.className = 'px-3 py-2 border-t border-gray-700 space-y-1 flex-shrink-0 mt-auto';
                sidebar.appendChild(footer);
            } else {
                footer.className = 'px-3 py-2 border-t border-gray-700 space-y-1 flex-shrink-0 mt-auto';
            }

            const isSettingsActive = (pageName === 'settings.html');
            const settingsClass = isSettingsActive
                ? 'flex items-center space-x-3 px-3 py-1.5 rounded-lg transition-colors bg-primary-600 text-white font-semibold'
                : 'flex items-center space-x-3 px-3 py-1.5 rounded-lg transition-colors text-gray-300 hover:bg-gray-800 hover:text-white';

            footer.innerHTML = `
                <a href="settings.html" class="${settingsClass}">
                    <i data-lucide="settings" class="h-5 w-5 flex-shrink-0"></i>
                    <span class="text-sm font-medium">Settings</span>
                </a>
                <button id="logout-btn" type="button" class="w-full flex items-center space-x-3 px-3 py-1.5 rounded-lg transition-colors text-gray-300 hover:bg-gray-800 hover:text-white cursor-pointer text-left focus:outline-none">
                    <i data-lucide="log-out" class="h-5 w-5 flex-shrink-0"></i>
                    <span class="text-sm font-medium">Logout</span>
                </button>
            `;
            if (window.lucide) {
                lucide.createIcons({ nameAttr: 'data-lucide', nodes: [footer] });
            }
        }

        // Global Click Listener for Logout Button
        document.body.addEventListener('click', (e) => {
            const btn = e.target.closest('#logout-btn');
            if (btn) {
                e.preventDefault();
                const token = localStorage.getItem('token');
                if (token) {
                    fetch(`${CONFIG.API_BASE_URL}/auth/logout`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        }
                    }).catch(err => console.error('[Logout] API error:', err));
                }
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                localStorage.removeItem('userEmail');
                localStorage.removeItem('userName');
                localStorage.removeItem('userRole');
                window.location.href = 'login.html';
            }
        });

        // Global UI Population for User Info
        const updateUIWithUser = (u) => {
            const nameStr = u.name || localStorage.getItem('userName') || 'User';
            const roleStr = u.role || localStorage.getItem('userRole');
            const roleFormatted = roleStr ? roleStr.charAt(0).toUpperCase() + roleStr.slice(1) : 'User';
            const emailStr = u.email || localStorage.getItem('userEmail') || '';
            const profileImg = u.profile_image || u.profile_photo_url || null;

            const userNameEl = document.getElementById('user-name');
            if (userNameEl) {
                const userInfoContainer = userNameEl.closest('.flex.items-center.space-x-3');
                if (userInfoContainer) {
                    let imgUrl = null;
                    if (profileImg) {
                        imgUrl = profileImg.startsWith('http') ? profileImg : `${CONFIG.API_BASE_URL.replace('/api', '')}/${profileImg.replace(new RegExp('^/'), '')}`;
                    }

                    let imgHtml = imgUrl
                        ? `<img src="${imgUrl}" class="h-10 w-10 rounded-full object-cover shadow-sm ring-2 ring-primary-500">`
                        : `<div class="h-10 w-10 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0"><i data-lucide="user" class="h-5 w-5 text-white"></i></div>`;

                    userInfoContainer.innerHTML = `
                        ${imgHtml}
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium text-white truncate" id="user-name" title="${nameStr}">${nameStr}</p>
                            ${emailStr ? `<p class="text-xs text-gray-400 truncate" id="user-email" title="${emailStr}">${emailStr}</p>` : ''}
                            ${roleStr ? `<span class="text-xs bg-primary-700 text-primary-200 px-2 py-0.5 rounded-full inline-block mt-1" id="user-role">${roleFormatted}</span>` : ''}
                        </div>
                    `;

                    // Re-initialize lucide icons since we injected new HTML
                    if (window.lucide) {
                        lucide.createIcons({ nameAttr: 'data-lucide', nodes: [userInfoContainer] });
                    }
                }
            }

            // Update admin dashboard card (if on dashboard)
            const adminCardName = document.getElementById('admin-card-name');
            if (adminCardName) adminCardName.textContent = nameStr;

            const adminCardRole = document.getElementById('admin-card-role');
            if (adminCardRole) adminCardRole.textContent = roleFormatted;

            const adminCardEmail = document.getElementById('admin-card-email');
            if (adminCardEmail) adminCardEmail.textContent = emailStr;
        };

        // Initial populate with local storage data
        updateUIWithUser(user);

        // Fetch fresh profile data
        const token = localStorage.getItem('token');
        if (token && !publicPages.includes(pageName)) {
            fetch(`${CONFIG.API_BASE_URL}/auth/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            })
                .then(res => res.json())
                .then(data => {
                    console.log('[GET /auth/profile] Response (Global):', data);
                    if (data.success && data.data && data.data.user) {
                        const freshUser = data.data.user;
                        localStorage.setItem('user', JSON.stringify(freshUser));
                        localStorage.setItem('userName', freshUser.name);
                        localStorage.setItem('userRole', freshUser.role);
                        localStorage.setItem('userEmail', freshUser.email);
                        updateUIWithUser(freshUser);
                    }
                })
                .catch(err => console.error('Failed to fetch profile:', err));
        }
    });

})();
