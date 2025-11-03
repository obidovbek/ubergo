/**
 * Ride Type Selector Section
 * Reusable section component for selecting ride types
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { rideTypes, RideType } from '../../data/rideTypes';
import { createTheme } from '../../themes';

const theme = createTheme('light');

interface RideTypeSelectorProps {
  selectedType: string;
  onSelectType: (typeId: string) => void;
}

export const RideTypeSelector: React.FC<RideTypeSelectorProps> = ({
  selectedType,
  onSelectType,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Ride Type</Text>
      {rideTypes.map((type) => (
        <TouchableOpacity
          key={type.id}
          style={[
            styles.card,
            selectedType === type.id && styles.cardSelected,
          ]}
          onPress={() => onSelectType(type.id)}
          activeOpacity={0.7}
        >
          <Text style={styles.icon}>{type.icon}</Text>
          <View style={styles.info}>
            <Text style={styles.name}>{type.name}</Text>
            <Text style={styles.description}>{type.description}</Text>
            <Text style={styles.price}>
              ${type.basePrice} + ${type.pricePerKm}/km
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing(3),
  },
  title: {
    ...theme.typography.h4,
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(2),
  },
  card: {
    flexDirection: 'row',
    backgroundColor: theme.palette.background.card,
    padding: theme.spacing(2),
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing(2),
    borderWidth: 2,
    borderColor: 'transparent',
    ...theme.shadows.sm,
  },
  cardSelected: {
    borderColor: theme.palette.secondary.main,
    backgroundColor: theme.palette.background.default,
  },
  icon: {
    fontSize: 40,
    marginRight: theme.spacing(2),
  },
  info: {
    flex: 1,
  },
  name: {
    ...theme.typography.h5,
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(0.5),
  },
  description: {
    ...theme.typography.body2,
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(0.5),
  },
  price: {
    ...theme.typography.caption,
    color: theme.palette.secondary.main,
    fontWeight: '600',
  },
});

