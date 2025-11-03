/**
 * Global Configuration
 * Application-wide settings and constants
 */

export const APP_CONFIG = {
  // App Information
  appName: 'UberGo Admin',
  appVersion: '1.0.0',
  
  // Pagination
  pagination: {
    defaultPageSize: 25,
    pageSizeOptions: [10, 25, 50, 100],
  },
  
  // Date Format
  dateFormat: {
    display: 'MMM DD, YYYY',
    displayWithTime: 'MMM DD, YYYY HH:mm',
    api: 'YYYY-MM-DD',
  },
  
  // Feature Flags
  features: {
    enableNotifications: true,
    enableExport: true,
    enableBulkActions: true,
  },
  
  // Cache Duration (in milliseconds)
  cache: {
    userProfile: 300000,     // 5 minutes
    dashboard: 60000,        // 1 minute
  },
};

export default APP_CONFIG;

