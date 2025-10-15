/**
 * Ride Card Component
 * Displays ride information in a card format
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { Ride } from '../../api/rides';
import { createTheme } from '../../themes';
import { formatDate, formatTime } from '../../utils/date';
import { formatCurrency } from '../../utils/format';

const theme = createTheme('light');

interface RideCardProps {
  ride: Ride;
  onPress?: (ride: Ride) => void;
}

export const RideCard: React.FC<RideCardProps> = ({ ride, onPress }) => {
  const getStatusColor = (status: Ride['status']) => {
    switch (status) {
      case 'completed':
        return theme.palette.success.main;
      case 'cancelled':
        return theme.palette.error.main;
      case 'in_progress':
        return theme.palette.info.main;
      case 'accepted':
        return theme.palette.warning.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const getStatusText = (status: Ride['status']) => {
    return status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress?.(ride)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.date}>{formatDate(ride.createdAt)}</Text>
        <View
          style={[styles.statusBadge, { backgroundColor: getStatusColor(ride.status) }]}
        >
          <Text style={styles.statusText}>{getStatusText(ride.status)}</Text>
        </View>
      </View>

      <View style={styles.locations}>
        <View style={styles.locationRow}>
          <Text style={styles.locationIcon}>📍</Text>
          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>Pickup</Text>
            <Text style={styles.locationAddress}>{ride.pickup.address}</Text>
          </View>
        </View>

        <View style={styles.locationRow}>
          <Text style={styles.locationIcon}>🎯</Text>
          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>Destination</Text>
            <Text style={styles.locationAddress}>{ride.destination.address}</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.time}>{formatTime(ride.createdAt)}</Text>
        <Text style={styles.fare}>{formatCurrency(ride.fare)}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.palette.background.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    ...theme.shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
  },
  date: {
    ...theme.typography.body2,
    color: theme.palette.text.secondary,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing(1.5),
    paddingVertical: theme.spacing(0.5),
    borderRadius: theme.borderRadius.full,
  },
  statusText: {
    ...theme.typography.caption,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  locations: {
    marginBottom: theme.spacing(2),
  },
  locationRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing(1.5),
  },
  locationIcon: {
    fontSize: 20,
    marginRight: theme.spacing(1.5),
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    ...theme.typography.caption,
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(0.25),
  },
  locationAddress: {
    ...theme.typography.body2,
    color: theme.palette.text.primary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: theme.spacing(2),
    borderTopWidth: 1,
    borderTopColor: theme.palette.divider,
  },
  time: {
    ...theme.typography.body2,
    color: theme.palette.text.secondary,
  },
  fare: {
    ...theme.typography.h5,
    color: theme.palette.secondary.main,
    fontWeight: '700',
  },
});

