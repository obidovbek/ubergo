import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';
import * as NotificationsAPI from '../api/notifications';
import { setupForegroundNotificationHandler } from '../services/PushService';
import { showToast } from '../utils/toast';

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    read: boolean;
    created_at: string;
    updated_at: string;
    data?: any;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    refreshing: boolean;
    loadNotifications: () => Promise<void>;
    markAsRead: (notificationId: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (notificationId: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { token } = useAuth();
    const { t } = useTranslation();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const loadNotifications = useCallback(async (isRefresh = false) => {
        if (!token) return;

        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            const response = await NotificationsAPI.getNotifications(token);
            if (response.success && response.data) {
                // Handle different response structures:
                // 1. { success: true, data: { data: [...], total, unread } }
                // 2. { success: true, data: [...] } (array directly)
                let notifications: Notification[] = [];
                let unread = 0;

                if (Array.isArray(response.data)) {
                    // If data is an array directly
                    notifications = response.data;
                    unread = notifications.filter(n => !n.read).length;
                } else if (response.data && typeof response.data === 'object' && 'data' in response.data) {
                    // If data is an object with a data property
                    notifications = Array.isArray(response.data.data) ? response.data.data : [];
                    unread = response.data.unread !== undefined 
                        ? response.data.unread 
                        : notifications.filter(n => !n.read).length;
                }

                setNotifications(notifications);
                setUnreadCount(unread);
            }
        } catch (error: any) {
            console.error('Failed to load notifications:', error);
            // Only show toast on manual refresh or initial load, not background updates
            if (isRefresh || loading) {
                showToast.error(t('notifications.loadError'), error.message || t('notifications.loadErrorDescription'));
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [token, t]);

    // Initial load when token changes
    useEffect(() => {
        if (token) {
            loadNotifications();
        } else {
            setNotifications([]);
            setUnreadCount(0);
        }
    }, [token, loadNotifications]);

    // Setup push notification listener
    useEffect(() => {
        if (!token) return;

        const unsubscribe = setupForegroundNotificationHandler((message) => {
            console.log('Notification received in context, refreshing list...');
            // Refresh notifications silently
            loadNotifications(false);

            // Optionally show a toast for the new notification
            if (message.notification) {
                showToast.info(message.notification.title, message.notification.body);
            }
        });

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [token, loadNotifications]);

    const markAsRead = async (notificationId: string) => {
        if (!token) return;

        try {
            await NotificationsAPI.markNotificationAsRead(token, notificationId);
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error: any) {
            console.error('Failed to mark notification as read:', error);
            showToast.error(t('notifications.markReadError'), error.message);
            throw error;
        }
    };

    const markAllAsRead = async () => {
        if (!token) return;

        try {
            await NotificationsAPI.markAllNotificationsAsRead(token);
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
            showToast.success(t('notifications.allMarkedRead'));
        } catch (error: any) {
            console.error('Failed to mark all as read:', error);
            showToast.error(t('notifications.markAllReadError'), error.message);
            throw error;
        }
    };

    const deleteNotification = async (notificationId: string) => {
        if (!token) return;

        try {
            await NotificationsAPI.deleteNotification(token, notificationId);
            const notification = notifications.find(n => n.id === notificationId);
            setNotifications(prev => prev.filter(n => n.id !== notificationId));

            if (notification && !notification.read) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
            showToast.success(t('notifications.deleted'));
        } catch (error: any) {
            console.error('Failed to delete notification:', error);
            showToast.error(t('notifications.deleteError'), error.message);
            throw error;
        }
    };

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                loading,
                refreshing,
                loadNotifications: () => loadNotifications(true),
                markAsRead,
                markAllAsRead,
                deleteNotification,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
