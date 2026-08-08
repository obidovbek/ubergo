/**
 * Confirm Dialog Component
 * Custom confirmation dialog matching app design
 *
 * T-036: the chrome moved to the shared `AppModal`. The public props are unchanged —
 * `confirmButtonStyle: 'destructive'` now maps to the shell's red-fill action variant.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppModal, type AppModalAction } from './AppModal';
import { createTheme } from '../themes';

const theme = createTheme('light');
const m = theme.modal;

export interface ConfirmDialogOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonStyle?: 'primary' | 'destructive';
  onConfirm: () => void;
  onCancel: () => void;
}

interface ConfirmDialogProps {
  visible: boolean;
  options: ConfirmDialogOptions | null;
  onClose: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  options,
  onClose,
}) => {
  if (!options) return null;

  const handleConfirm = () => {
    options.onConfirm();
    onClose();
  };

  const handleCancel = () => {
    options.onCancel();
    onClose();
  };

  const actions: AppModalAction[] = [
    {
      label: options.confirmText || 'Confirm',
      onPress: handleConfirm,
      variant:
        options.confirmButtonStyle === 'destructive' ? 'destructive' : 'primary',
    },
  ];

  // Cancel is optional — some callers use this as a plain acknowledgement.
  if (options.cancelText) {
    actions.push({
      label: options.cancelText,
      onPress: handleCancel,
      variant: 'cancel',
    });
  }

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      title={options.title}
      actions={actions}
      // A confirmation is a decision — a stray backdrop tap should not stand in for it.
      dismissOnBackdropPress={false}
    >
      {!!options.message && (
        <View style={styles.body}>
          <Text style={styles.message}>{options.message}</Text>
        </View>
      )}
    </AppModal>
  );
};

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    color: m.rowText,
    textAlign: 'center',
  },
});

export default ConfirmDialog;
