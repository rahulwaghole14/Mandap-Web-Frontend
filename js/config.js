// ============================================================
// CENTRAL CONFIG — dynamically determines backend IP
// ============================================================

const getApiBaseUrl = () => {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;

    // If opening the HTML directly from the filesystem (file:///...)
    if (protocol === 'file:' || !hostname) {
        return 'http://192.168.0.119:8000/api'; // Default fallback for local file testing
    }

    // Local development (if accessing via localhost)
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://192.168.0.119:8000/api';
    }

    // Dynamic local network or production
    // If accessing via an IP like 192.168.X.X, this will construct the correct API URL dynamically
    if (hostname.match(/^[0-9.]+$/)) {
        return `http://${hostname}:8000/api`;
    }

    // Production / Fallback - assumes backend is on the same origin
    return window.location.origin + '/api';
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
    }
};

CONFIG.CLOUDINARY.USE_CLOUDINARY = !!CONFIG.CLOUDINARY.CLOUD_NAME && !!CONFIG.CLOUDINARY.UPLOAD_PRESET;

window.CONFIG = CONFIG;

// ============================================================
// RBAC (Role-Based Access Control)
// ============================================================

(function() {
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
    const publicPages = ['login.html', 'index.html', '', 'test-events-integration.html'];
    
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
        const navContainer = document.querySelector('nav.flex-1.p-4.space-y-2');
        if (navContainer) {
            navContainer.innerHTML = ''; // Clear hardcoded links
            
            navigation.forEach(item => {
                const shouldShow = shouldShowNavigationItem(item);
                if (item.show === false || !shouldShow) return;
                
                const isActive = (pageName === item.href) || 
                                 (pageName === '' && item.href === 'dashboard.html');
                
                const a = document.createElement('a');
                a.href = item.href;
                a.className = `flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`;
                
                a.innerHTML = `
                    <i data-lucide="${item.icon}" class="h-5 w-5"></i>
                    <span class="text-sm font-medium">${item.name}</span>
                `;
                
                navContainer.appendChild(a);
            });

            if (window.lucide) {
                lucide.createIcons({ nameAttr: 'data-lucide', nodes: [navContainer] });
            }
        }

        // Global UI Population for User Info
        const userNameEl = document.getElementById('user-name');
        if (userNameEl) {
            userNameEl.textContent = user.name || localStorage.getItem('userName') || 'User';
        }
        const userRoleEl = document.getElementById('user-role');
        if (userRoleEl) {
            const roleStr = user.role || userRole;
            userRoleEl.textContent = roleStr ? roleStr.charAt(0).toUpperCase() + roleStr.slice(1) : 'User';
        }
        const userEmailEl = document.getElementById('user-email');
        if (userEmailEl) {
            userEmailEl.textContent = user.email || localStorage.getItem('userEmail') || '';
        }
    });

})();
