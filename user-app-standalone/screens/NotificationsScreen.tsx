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
  Pressable,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { TopBar } from '../components/chrome/TopBar';
import { createTheme, font } from '../themes';
import { useTranslation } from '../hooks/useTranslation';
import { useNotifications, Notification } from '../contexts/NotificationContext';
import { AppModal } from '../components/AppModal';
import { showConfirmDialog } from '../utils/confirmDialog';
import { handleNotificationTap } from '../utils/notificationRouting';

const theme = createTheme('light');

/**
 * Event types that have a real destination — T-045.
 *
 * ⚠️ These MUST stay in step with the `case` labels in
 * `utils/notificationRouting.ts`. They are listed rather than imported because
 * that module keeps its mapper private on purpose (see `handleNotificationPress`).
 * A type missing here only means the row opens the modal instead of navigating —
 * a soft failure, never a wrong destination, because the mapper still decides
 * where the tap actually goes.
 */
const ROUTABLE_EVENT_TYPES = new Set([
  'join_confirmed',
  'join_rejected',
  'driver_arrived',
  'driver_10min_away',
  'offer_cancelled_by_driver',
  'driver_join_request',
  'driver_request_cancelled',
]);

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

  /**
   * T-045: a row with a real destination now navigates; everything else keeps
   * the detail modal.
   *
   * ⚠️ The modal is deliberately KEPT rather than replaced. It is the only way
   * to read a message longer than the two lines the row shows — for the welcome
   * message, or any future announcement, it *is* the content. Navigation is
   * added for the events that have somewhere to go, not swapped in for it.
   *
   * ⚠️ The check is "does this row carry a routable event type", NOT "what does
   * the mapper return". `routeForNotification` stays module-private — widening a
   * device-confirmed module's API for one caller invites a second, divergent
   * copy of the destination table, which is exactly the class of bug T-044 and
   * T-042 were. The mapper still owns *where* a tap goes; this only decides
   * *whether* to hand it over.
   */
  const handleNotificationPress = async (notification: Notification) => {
    // Mark as read if unread
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Anything the mapper would send to `Notifications` (the screen we are
    // already on) must fall through to the modal, or the tap looks dead.
    const eventType = (notification.data as any)?.type;

    if (eventType && ROUTABLE_EVENT_TYPES.has(eventType)) {
      handleNotificationTap(notification.data);
      return;
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

    showConfirmDialog({
      title: t('notifications.markAllRead'),
      message: t('notifications.markAllReadConfirm'),
      confirmText: t('common.confirm'),
      cancelText: t('common.cancel'),
      onConfirm: async () => {
        await markAllAsRead();
      },
      onCancel: () => {},
    });
  };

  const handleDelete = async (notification: Notification) => {
    showConfirmDialog({
      title: t('notifications.delete'),
      message: t('notifications.deleteConfirm'),
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
      confirmButtonStyle: 'destructive',
      onConfirm: async () => {
        await deleteNotification(notification.id);
      },
      onCancel: () => {},
    });
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

  /**
   * T-101 step 11 — an INK and a TINT, not one colour plus a runtime alpha.
   *
   * 🔴 THE OLD CODE BUILT ITS BACKGROUNDS AS `colour + '20'` — string concatenation that
   * appends 12.5% alpha at runtime, in five places. That is a raw colour the token
   * ratchet cannot see: `check-design-tokens.mjs` scans for literals, and there is no
   * literal here, so the screen counted as clean while shipping five untokenised fills.
   * It also mapped by VALUE rather than role (§2.10) — `danger` and `warnBorder` are
   * FILLS being used as ink over a tint derived from themselves.
   *
   * Each type now names the measured pair the palette already carries.
   */
  const getNotificationTone = (
    type: string,
  ): { ink: string; tint: string } => {
    switch (type) {
      case 'success':
        return { ink: theme.palette.actionPressed, tint: theme.palette.successTint };
      case 'error':
        return { ink: theme.palette.dangerText, tint: theme.palette.dangerTint };
      case 'warning':
        return { ink: theme.palette.warnInk, tint: theme.palette.warnTint };
      default:
        return { ink: theme.palette.male, tint: theme.palette.blueTint };
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => {
    const tone = getNotificationTone(item.type);
    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          !item.read && styles.unreadNotification,
        ]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: tone.tint }]}>
          <Text style={[styles.icon, { color: tone.ink }]}>
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
        <StatusBar barStyle="dark-content" backgroundColor={theme.palette.surface} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.palette.action} />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.palette.surface} />
      {/*
        T-101 step 11 — the shared `TopBar`, replacing a hand-rolled header that carried a
        back arrow, a MenuButton AND a mark-all button in one crowded row.
        ⚠️ `background="flat"`: this screen is pushed, not a landing board.
      */}
      <TopBar
        title={t('notifications.title')}
        background="flat"
        onBackPress={() => navigation.goBack()}
      />

      {/*
        T-072 STILL HOLDS, and this is where the artboard puts it anyway.

        🔴 The mark-all label is a whole sentence — uz "Barchasini o'qilgan deb belgilash"
        (33 chars), ru "Отметить все как прочитанные" (28). In the old header it sat beside
        a flex:1 title and wrapped it onto two lines (owner, 2026-08-12), so T-072 reduced
        it to an icon. The artboard's notification panel gives it a row of its own with the
        words "Hammasini o'qildi" — so the sentence comes BACK, at full width, where it
        cannot crowd anything. *T-072's fix was right for the layout it was in; the layout
        changed.*
      */}
      {unreadCount > 0 && (
        <View style={styles.panelHead}>
          <Text style={styles.panelHeadCount}>
            {t('notifications.unreadCount').replace('{count}', String(unreadCount))}
          </Text>
          <Pressable
            onPress={handleMarkAllAsRead}
            accessibilityLabel={t('notifications.markAllRead')}
            accessibilityRole="button"
            hitSlop={8}
          >
            <Text style={styles.markAllText}>{t('notifications.markAllShort')}</Text>
          </Pressable>
        </View>
      )}

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
              colors={[theme.palette.action]}
            />
          }
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Notification Detail Modal */}
      <AppModal
        visible={selectedNotification !== null}
        onClose={() => setSelectedNotification(null)}
        title={selectedNotification?.title}
        actions={
          selectedNotification
            ? [
                ...(!selectedNotification.read
                  ? [
                      {
                        label: t('notifications.markAsRead'),
                        onPress: async () => {
                          await markAsRead(selectedNotification.id);
                          setSelectedNotification({ ...selectedNotification, read: true });
                        },
                      },
                    ]
                  : []),
                {
                  label: t('common.delete'),
                  variant: 'destructive' as const,
                  onPress: async () => {
                    setSelectedNotification(null);
                    await deleteNotification(selectedNotification.id);
                  },
                },
              ]
            : []
        }
      >
        {selectedNotification && (
              <>
                <View style={styles.modalHeader}>
                  <View style={[styles.modalIconContainer, { backgroundColor: getNotificationTone(selectedNotification.type).tint }]}>
                    <Text style={[styles.modalIcon, { color: getNotificationTone(selectedNotification.type).ink }]}>
                      {getNotificationIcon(selectedNotification.type)}
                    </Text>
                  </View>
                </View>

                <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>{t('notifications.message')}</Text>
                    <Text style={styles.modalMessage}>{selectedNotification.message}</Text>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>{t('notifications.type')}</Text>
                    <View style={[styles.modalTypeBadge, { backgroundColor: getNotificationTone(selectedNotification.type).tint }]}>
                      <Text style={[styles.modalTypeText, { color: getNotificationTone(selectedNotification.type).ink }]}>
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
                    <View style={[styles.modalStatusBadge, {
                        backgroundColor: selectedNotification.read
                          ? theme.palette.successTint
                          : theme.palette.warnTint,
                      }]}>
                      <Text style={[styles.modalStatusText, { color: selectedNotification.read ? theme.palette.success.main : theme.palette.warning.main }]}>
                        {selectedNotification.read ? t('notifications.read') : t('notifications.unread')}
                      </Text>
                    </View>
                  </View>
                </ScrollView>
              </>
        )}
      </AppModal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.palette.ground,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.palette.ground,
  },
  loadingText: {
    marginTop: 16,
    color: theme.palette.text.secondary,
    fontSize: 15,
    ...font('sans', 500),
  },
  /*
   * The artboard's panel head — a full-width row above the list, not a header slot.
   * `markAllShort` gets the whole right side, so the long form cannot crowd a title.
   */
  panelHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
  },
  panelHeadCount: {
    ...theme.typography.caption,
    color: theme.palette.text.secondary,
  },
  markAllText: {
    fontSize: 12,
    color: theme.palette.action,
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
    backgroundColor: theme.palette.surface,
    borderRadius: 16,
    shadowColor: theme.palette.text.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: theme.palette.borders.strong,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: theme.palette.action,
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
    ...font('sans', 700),
  },
  content: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    fontSize: 16,
    color: theme.palette.text.primary,
    ...font('sans', 600),
    marginBottom: 6,
    lineHeight: 22,
  },
  unreadTitle: {
    ...font('sans', 700),
  },
  message: {
    fontSize: 14,
    color: theme.palette.text.secondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  date: {
    fontSize: 12,
    color: theme.palette.text.tertiary,
    ...font('sans', 500),
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.palette.action,
    marginTop: 4,
    marginLeft: 8,
    shadowColor: theme.palette.action,
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
    color: theme.palette.text.tertiary,
    /*
     * ⚠️ DELIBERATELY still a platform `fontWeight`, not `font('sans', n)`.
     * This is the `×` glyph and the hairline is the point. Manrope's bundled range starts
     * at 500, so `font()` would fold 300 UPWARD and render it heavier — the opposite of
     * what is wanted. The system face's own light weight is the right thing here.
     */
    fontWeight: '300',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: theme.palette.ground,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    ...font('sans', 700),
    color: theme.palette.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 15,
    color: theme.palette.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.palette.scrim.modal,
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
    ...font('sans', 700),
    marginBottom: theme.spacing(2),
  },
  modalSection: {
    marginBottom: theme.spacing(2),
  },
  modalSectionTitle: {
    ...theme.typography.body2,
    color: theme.palette.text.secondary,
    ...font('sans', 600),
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
    ...font('sans', 700),
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
    ...font('sans', 600),
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
    ...font('sans', 700),
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
    color: theme.palette.surface,
    ...font('sans', 600),
  },
  modalDeleteButton: {
    backgroundColor: theme.palette.error.main,
  },
  modalDeleteText: {
    color: theme.palette.surface,
  },
});
