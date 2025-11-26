/**
 * Notifications Screen
 * Display and manage all notifications
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { createTheme } from '../themes';
import { useTranslation } from '../hooks/useTranslation';
import { showToast } from '../utils/toast';
import * as NotificationsAPI from '../api/notifications';
import type { Notification } from '../api/notifications';

const theme = createTheme('light');

export const NotificationsScreen: React.FC = () => {
  const { token } = useAuth();
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = useCallback(async () => {
    if (!token) return;

    try {
      const response = await NotificationsAPI.getNotifications(token);
      if (response.success && response.data) {
        setNotifications(response.data);
        setUnreadCount(response.unread || response.data.filter(n => !n.read).length);
      }
    } catch (error: any) {
      console.error('Failed to load notifications:', error);
      showToast('error', t('notifications.loadError'), error.message || t('notifications.loadErrorDescription'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, t]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAsRead = async (notification: Notification) => {
    if (!token || notification.read) return;

    try {
      await NotificationsAPI.markNotificationAsRead(token, notification.id);
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error: any) {
      console.error('Failed to mark notification as read:', error);
      showToast('error', t('notifications.markReadError'), error.message);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!token || unreadCount === 0) return;

    Alert.alert(
      t('notifications.markAllRead'),
      t('notifications.markAllReadConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: async () => {
            try {
              await NotificationsAPI.markAllNotificationsAsRead(token);
              setNotifications(prev => prev.map(n => ({ ...n, read: true })));
              setUnreadCount(0);
              showToast('success', t('notifications.allMarkedRead'));
            } catch (error: any) {
              console.error('Failed to mark all as read:', error);
              showToast('error', t('notifications.markAllReadError'), error.message);
            }
          },
        },
      ]
    );
  };

  const handleDelete = async (notification: Notification) => {
    if (!token) return;

    Alert.alert(
      t('notifications.delete'),
      t('notifications.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('notifications.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await NotificationsAPI.deleteNotification(token, notification.id);
              setNotifications(prev => prev.filter(n => n.id !== notification.id));
              if (!notification.read) {
                setUnreadCount(prev => Math.max(0, prev - 1));
              }
              showToast('success', t('notifications.deleted'));
            } catch (error: any) {
              console.error('Failed to delete notification:', error);
              showToast('error', t('notifications.deleteError'), error.message);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return t('notifications.justNow');
    if (minutes < 60) return t('notifications.minutesAgo', { count: minutes });
    if (hours < 24) return t('notifications.hoursAgo', { count: hours });
    if (days < 7) return t('notifications.daysAgo', { count: days });
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'warning': return '⚠';
      default: return 'ℹ';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return theme.palette.success.main;
      case 'error': return theme.palette.error.main;
      case 'warning': return theme.palette.warning.main;
      default: return theme.palette.info.main;
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !item.read && styles.unreadNotification,
      ]}
      onPress={() => handleMarkAsRead(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: getNotificationColor(item.type) + '20' }]}>
        <Text style={[styles.icon, { color: getNotificationColor(item.type) }]}>
          {getNotificationIcon(item.type)}
        </Text>
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, !item.read && styles.unreadTitle]}>
          {item.title}
        </Text>
        <Text style={styles.message} numberOfLines={2}>
          {item.message}
        </Text>
        <Text style={styles.date}>{formatDate(item.created_at)}</Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDelete(item)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={styles.deleteIcon}>×</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.palette.primary.main} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('notifications.title')}</Text>
        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={handleMarkAllAsRead}
          >
            <Text style={styles.markAllText}>{t('notifications.markAllRead')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔔</Text>
          <Text style={styles.emptyText}>{t('notifications.noNotifications')}</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.palette.primary.main]}
            />
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.palette.background.default,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.palette.divider,
  },
  headerTitle: {
    ...theme.typography.h4,
    color: theme.palette.text.primary,
  },
  markAllButton: {
    paddingHorizontal: theme.spacing(2),
    paddingVertical: theme.spacing(1),
  },
  markAllText: {
    ...theme.typography.body2,
    color: theme.palette.primary.main,
  },
  listContent: {
    padding: theme.spacing(1),
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing(2),
    marginBottom: theme.spacing(1),
    backgroundColor: theme.palette.background.card,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: theme.palette.primary.main,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing(2),
  },
  icon: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  title: {
    ...theme.typography.body1,
    color: theme.palette.text.primary,
    fontWeight: '500',
    marginBottom: theme.spacing(0.5),
  },
  unreadTitle: {
    fontWeight: '700',
  },
  message: {
    ...theme.typography.body2,
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(0.5),
  },
  date: {
    ...theme.typography.caption,
    color: theme.palette.text.disabled,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.palette.primary.main,
    marginLeft: theme.spacing(1),
  },
  deleteButton: {
    padding: theme.spacing(1),
    marginLeft: theme.spacing(1),
  },
  deleteIcon: {
    fontSize: 24,
    color: theme.palette.text.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing(4),
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: theme.spacing(2),
  },
  emptyText: {
    ...theme.typography.body1,
    color: theme.palette.text.secondary,
    textAlign: 'center',
  },
});

