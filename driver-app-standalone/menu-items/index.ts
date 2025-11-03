/**
 * Menu Items Configuration
 * Defines navigation menu structure
 */

export interface MenuItem {
  id: string;
  title: string;
  icon: string;
  path?: string;
  children?: MenuItem[];
}

export const mainMenuItems: MenuItem[] = [
  {
    id: 'home',
    title: 'Home',
    icon: '🏠',
    path: 'Home',
  },
  {
    id: 'activity',
    title: 'Activity',
    icon: '📊',
    path: 'Activity',
  },
  {
    id: 'profile',
    title: 'Profile',
    icon: '👤',
    path: 'Profile',
  },
];

export const profileMenuItems: MenuItem[] = [
  {
    id: 'edit',
    title: 'Edit Profile',
    icon: '✏️',
    path: 'EditProfile',
  },
  {
    id: 'payment',
    title: 'Payment Methods',
    icon: '💳',
    path: 'PaymentMethods',
  },
  {
    id: 'history',
    title: 'Ride History',
    icon: '📜',
    path: 'RideHistory',
  },
  {
    id: 'help',
    title: 'Help & Support',
    icon: '❓',
    path: 'Help',
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: '⚙️',
    path: 'Settings',
  },
];

export const settingsMenuItems: MenuItem[] = [
  {
    id: 'notifications',
    title: 'Notifications',
    icon: '🔔',
  },
  {
    id: 'privacy',
    title: 'Privacy',
    icon: '🔒',
  },
  {
    id: 'language',
    title: 'Language',
    icon: '🌐',
  },
  {
    id: 'about',
    title: 'About',
    icon: 'ℹ️',
  },
];

