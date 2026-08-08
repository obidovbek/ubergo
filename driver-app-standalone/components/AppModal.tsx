/**
 * AppModal — the one modal shell for the whole app (T-036).
 *
 * Before this, all 13 modals in the app hand-rolled their own backdrop, radius and
 * palette, split across two animation conventions. This owns the chrome — backdrop,
 * card, heading, close affordance, action row — so a call site supplies only its body.
 *
 * Styled from the Figma overlay language via `theme.modal`; see `themes/index.ts` for
 * where the tokens come from. Change the look there, not here, and never at a call site.
 */

import React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createTheme } from '../themes';

const theme = createTheme('light');
const m = theme.modal;

export interface AppModalAction {
  label: string;
  onPress: () => void;
  /**
   * `primary` = green fill; `cancel` = red outline on pink, the Figma's "Orqaga";
   * `destructive` = red fill, for a confirm that deletes something.
   */
  variant?: 'primary' | 'cancel' | 'destructive';
  disabled?: boolean;
}

interface AppModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** Rendered stacked and full-width at the bottom, as in the design. */
  actions?: AppModalAction[];
  /**
   * Tapping the dimmed area closes the modal. Turn it OFF for anything destructive or
   * mid-flow, where a stray tap losing the user's input would be its own bug.
   */
  dismissOnBackdropPress?: boolean;
  /** The ✕ in the heading row. Off for dialogs that already offer a cancel action. */
  showCloseIcon?: boolean;
  /** Share of the screen the card may occupy before its body starts scrolling. */
  maxHeightRatio?: number;
  contentStyle?: StyleProp<ViewStyle>;
}

export const AppModal: React.FC<AppModalProps> = ({
  visible,
  onClose,
  title,
  children,
  actions,
  dismissOnBackdropPress = true,
  showCloseIcon = true,
  maxHeightRatio = 0.85,
  contentStyle,
}) => {
  const { height } = useWindowDimensions();

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Sits behind the card so a tap outside dismisses; `absoluteFill` keeps it
            from stealing touches from the card itself. */}
        {dismissOnBackdropPress && (
          <TouchableOpacity
            activeOpacity={1}
            style={StyleSheet.absoluteFill}
            onPress={onClose}
          />
        )}

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.centering}
          pointerEvents="box-none"
        >
          <View
            style={[styles.card, { maxHeight: height * maxHeightRatio }, contentStyle]}
          >
            {(title || showCloseIcon) && (
              <View style={styles.header}>
                {/* Absolutely positioned so the title stays optically centred
                    whether or not the close icon is shown. */}
                <Text style={styles.title} numberOfLines={2}>
                  {title}
                </Text>
                {showCloseIcon && (
                  <TouchableOpacity
                    onPress={onClose}
                    style={styles.close}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Ionicons name="close" size={22} color={m.rowText} />
                  </TouchableOpacity>
                )}
              </View>
            )}

            <View style={styles.body}>{children}</View>

            {!!actions?.length && (
              <View style={styles.actions}>
                {actions.map((action) => {
                  const variant = action.variant ?? 'primary';
                  return (
                    <TouchableOpacity
                      key={action.label}
                      style={[
                        styles.action,
                        variant === 'cancel' && styles.actionCancel,
                        variant === 'primary' && styles.actionPrimary,
                        variant === 'destructive' && styles.actionDestructive,
                        action.disabled && styles.actionDisabled,
                      ]}
                      onPress={action.onPress}
                      disabled={action.disabled}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.actionText,
                          variant === 'cancel'
                            ? styles.actionTextCancel
                            : styles.actionTextPrimary,
                        ]}
                      >
                        {action.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: m.backdrop,
  },
  centering: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: m.body,
    borderRadius: m.radius,
    borderWidth: m.borderWidth,
    borderColor: m.border,
    overflow: 'hidden',
  },
  header: {
    justifyContent: 'center',
    paddingHorizontal: 48,
    paddingTop: 16,
    paddingBottom: 10,
    minHeight: 52,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: m.heading,
    textAlign: 'center',
  },
  close: {
    position: 'absolute',
    right: 12,
    top: 12,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // `shrink` lets a long body scroll inside the card instead of pushing the actions
  // off the bottom edge.
  body: {
    flexShrink: 1,
  },
  actions: {
    padding: 16,
    paddingTop: 12,
    gap: 10,
  },
  action: {
    minHeight: 48,
    borderRadius: m.rowRadius,
    borderWidth: m.borderWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionPrimary: {
    backgroundColor: m.primary,
    borderColor: m.border,
  },
  actionCancel: {
    backgroundColor: m.cancelFill,
    borderColor: m.cancelBorder,
  },
  actionDestructive: {
    backgroundColor: m.cancelBorder,
    borderColor: m.border,
  },
  actionDisabled: {
    opacity: 0.5,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '700',
  },
  actionTextPrimary: {
    color: m.primaryText,
  },
  actionTextCancel: {
    color: m.cancelText,
  },
});

export default AppModal;
