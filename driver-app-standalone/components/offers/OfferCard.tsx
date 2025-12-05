/**
 * Offer Card Component
 * Displays a compact offer card with map-like route visualization
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from '../../hooks/useTranslation';
import type { DriverOffer, OfferStatus } from '../../api/driverOffers';

const getStatusColor = (status: OfferStatus): string => {
  switch (status) {
    case 'published': return '#10B981';
    case 'archived': return '#6B7280';
    case 'cancelled': return '#EF4444';
    default: return '#6B7280';
  }
};

interface OfferCardProps {
  offer: DriverOffer;
  onPress: (offer: DriverOffer) => void;
}

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

export const OfferCard: React.FC<OfferCardProps> = ({ offer, onPress }) => {
  const { t } = useTranslation();
  const statusColor = getStatusColor(offer.status);

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

  // Calculate total route points (from + stops + to)
  const routePoints = [
    { 
      type: 'from', 
      primary: fromFormatted.primary, 
      context: fromFormatted.context,
      icon: 'A', 
      color: '#10B981' 
    },
    ...(offer.stops || []).map((stop, index) => {
      const stopFormatted = formatLocation(stop.label_text, sharedContext);
      return {
        type: 'stop',
        primary: stopFormatted.primary,
        context: stopFormatted.context,
        icon: String(index + 1),
        color: '#F59E0B',
      };
    }),
    { 
      type: 'to', 
      primary: toFormatted.primary, 
      context: toFormatted.context,
      icon: 'B', 
      color: '#3B82F6' 
    },
  ];

  const getRouteLabel = (type: string, index?: number) => {
    if (type === 'from') return t('driverOffers.from') || 'Qayerdan';
    if (type === 'to') return t('driverOffers.to') || 'Qayerga';
    return `${t('driverOffers.stop') || 'To\'xtash'} ${index || ''}`;
  };

  return (
    <TouchableOpacity
      style={styles.offerCard}
      onPress={() => onPress(offer)}
      activeOpacity={0.7}
    >
      {/* Header with Status Badge and Offer ID */}
      <View style={styles.cardHeader}>
        <View style={styles.statusBadgeContainer}>
          <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {statusText}
          </Text>
        </View>
        <Text style={styles.offerIdText}>ID: {offer.id}</Text>
      </View>

      {/* Shared Context (if country/province are the same) */}
      {sharedContext.country && (
        <View style={styles.sharedContextContainer}>
          <Text style={styles.sharedContextText}>
            {sharedContext.province 
              ? `${sharedContext.province}, ${sharedContext.country}`
              : sharedContext.country}
          </Text>
        </View>
      )}

      {/* Route Visualization with Real Icons */}
      <View style={styles.routeContainer}>
        {routePoints.map((point, index) => {
          const isLast = index === routePoints.length - 1;
          const IconComponent = 
            point.type === 'from' ? MaterialIcons :
            point.type === 'to' ? MaterialIcons :
            MaterialIcons;
          const iconName = 
            point.type === 'from' ? 'location-on' :
            point.type === 'to' ? 'place' :
            'location-city';

          return (
            <View key={`${point.type}-${index}`} style={styles.routeItem}>
              {/* Icon Container */}
              <View style={styles.iconContainer}>
                <View style={[styles.iconWrapper, { backgroundColor: point.color }]}>
                  {point.type === 'stop' ? (
                    <View style={styles.stopIconBadge}>
                      <Text style={styles.stopIconText}>{point.icon}</Text>
                    </View>
                  ) : (
                    <IconComponent 
                      name={iconName as any} 
                      size={20} 
                      color="#FFFFFF" 
                    />
                  )}
                </View>
                {/* Connection Line */}
                {!isLast && (
                  <View style={[styles.connectionLine, { backgroundColor: point.color }]} />
                )}
              </View>
              
              {/* Route Text */}
              <View style={styles.routeTextContainer}>
                <Text style={styles.routeLabel}>
                  {getRouteLabel(point.type, point.type === 'stop' ? Number(point.icon) : undefined)}
                </Text>
                <Text style={styles.routeText} numberOfLines={2} ellipsizeMode="tail">
                  {point.primary}
                </Text>
                {point.context && (
                  <Text style={styles.routeContext} numberOfLines={1} ellipsizeMode="tail">
                    {point.context}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  offerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  offerIdText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  statusBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  sharedContextContainer: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  sharedContextText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    fontStyle: 'italic',
  },
  routeContainer: {
    paddingLeft: 8,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    minHeight: 48,
  },
  iconContainer: {
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
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
  stopIconBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopIconText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '800',
  },
  connectionLine: {
    position: 'absolute',
    top: 36,
    left: '50%',
    marginLeft: -1,
    width: 2,
    height: 20,
    opacity: 0.4,
    zIndex: 1,
  },
  routeTextContainer: {
    flex: 1,
    paddingTop: 4,
    minWidth: 0,
  },
  routeLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  routeText: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
    lineHeight: 20,
  },
  routeContext: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 2,
    fontStyle: 'italic',
  },
});

