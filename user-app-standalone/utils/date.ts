/**
 * Date Utilities
 * Helper functions for date formatting and manipulation
 */

import type { Language } from '../config/languages';

/**
 * Get locale string from language code
 */
const getLocaleFromLanguage = (language: Language): string => {
  switch (language) {
    case 'uz':
      return 'uz-UZ';
    case 'ru':
      return 'ru-RU';
    case 'en':
    default:
      return 'en-US';
  }
};

/**
 * Uzbek month names mapping
 */
const uzMonthsShort = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'];
const uzMonthsLong = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];

/**
 * Format month name based on language
 */
const formatMonth = (dateObj: Date, language: Language, format: 'short' | 'long' = 'short'): string => {
  if (language === 'uz') {
    const monthIndex = dateObj.getMonth();
    return format === 'short' ? uzMonthsShort[monthIndex] : uzMonthsLong[monthIndex];
  }
  // For other languages, rely on locale formatting
  const locale = getLocaleFromLanguage(language);
  return dateObj.toLocaleDateString(locale, { month: format });
};

/**
 * Format date to readable string with multilanguage support
 */
export const formatDate = (
  date: string | Date,
  format: 'short' | 'long' = 'short',
  language: Language = 'en'
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const locale = getLocaleFromLanguage(language);

  if (format === 'long') {
    // For Uzbek, use manual month mapping for better reliability
    if (language === 'uz') {
      const month = formatMonth(dateObj, 'uz', 'long');
      const day = dateObj.getDate();
      const year = dateObj.getFullYear();
      const hours = dateObj.getHours().toString().padStart(2, '0');
      const minutes = dateObj.getMinutes().toString().padStart(2, '0');
      return `${day} ${month}, ${year} ${hours}:${minutes}`;
    }
    
    // For other languages, use locale formatting
    try {
      return dateObj.toLocaleString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: language === 'en',
      });
    } catch (error) {
      // Fallback if locale is not supported
      return dateObj.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: language === 'en',
      });
    }
  }

  // For Uzbek, use manual month mapping for better reliability
  if (language === 'uz') {
    const month = formatMonth(dateObj, 'uz', 'short');
    const day = dateObj.getDate();
    const year = dateObj.getFullYear();
    return `${day} ${month}, ${year}`;
  }
  
  // For other languages, use locale formatting
  // For Uzbek, use manual month mapping for better reliability
  if (language === 'uz') {
    const month = formatMonth(dateObj, 'uz', 'short');
    const day = dateObj.getDate();
    const year = dateObj.getFullYear();
    return `${day} ${month}, ${year}`;
  }
  
  // For other languages, use locale formatting
  return dateObj.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format date and time together (for offer cards)
 */
export const formatDateTime = (
  date: string | Date,
  language: Language = 'en'
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const locale = getLocaleFromLanguage(language);
  
  // For Uzbek, use manual month mapping for better reliability
  if (language === 'uz') {
    const month = formatMonth(dateObj, 'uz', 'short');
    const day = dateObj.getDate();
    const hours = dateObj.getHours().toString().padStart(2, '0');
    const minutes = dateObj.getMinutes().toString().padStart(2, '0');
    return `${day} ${month}, ${hours}:${minutes}`;
  }
  
  // For other languages, use locale formatting
  try {
    const formatted = dateObj.toLocaleString(locale, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: language === 'en', // Use 12-hour format for English, 24-hour for others
    });
    return formatted;
  } catch (error) {
    // Fallback if locale is not supported
    const dateStr = dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    const timeStr = dateObj.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: language === 'en',
    });
    return `${dateStr}, ${timeStr}`;
  }
};

/**
 * Format time to readable string with multilanguage support
 */
export const formatTime = (date: string | Date, language: Language = 'en'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const locale = getLocaleFromLanguage(language);
  
  return dateObj.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Get relative time (e.g., "2 hours ago")
 */
export const getRelativeTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return 'just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else {
    return formatDate(dateObj);
  }
};

/**
 * Check if date is today
 */
export const isToday = (date: string | Date): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  
  return (
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear()
  );
};

/**
 * Calculate duration between two dates
 */
export const calculateDuration = (start: string | Date, end: string | Date): string => {
  const startObj = typeof start === 'string' ? new Date(start) : start;
  const endObj = typeof end === 'string' ? new Date(end) : end;
  
  const diffMs = endObj.getTime() - startObj.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

