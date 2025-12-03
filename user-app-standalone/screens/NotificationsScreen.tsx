/**
 * Notifications Screen
 * Display and manage all notifications
 */

import React, { useState } from 'react';
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
  Modal,
  ScrollView,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { createTheme } from '../themes';
import { useTranslation } from '../hooks/useTranslation';
import { useNotifications, Notification } from '../contexts/NotificationContext';

const theme = createTheme('light');

export const NotificationsScreen: React.FC = () => {
  const { token } = useAuth();
  const { t } = useTranslation();
  const {
    notifications,
    loading,
    refreshing,
    unreadCount,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  const handleNotificationPress = async (notification: Notification) => {
    // Mark as read if unread
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    // Show detail modal
    setSelectedNotification(notification);
  };

  const handleMarkAsRead = async (notification: Notification) => {
    if (notification.read) return;
    await markAsRead(notification.id);
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;

    Alert.alert(
      t('notifications.markAllRead'),
      t('notifications.markAllReadConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: async () => {
            await markAllAsRead();
          },
        },
      ]
    );
  };

  const handleDelete = async (notification: Notification) => {
    Alert.alert(
      t('notifications.delete'),
      t('notifications.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await deleteNotification(notification.id);
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
    if (minutes < 60) return t('notifications.minutesAgo').replace('{count}', minutes.toString());
    if (hours < 24) return t('notifications.hoursAgo').replace('{count}', hours.toString());
    if (days < 7) return t('notifications.daysAgo').replace('{count}', days.toString());
    return date.toLocaleDateString();
  };

  const formatFullDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
      onPress={() => handleNotificationPress(item)}
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

  if (loading && notifications.length === 0) {
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
              onRefresh={loadNotifications}
              colors={[theme.palette.primary.main]}
            />
          }
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Notification Detail Modal */}
      <Modal
        visible={selectedNotification !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedNotification(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedNotification && (
              <>
                <View style={styles.modalHeader}>
                  <View style={[styles.modalIconContainer, { backgroundColor: getNotificationColor(selectedNotification.type) + '20' }]}>
                    <Text style={[styles.modalIcon, { color: getNotificationColor(selectedNotification.type) }]}>
                      {getNotificationIcon(selectedNotification.type)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    onPress={() => setSelectedNotification(null)}
                  >
                    <Text style={styles.modalCloseText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                  <Text style={styles.modalTitle}>{selectedNotification.title}</Text>
                  
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>{t('notifications.message')}</Text>
                    <Text style={styles.modalMessage}>{selectedNotification.message}</Text>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>{t('notifications.type')}</Text>
                    <View style={[styles.modalTypeBadge, { backgroundColor: getNotificationColor(selectedNotification.type) + '20' }]}>
                      <Text style={[styles.modalTypeText, { color: getNotificationColor(selectedNotification.type) }]}>
                        {selectedNotification.type.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>{t('notifications.date')}</Text>
                    <Text style={styles.modalDate}>{formatFullDate(selectedNotification.created_at)}</Text>
                  </View>

                  {selectedNotification.data && Object.keys(selectedNotification.data).length > 0 && (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>{t('notifications.additionalInfo')}</Text>
                      <View style={styles.modalDataContainer}>
                        {Object.entries(selectedNotification.data).map(([key, value]) => (
                          <View key={key} style={styles.modalDataRow}>
                            <Text style={styles.modalDataKey}>{key}:</Text>
                            <Text style={styles.modalDataValue}>{String(value)}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>{t('notifications.status')}</Text>
                    <View style={[styles.modalStatusBadge, { backgroundColor: selectedNotification.read ? theme.palette.success.main + '20' : theme.palette.warning.main + '20' }]}>
                      <Text style={[styles.modalStatusText, { color: selectedNotification.read ? theme.palette.success.main : theme.palette.warning.main }]}>
                        {selectedNotification.read ? t('notifications.read') : t('notifications.unread')}
                      </Text>
                    </View>
                  </View>
                </ScrollView>

                <View style={styles.modalFooter}>
                  {!selectedNotification.read && (
                    <TouchableOpacity
                      style={styles.modalActionButton}
                      onPress={async () => {
                        await markAsRead(selectedNotification.id);
                        setSelectedNotification({ ...selectedNotification, read: true });
                      }}
                    >
                      <Text style={styles.modalActionText}>{t('notifications.markAsRead')}</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.modalActionButton, styles.modalDeleteButton]}
                    onPress={async () => {
                      setSelectedNotification(null);
                      await deleteNotification(selectedNotification.id);
                    }}
                  >
                    <Text style={[styles.modalActionText, styles.modalDeleteText]}>{t('common.delete')}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.palette.background.card,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    maxHeight: '90%',
    paddingBottom: theme.spacing(2),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing(2),
    borderBottomWidth: 1,
    borderBottomColor: theme.palette.divider,
  },
  modalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalIcon: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.palette.grey[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 18,
    color: theme.palette.text.primary,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: theme.spacing(2),
  },
  modalTitle: {
    ...theme.typography.h3,
    color: theme.palette.text.primary,
    fontWeight: '700',
    marginBottom: theme.spacing(2),
  },
  modalSection: {
    marginBottom: theme.spacing(2),
  },
  modalSectionTitle: {
    ...theme.typography.body2,
    color: theme.palette.text.secondary,
    fontWeight: '600',
    marginBottom: theme.spacing(1),
    textTransform: 'uppercase',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  modalMessage: {
    ...theme.typography.body1,
    color: theme.palette.text.primary,
    lineHeight: 22,
  },
  modalTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing(1.5),
    paddingVertical: theme.spacing(0.5),
    borderRadius: theme.borderRadius.sm,
  },
  modalTypeText: {
    ...theme.typography.caption,
    fontWeight: '700',
    fontSize: 11,
  },
  modalDate: {
    ...theme.typography.body2,
    color: theme.palette.text.primary,
  },
  modalDataContainer: {
    backgroundColor: theme.palette.grey[100],
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing(1.5),
  },
  modalDataRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing(1),
  },
  modalDataKey: {
    ...theme.typography.body2,
    color: theme.palette.text.secondary,
    fontWeight: '600',
    marginRight: theme.spacing(1),
    minWidth: 100,
  },
  modalDataValue: {
    ...theme.typography.body2,
    color: theme.palette.text.primary,
    flex: 1,
  },
  modalStatusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing(1.5),
    paddingVertical: theme.spacing(0.5),
    borderRadius: theme.borderRadius.sm,
  },
  modalStatusText: {
    ...theme.typography.caption,
    fontWeight: '700',
    fontSize: 11,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: theme.spacing(2),
    borderTopWidth: 1,
    borderTopColor: theme.palette.divider,
    gap: theme.spacing(1.5),
  },
  modalActionButton: {
    flex: 1,
    padding: theme.spacing(1.5),
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.palette.primary.main,
    alignItems: 'center',
  },
  modalActionText: {
    ...theme.typography.button,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalDeleteButton: {
    backgroundColor: theme.palette.error.main,
  },
  modalDeleteText: {
    color: '#FFFFFF',
  },
});
