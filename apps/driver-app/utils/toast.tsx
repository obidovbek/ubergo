/**
 * Toast Notification Utility
 * Beautiful toast notifications with multilanguage support
 */

import Toast, { BaseToast, ErrorToast, InfoToast, ToastConfig } from 'react-native-toast-message';
import { View, Text, StyleSheet } from 'react-native';
import React from 'react';

// Custom toast configuration with beautiful design
export const toastConfig: ToastConfig = {
  success: (props) => (
    <BaseToast
      {...props}
      style={styles.successToast}
      contentContainerStyle={styles.contentContainer}
      text1Style={styles.title}
      text2Style={styles.message}
      text2NumberOfLines={3}
      renderLeadingIcon={() => (
        <View style={styles.iconContainer}>
          <Text style={styles.successIcon}>✓</Text>
        </View>
      )}
    />
  ),
  error: (props) => (
    <ErrorToast
      {...props}
      style={styles.errorToast}
      contentContainerStyle={styles.contentContainer}
      text1Style={styles.title}
      text2Style={styles.message}
      text2NumberOfLines={3}
      renderLeadingIcon={() => (
        <View style={styles.iconContainer}>
          <Text style={styles.errorIcon}>✕</Text>
        </View>
      )}
    />
  ),
  info: (props) => (
    <InfoToast
      {...props}
      style={styles.infoToast}
      contentContainerStyle={styles.contentContainer}
      text1Style={styles.title}
      text2Style={styles.message}
      text2NumberOfLines={3}
      renderLeadingIcon={() => (
        <View style={styles.iconContainer}>
          <Text style={styles.infoIcon}>ℹ</Text>
        </View>
      )}
    />
  ),
  warning: (props) => (
    <BaseToast
      {...props}
      style={styles.warningToast}
      contentContainerStyle={styles.contentContainer}
      text1Style={styles.title}
      text2Style={styles.message}
      text2NumberOfLines={3}
      renderLeadingIcon={() => (
        <View style={styles.iconContainer}>
          <Text style={styles.warningIcon}>⚠</Text>
        </View>
      )}
    />
  ),
};

const styles = StyleSheet.create({
  successToast: {
    borderLeftColor: '#4CAF50',
    borderLeftWidth: 6,
    backgroundColor: '#FFFFFF',
    height: 'auto',
    minHeight: 70,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  errorToast: {
    borderLeftColor: '#F44336',
    borderLeftWidth: 6,
    backgroundColor: '#FFFFFF',
    height: 'auto',
    minHeight: 70,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  infoToast: {
    borderLeftColor: '#2196F3',
    borderLeftWidth: 6,
    backgroundColor: '#FFFFFF',
    height: 'auto',
    minHeight: 70,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  warningToast: {
    borderLeftColor: '#FF9800',
    borderLeftWidth: 6,
    backgroundColor: '#FFFFFF',
    height: 'auto',
    minHeight: 70,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  contentContainer: {
    paddingHorizontal: 16,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  successIcon: {
    fontSize: 24,
    color: '#4CAF50',
    fontWeight: '700',
  },
  errorIcon: {
    fontSize: 24,
    color: '#F44336',
    fontWeight: '700',
  },
  infoIcon: {
    fontSize: 24,
    color: '#2196F3',
    fontWeight: '700',
  },
  warningIcon: {
    fontSize: 24,
    color: '#FF9800',
    fontWeight: '700',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    fontWeight: '400',
    color: '#666666',
    lineHeight: 20,
  },
});

// Toast helper functions
export const showToast = {
  success: (title: string, message?: string) => {
    Toast.show({
      type: 'success',
      text1: title,
      text2: message,
      position: 'top',
      visibilityTime: 3000,
      topOffset: 50,
    });
  },
  
  error: (title: string, message?: string) => {
    Toast.show({
      type: 'error',
      text1: title,
      text2: message,
      position: 'top',
      visibilityTime: 4000,
      topOffset: 50,
    });
  },
  
  info: (title: string, message?: string) => {
    Toast.show({
      type: 'info',
      text1: title,
      text2: message,
      position: 'top',
      visibilityTime: 3000,
      topOffset: 50,
    });
  },
  
  warning: (title: string, message?: string) => {
    Toast.show({
      type: 'warning',
      text1: title,
      text2: message,
      position: 'top',
      visibilityTime: 3500,
      topOffset: 50,
    });
  },
};

export default Toast;

