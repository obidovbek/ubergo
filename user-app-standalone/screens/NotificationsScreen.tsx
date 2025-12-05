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
  Platform,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { createTheme } from '../themes';
import { useTranslation } from '../hooks/useTranslation';
import { useNotifications, Notification } from '../contexts/NotificationContext';

const theme = createTheme('light');

export const NotificationsScreen: React.FC = () => {
  const { token } = useAuth();
  const { t } = useTranslation();
  const navigation = useNavigation();
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
      case 'success': return '#10B981';
      case 'error': return '#EF4444';
      case 'warning': return '#F59E0B';
      default: return '#3B82F6';
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => {
    const iconColor = getNotificationColor(item.type);
    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          !item.read && styles.unreadNotification,
        ]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
          <Text style={[styles.icon, { color: iconColor }]}>
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
          onPress={(e) => {
            e.stopPropagation();
            handleDelete(item);
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.deleteIcon}>×</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (loading && notifications.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('notifications.title')}</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={handleMarkAllAsRead}
            activeOpacity={0.8}
          >
            <Text style={styles.markAllText}>{t('notifications.markAllRead')}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔔</Text>
          <Text style={styles.emptyText}>{t('notifications.noNotifications')}</Text>
          <Text style={styles.emptySubtext}>{t('notifications.noNotificationsDescription') || 'Sizda hozircha xabarnomalar yo\'q'}</Text>
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
              colors={['#10B981']}
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
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 16 : 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#10B981',
    fontWeight: '700',
  },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  headerSpacer: {
    width: 60,
  },
  markAllButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#10B981',
    borderRadius: 12,
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  markAllText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 18,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    marginTop: 2,
  },
  icon: {
    fontSize: 22,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
    marginBottom: 6,
    lineHeight: 22,
  },
  unreadTitle: {
    fontWeight: '700',
  },
  message: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  date: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    marginTop: 4,
    marginLeft: 8,
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 4,
    marginTop: 2,
  },
  deleteIcon: {
    fontSize: 24,
    color: '#9CA3AF',
    fontWeight: '300',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#F8FAFC',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
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
