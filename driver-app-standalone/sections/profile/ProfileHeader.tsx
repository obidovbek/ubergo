/**
 * Profile Header Section
 * Displays user profile information
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { User } from '../../api/users';
import { createTheme } from '../../themes';

const theme = createTheme('light');

interface ProfileHeaderProps {
  user: User | null;
  onEditPress?: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  user,
  onEditPress,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {user?.name?.charAt(0).toUpperCase() || 'U'}
        </Text>
      </View>
      
      <Text style={styles.name}>{user?.name || 'Guest User'}</Text>
      <Text style={styles.email}>{user?.email || 'No email'}</Text>
      <Text style={styles.phone}>{user?.phone || 'No phone'}</Text>

      {onEditPress && (
        <TouchableOpacity style={styles.editButton} onPress={onEditPress}>
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: theme.spacing(4),
    backgroundColor: theme.palette.background.card,
    marginBottom: theme.spacing(2),
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.palette.secondary.main,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing(2),
  },
  avatarText: {
    ...theme.typography.h1,
    color: theme.palette.secondary.contrastText,
  },
  name: {
    ...theme.typography.h3,
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(0.5),
  },
  email: {
    ...theme.typography.body1,
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(0.5),
  },
  phone: {
    ...theme.typography.body2,
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(2),
  },
  editButton: {
    paddingHorizontal: theme.spacing(3),
    paddingVertical: theme.spacing(1),
    backgroundColor: theme.palette.primary.main,
    borderRadius: theme.borderRadius.full,
  },
  editButtonText: {
    ...theme.typography.body2,
    color: theme.palette.primary.contrastText,
    fontWeight: '600',
  },
});

