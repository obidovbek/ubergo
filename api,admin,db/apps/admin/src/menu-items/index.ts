/**
 * Menu Items Configuration
 * Defines the navigation menu structure
 */

export interface MenuItem {
  id: string;
  title: string;
  icon: string;
  path: string;
  children?: MenuItem[];
}

export const mainMenuItems: MenuItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: '📊',
    path: '/dashboard',
  },
  {
    id: 'users',
    title: 'Users',
    icon: '👥',
    path: '/users',
  },
  {
    id: 'drivers',
    title: 'Drivers',
    icon: '🚗',
    path: '/drivers',
  },
  {
    id: 'rides',
    title: 'Rides',
    icon: '🗺️',
    path: '/rides',
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: '⚙️',
    path: '/settings',
  },
];

export const settingsMenuItems: MenuItem[] = [
  {
    id: 'profile',
    title: 'Profile',
    icon: '👤',
    path: '/settings/profile',
  },
  {
    id: 'security',
    title: 'Security',
    icon: '🔒',
    path: '/settings/security',
  },
  {
    id: 'notifications',
    title: 'Notifications',
    icon: '🔔',
    path: '/settings/notifications',
  },
];

