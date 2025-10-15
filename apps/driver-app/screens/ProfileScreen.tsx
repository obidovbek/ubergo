/**
 * Profile Screen
 * User profile and settings
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { createTheme } from '../themes';

const theme = createTheme('light');

export const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        },
      ]
    );
  };

  const menuItems = [
    { id: 'edit', title: 'Edit Profile', icon: '✏️' },
    { id: 'payment', title: 'Payment Methods', icon: '💳' },
    { id: 'history', title: 'Ride History', icon: '📜' },
    { id: 'help', title: 'Help & Support', icon: '❓' },
    { id: 'settings', title: 'Settings', icon: '⚙️' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={styles.name}>{user?.name || 'Guest User'}</Text>
          <Text style={styles.email}>{user?.email || 'No email'}</Text>
          <Text style={styles.phone}>{user?.phone || 'No phone'}</Text>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => console.log(`Navigate to ${item.id}`)}
            >
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>UbexGo v1.0.0</Text>
        </View>
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
  },
  profileHeader: {
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
  },
  menuSection: {
    backgroundColor: theme.palette.background.card,
    marginBottom: theme.spacing(2),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing(2),
    borderBottomWidth: 1,
    borderBottomColor: theme.palette.divider,
  },
  menuIcon: {
    fontSize: 24,
    marginRight: theme.spacing(2),
  },
  menuTitle: {
    ...theme.typography.body1,
    color: theme.palette.text.primary,
    flex: 1,
  },
  menuArrow: {
    fontSize: 24,
    color: theme.palette.text.secondary,
  },
  logoutButton: {
    backgroundColor: theme.palette.error.main,
    padding: theme.spacing(2),
    borderRadius: theme.borderRadius.md,
    margin: theme.spacing(2),
    alignItems: 'center',
    ...theme.shadows.md,
  },
  logoutButtonText: {
    ...theme.typography.button,
    color: '#FFFFFF',
  },
  appInfo: {
    padding: theme.spacing(2),
    alignItems: 'center',
  },
  appInfoText: {
    ...theme.typography.caption,
    color: theme.palette.text.disabled,
  },
});

