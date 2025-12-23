/**
 * Confirm Dialog Utility
 * Global state management for confirmation dialogs
 */

import React, { useState, useCallback } from 'react';
import { ConfirmDialog, ConfirmDialogOptions } from '../components/ConfirmDialog';

let globalShowConfirm: ((options: ConfirmDialogOptions) => void) | null = null;

export const ConfirmDialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<ConfirmDialogOptions | null>(null);

  const showConfirm = useCallback((dialogOptions: ConfirmDialogOptions) => {
    setOptions(dialogOptions);
    setVisible(true);
  }, []);

  const handleClose = useCallback(() => {
    setVisible(false);
    // Keep options briefly to allow animation
    setTimeout(() => {
      setOptions(null);
    }, 200);
  }, []);

  React.useEffect(() => {
    globalShowConfirm = showConfirm;
    return () => {
      globalShowConfirm = null;
    };
  }, [showConfirm]);

  return (
    <>
      {children}
      <ConfirmDialog
        visible={visible}
        options={options}
        onClose={handleClose}
      />
    </>
  );
};

export const showConfirmDialog = (options: ConfirmDialogOptions) => {
  if (globalShowConfirm) {
    globalShowConfirm(options);
  } else {
    console.warn('ConfirmDialogProvider not mounted. Using fallback Alert.');
    // Fallback to native alert if provider not mounted
    const { Alert } = require('react-native');
    Alert.alert(
      options.title,
      options.message,
      [
        {
          text: options.cancelText || 'Cancel',
          style: 'cancel',
          onPress: options.onCancel,
        },
        {
          text: options.confirmText || 'Confirm',
          style: options.confirmButtonStyle === 'destructive' ? 'destructive' : 'default',
          onPress: options.onConfirm,
        },
      ]
    );
  }
};

