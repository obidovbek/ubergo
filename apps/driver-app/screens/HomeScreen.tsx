/**
 * Home Screen
 * Main screen for ride booking
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useLocation } from '../hooks/useLocation';
import { rideTypes } from '../data/rideTypes';
import { createTheme } from '../themes';

const theme = createTheme('light');

export const HomeScreen: React.FC = () => {
  const { user } = useAuth();
  const { location, loading: locationLoading } = useLocation();
  const [selectedRideType, setSelectedRideType] = useState('economy');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>
            Hello, {user?.name || 'Guest'}!
          </Text>
          <Text style={styles.subtitle}>Where would you like to go?</Text>
        </View>

        {/* Location Display */}
        <View style={styles.locationCard}>
          <Text style={styles.locationLabel}>Your Location</Text>
          {locationLoading ? (
            <Text style={styles.locationText}>Loading...</Text>
          ) : location ? (
            <Text style={styles.locationText}>
              {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
            </Text>
          ) : (
            <Text style={styles.locationText}>Location unavailable</Text>
          )}
        </View>

        {/* Ride Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Ride Type</Text>
          {rideTypes.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.rideTypeCard,
                selectedRideType === type.id && styles.rideTypeCardSelected,
              ]}
              onPress={() => setSelectedRideType(type.id)}
            >
              <Text style={styles.rideIcon}>{type.icon}</Text>
              <View style={styles.rideInfo}>
                <Text style={styles.rideName}>{type.name}</Text>
                <Text style={styles.rideDescription}>{type.description}</Text>
                <Text style={styles.ridePrice}>
                  ${type.basePrice} + ${type.pricePerKm}/km
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Book Ride Button */}
        <TouchableOpacity style={styles.bookButton}>
          <Text style={styles.bookButtonText}>Book Ride</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.palette.background.default,
  },
  scrollView: {
    flex: 1,
    padding: theme.spacing(2),
  },
  header: {
    marginBottom: theme.spacing(3),
  },
  greeting: {
    ...theme.typography.h2,
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(1),
  },
  subtitle: {
    ...theme.typography.body1,
    color: theme.palette.text.secondary,
  },
  locationCard: {
    backgroundColor: theme.palette.background.card,
    padding: theme.spacing(2),
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing(3),
    ...theme.shadows.sm,
  },
  locationLabel: {
    ...theme.typography.caption,
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(0.5),
  },
  locationText: {
    ...theme.typography.body1,
    color: theme.palette.text.primary,
  },
  section: {
    marginBottom: theme.spacing(3),
  },
  sectionTitle: {
    ...theme.typography.h4,
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(2),
  },
  rideTypeCard: {
    flexDirection: 'row',
    backgroundColor: theme.palette.background.card,
    padding: theme.spacing(2),
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing(2),
    borderWidth: 2,
    borderColor: 'transparent',
    ...theme.shadows.sm,
  },
  rideTypeCardSelected: {
    borderColor: theme.palette.secondary.main,
  },
  rideIcon: {
    fontSize: 40,
    marginRight: theme.spacing(2),
  },
  rideInfo: {
    flex: 1,
  },
  rideName: {
    ...theme.typography.h5,
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(0.5),
  },
  rideDescription: {
    ...theme.typography.body2,
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(0.5),
  },
  ridePrice: {
    ...theme.typography.caption,
    color: theme.palette.secondary.main,
    fontWeight: '600',
  },
  bookButton: {
    backgroundColor: theme.palette.primary.main,
    padding: theme.spacing(2),
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(4),
    ...theme.shadows.md,
  },
  bookButtonText: {
    ...theme.typography.button,
    color: theme.palette.primary.contrastText,
  },
});

