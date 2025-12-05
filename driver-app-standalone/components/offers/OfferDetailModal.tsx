/**
 * Offer Detail Modal Component
 * Displays full offer details in a bottom sheet modal
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from '../../hooks/useTranslation';
import type { DriverOffer, OfferStatus } from '../../api/driverOffers';

// Parse location text into parts (city, province, country)
const parseLocation = (locationText: string): { city: string; province: string; country: string } => {
  const parts = locationText.split(',').map(p => p.trim());
  if (parts.length >= 3) {
    return {
      city: parts[0],
      province: parts[1],
      country: parts[2],
    };
  } else if (parts.length === 2) {
    return {
      city: parts[0],
      province: parts[1],
      country: '',
    };
  }
  return {
    city: locationText,
    province: '',
    country: '',
  };
};

// Format location text intelligently based on shared context
const formatLocation = (
  locationText: string,
  sharedContext?: { province?: string; country?: string }
): { primary: string; context?: string } => {
  const parsed = parseLocation(locationText);
  
  // If no shared context, show full location
  if (!sharedContext) {
    if (parsed.province && parsed.country) {
      return {
        primary: parsed.city,
        context: `${parsed.province}, ${parsed.country}`,
      };
    } else if (parsed.province) {
      return {
        primary: parsed.city,
        context: parsed.province,
      };
    }
    return { primary: locationText };
  }

  // If country and province are shared, show only city
  if (sharedContext.country && sharedContext.province && 
      parsed.country === sharedContext.country && 
      parsed.province === sharedContext.province) {
    return { primary: parsed.city };
  }

  // If only country is shared, show city and province
  if (sharedContext.country && parsed.country === sharedContext.country) {
    if (parsed.province) {
      return {
        primary: parsed.city,
        context: parsed.province,
      };
    }
    return { primary: parsed.city };
  }

  // Different country, show full
  if (parsed.province && parsed.country) {
    return {
      primary: parsed.city,
      context: `${parsed.province}, ${parsed.country}`,
    };
  } else if (parsed.province) {
    return {
      primary: parsed.city,
      context: parsed.province,
    };
  }
  return { primary: locationText };
};

const getStatusColor = (status: OfferStatus): string => {
  switch (status) {
    case 'published': return '#10B981';
    case 'archived': return '#6B7280';
    case 'cancelled': return '#EF4444';
    default: return '#6B7280';
  }
};

interface OfferDetailModalProps {
  visible: boolean;
  offer: DriverOffer | null;
  onClose: () => void;
  onEdit: (offer: DriverOffer) => void;
  onCancel: (offer: DriverOffer) => void;
  onPublish: (offer: DriverOffer) => void;
  onArchive: (offer: DriverOffer) => void;
  onDelete: (offer: DriverOffer) => void;
  formatDate: (dateString: string) => string;
  formatPrice: (price: number, currency: string) => string;
}

export const OfferDetailModal: React.FC<OfferDetailModalProps> = ({
  visible,
  offer,
  onClose,
  onEdit,
  onCancel,
  onPublish,
  onArchive,
  onDelete,
  formatDate,
  formatPrice,
}) => {
  const { t } = useTranslation();

  if (!offer) return null;

  const statusColor = getStatusColor(offer.status);
  const canEdit = offer.status === 'published'; // Only published offers can be edited
  const canCancel = offer.status === 'published';
  const canPublish = ['archived', 'cancelled'].includes(offer.status);
  const canDelete = ['archived', 'cancelled'].includes(offer.status);

  const statusText = (() => {
    const statusKey = `driverOffers.status.${offer.status}`;
    const translated = t(statusKey);
    if (translated === statusKey) {
      switch (offer.status) {
        case 'published': return 'Faol';
        case 'archived': return 'Arxivlangan';
        case 'cancelled': return 'Bekor qilingan';
        default: return offer.status;
      }
    }
    return translated;
  })();

  const getRouteLabel = (type: string, index?: number) => {
    if (type === 'from') return t('driverOffers.from') || 'Qayerdan';
    if (type === 'to') return t('driverOffers.to') || 'Qayerga';
    return `${t('driverOffers.stop') || 'To\'xtash'} ${index || ''}`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          {/* Modal Header - Fixed at top */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderContent}>
              <Text style={styles.modalTitle}>
                {t('driverOffers.viewDetails') || 'E\'lon tafsilotlari'}
              </Text>
              <Text style={styles.modalOfferId}>ID: {offer.id}</Text>
            </View>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={onClose}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Scrollable Content */}
          <ScrollView 
            showsVerticalScrollIndicator={false}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
            nestedScrollEnabled={true}
            bounces={false}
          >
            {/* Status Badge */}
            <View style={styles.modalStatusContainer}>
              <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
              <Text style={[styles.modalStatusText, { color: statusColor }]}>
                {statusText}
              </Text>
            </View>

            {/* Route Section */}
            <View style={styles.modalRouteSection}>
              {(() => {
                // Parse locations to find shared context
                const fromParsed = parseLocation(offer.from_text);
                const toParsed = parseLocation(offer.to_text);
                
                // Determine shared context
                const sharedContext: { province?: string; country?: string } = {};
                if (fromParsed.country && toParsed.country && fromParsed.country === toParsed.country) {
                  sharedContext.country = fromParsed.country;
                  if (fromParsed.province && toParsed.province && fromParsed.province === toParsed.province) {
                    sharedContext.province = fromParsed.province;
                  }
                }

                // Format locations
                const fromFormatted = formatLocation(offer.from_text, sharedContext);
                const toFormatted = formatLocation(offer.to_text, sharedContext);

                const routePoints = [
                  { 
                    type: 'from', 
                    primary: fromFormatted.primary,
                    context: fromFormatted.context,
                    color: '#10B981' 
                  },
                  ...(offer.stops || []).map((stop, index) => {
                    const stopFormatted = formatLocation(stop.label_text, sharedContext);
                    return {
                      type: 'stop',
                      primary: stopFormatted.primary,
                      context: stopFormatted.context,
                      index: index + 1,
                      color: '#F59E0B',
                    };
                  }),
                  { 
                    type: 'to', 
                    primary: toFormatted.primary,
                    context: toFormatted.context,
                    color: '#3B82F6' 
                  },
                ];

                return (
                  <>
                    {/* Shared Context (if country/province are the same) */}
                    {sharedContext.country && (
                      <View style={styles.modalSharedContextContainer}>
                        <Text style={styles.modalSharedContextText}>
                          {sharedContext.province 
                            ? `${sharedContext.province}, ${sharedContext.country}`
                            : sharedContext.country}
                        </Text>
                      </View>
                    )}

                    {routePoints.map((point, index) => {
                      const isLast = index === routePoints.length - 1;
                      const stopIndex = point.type === 'stop' ? (point as any).index : undefined;
                      return (
                        <View key={`${point.type}-${index}`} style={styles.modalRouteItem}>
                          <View style={styles.modalIconContainer}>
                            <View style={[styles.modalRouteIcon, { backgroundColor: point.color }]}>
                              {point.type === 'from' ? (
                                <MaterialIcons name="location-on" size={22} color="#FFFFFF" />
                              ) : point.type === 'to' ? (
                                <MaterialIcons name="place" size={22} color="#FFFFFF" />
                              ) : (
                                <View style={styles.modalStopBadge}>
                                  <Text style={styles.modalStopBadgeText}>{stopIndex}</Text>
                                </View>
                              )}
                            </View>
                            {!isLast && (
                              <View style={[styles.modalConnectionLine, { backgroundColor: point.color }]} />
                            )}
                          </View>
                          <View style={styles.modalRouteTextContainer}>
                            <Text style={styles.modalRouteLabel}>
                              {point.type === 'from'
                                ? t('driverOffers.from') || 'Qayerdan'
                                : point.type === 'to'
                                ? t('driverOffers.to') || 'Qayerga'
                                : getRouteLabel('stop', stopIndex)}
                            </Text>
                            <Text style={styles.modalRouteText}>{point.primary}</Text>
                            {point.context && (
                              <Text style={styles.modalRouteContext} numberOfLines={1} ellipsizeMode="tail">
                                {point.context}
                              </Text>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </>
                );
              })()}
            </View>

            {/* Details Section - Vertical Layout */}
            <View style={styles.modalDetailsSection}>
              <Text style={styles.modalDetailsSectionTitle}>
                {t('driverOffers.details') || 'Tafsilotlar'}
              </Text>
              
              {/* Departure Time Card */}
              <View style={styles.modalDetailCardNew}>
                <View style={[styles.modalDetailIconNew, { backgroundColor: '#FEF3C7' }]}>
                  <Text style={styles.modalDetailEmojiNew}>🕐</Text>
                </View>
                <View style={styles.modalDetailContentNew}>
                  <Text style={styles.modalDetailLabelNew}>{t('driverOffers.departure')}</Text>
                  <Text style={styles.modalDetailValueNew} numberOfLines={2}>
                    {formatDate(offer.start_at)}
                  </Text>
                </View>
              </View>

              {/* Seats Card */}
              <View style={styles.modalDetailCardNew}>
                <View style={[styles.modalDetailIconNew, { backgroundColor: '#DBEAFE' }]}>
                  <Text style={styles.modalDetailEmojiNew}>💺</Text>
                </View>
                <View style={styles.modalDetailContentNew}>
                  <Text style={styles.modalDetailLabelNew}>{t('driverOffers.seats')}</Text>
                  <View style={styles.seatsContainer}>
                    <Text style={styles.seatsFreeNew}>{offer.seats_free}</Text>
                    <Text style={styles.seatsSeparatorNew}>/</Text>
                    <Text style={styles.seatsTotalNew}>{offer.seats_total}</Text>
                  </View>
                </View>
              </View>

              {/* Price Card */}
              <View style={styles.modalDetailCardNew}>
                <View style={[styles.modalDetailIconNew, { backgroundColor: '#D1FAE5' }]}>
                  <Text style={styles.modalDetailEmojiNew}>💰</Text>
                </View>
                <View style={styles.modalDetailContentNew}>
                  <Text style={styles.modalDetailLabelNew}>{t('driverOffers.price')}</Text>
                  <Text style={styles.modalDetailValueNewPrice} numberOfLines={1}>
                    {formatPrice(offer.price_per_seat, offer.currency)}
                  </Text>
                </View>
              </View>
            </View>

            {offer.rejection_reason && (
              <View style={styles.rejectionBox}>
                <Text style={styles.rejectionLabel}>
                  {t('driverOffers.rejectionReason')}:
                </Text>
                <Text style={styles.rejectionText}>{offer.rejection_reason}</Text>
              </View>
            )}
          </ScrollView>

          {/* Action Buttons - Fixed at bottom */}
          <View style={styles.modalActions}>
            {/* Primary Action - Edit Button (Full Width) - Only show if can edit */}
            {canEdit && (
              <TouchableOpacity
                style={[styles.modalActionButton, styles.editButton]}
                onPress={() => {
                  onClose();
                  onEdit(offer);
                }}
                activeOpacity={0.8}
              >
                <MaterialIcons name="edit" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                <Text style={styles.actionButtonText}>{t('driverOffers.edit') || 'Tahrirlash'}</Text>
              </TouchableOpacity>
            )}

            {/* Secondary Actions Row */}
            <View style={styles.secondaryActionsRow}>
              {canCancel && (
                <TouchableOpacity
                  style={[styles.modalActionButton, styles.secondaryButton, styles.cancelButton]}
                  onPress={() => {
                    onClose();
                    onCancel(offer);
                  }}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="close" size={18} color="#EF4444" style={styles.buttonIcon} />
                  <Text style={styles.secondaryButtonText}>{t('driverOffers.cancel') || 'Bekor qilish'}</Text>
                </TouchableOpacity>
              )}
              {canPublish && (
                <TouchableOpacity
                  style={[styles.modalActionButton, styles.secondaryButton, styles.publishButton]}
                  onPress={() => {
                    onClose();
                    onPublish(offer);
                  }}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="check-circle" size={18} color="#3B82F6" style={styles.buttonIcon} />
                  <Text style={styles.secondaryButtonText}>{t('driverOffers.publish')}</Text>
                </TouchableOpacity>
              )}
              {offer.status === 'published' && (
                <TouchableOpacity
                  style={[styles.modalActionButton, styles.secondaryButton, styles.archiveButton]}
                  onPress={() => {
                    onClose();
                    onArchive(offer);
                  }}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="archive" size={18} color="#6B7280" style={styles.buttonIcon} />
                  <Text style={styles.secondaryButtonText}>{t('driverOffers.archive')}</Text>
                </TouchableOpacity>
              )}
              {canDelete && (
                <TouchableOpacity
                  style={[styles.modalActionButton, styles.secondaryButton, styles.deleteButton]}
                  onPress={() => {
                    onClose();
                    onDelete(offer);
                  }}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="delete-outline" size={18} color="#EF4444" style={styles.buttonIcon} />
                  <Text style={styles.secondaryButtonText}>{t('driverOffers.delete')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    flex: 1,
    flexDirection: 'column',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalHeaderContent: {
    flex: 1,
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  modalOfferId: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 20,
    color: '#6B7280',
    fontWeight: '600',
  },
  modalStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  modalStatusText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  modalRouteSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  modalSharedContextContainer: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  modalSharedContextText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    fontStyle: 'italic',
  },
  modalRouteItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 56,
  },
  modalIconContainer: {
    alignItems: 'center',
    marginRight: 14,
    position: 'relative',
  },
  modalRouteIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 2,
  },
  modalStopBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalStopBadgeText: {
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: '800',
  },
  modalConnectionLine: {
    position: 'absolute',
    top: 44,
    left: '50%',
    marginLeft: -1.5,
    width: 3,
    height: 24,
    opacity: 0.4,
    zIndex: 1,
  },
  modalRouteTextContainer: {
    flex: 1,
    paddingTop: 10,
    minWidth: 0,
  },
  modalRouteLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  modalRouteText: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
    lineHeight: 22,
  },
  modalRouteContext: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 3,
    fontStyle: 'italic',
  },
  modalDetailsSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#F9FAFB',
    marginTop: 8,
  },
  modalDetailsSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  modalDetailCardNew: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  modalDetailIconNew: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginRight: 16,
  },
  modalDetailEmojiNew: {
    fontSize: 24,
  },
  modalDetailContentNew: {
    flex: 1,
    minWidth: 0,
  },
  modalDetailLabelNew: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  modalDetailValueNew: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '700',
    lineHeight: 20,
  },
  modalDetailValueNewPrice: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: '700',
    lineHeight: 22,
  },
  seatsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seatsFreeNew: {
    fontSize: 15,
    color: '#10B981',
    fontWeight: '700',
  },
  seatsSeparatorNew: {
    fontSize: 15,
    color: '#9CA3AF',
    marginHorizontal: 4,
    fontWeight: '500',
  },
  seatsTotalNew: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '600',
  },
  rejectionBox: {
    backgroundColor: '#FEF2F2',
    padding: 14,
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  rejectionLabel: {
    fontSize: 12,
    color: '#991B1B',
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rejectionText: {
    fontSize: 14,
    color: '#7F1D1D',
    lineHeight: 20,
    fontWeight: '500',
  },
  modalActions: {
    padding: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 50,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  modalActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    minHeight: 56,
  },
  editButton: {
    backgroundColor: '#10B981',
    width: '100%',
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 12,
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    paddingVertical: 14,
    minHeight: 50,
  },
  cancelButton: {
    borderColor: '#EF4444',
  },
  publishButton: {
    borderColor: '#3B82F6',
  },
  archiveButton: {
    borderColor: '#6B7280',
  },
  deleteButton: {
    borderColor: '#EF4444',
  },
  buttonIcon: {
    marginRight: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  secondaryButtonText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

