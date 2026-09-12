/**
 * RejectReasonSheet — T-101 step 18c.
 *
 * The nine-reason sheet of `DriverMyOrder.dc.html` (lines 388-419), for rejecting one
 * pending booking.
 *
 * 🟢 THIS ONE IS FULLY BACKED, unlike most of the artboard's extras. `rejectPassenger`
 * takes an optional reason, `OfferPassengerService.ts:527` stores it in `rejection_reason`,
 * and `:536` puts it in the push payload the passenger receives. Verified 2026-09-12.
 *
 * ⚠️ The artboard applies this list to "Buyurtmani bekor qilish" — cancelling an accepted
 * order. There is no such endpoint (a confirmed booking cannot be un-confirmed by the
 * driver), so the list is attached to the reject of a PENDING request, which is the real
 * action with a real reason column. The reasons themselves are the artboard's, verbatim.
 *
 * Measured: scrim .5, sheet `ground`, radius 24 top, padding 12 14 24, max height 86%,
 * radio rows `surface` with a 1px border (`dangerBorder` + `dangerTint` when picked),
 * 22px dot, confirm 50 high going from `borders.emphasis` to `danger` when valid.
 */

import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from '../../hooks/useTranslation';
import {
  isRejectValid,
  rejectReasonText,
  REJECT_REASON_KEYS,
  REJECT_REASON_OTHER,
} from '../../utils/myRides';
import { theme } from '../../themes';

export interface RejectReasonSheetProps {
  visible: boolean;
  /** The passenger being rejected — shown in the title so the wrong row cannot be hit blind. */
  passengerName: string;
  busy?: boolean;
  onClose: () => void;
  /** Receives the final text, already resolved from the key or the typed "other". */
  onConfirm: (reason: string) => void;
}

export const RejectReasonSheet: React.FC<RejectReasonSheetProps> = ({
  visible,
  passengerName,
  busy = false,
  onClose,
  onConfirm,
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [reasonKey, setReasonKey] = useState<string | null>(null);
  const [otherText, setOtherText] = useState('');

  const valid = isRejectValid(reasonKey, otherText);

  // Reset whenever the sheet is dismissed, so the next passenger starts clean.
  const close = () => {
    setReasonKey(null);
    setOtherText('');
    onClose();
  };

  const confirm = () => {
    if (!valid || !reasonKey || busy) return;
    onConfirm(rejectReasonText(reasonKey, otherText, t));
    setReasonKey(null);
    setOtherText('');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <View style={styles.root}>
        <Pressable
          style={styles.scrim}
          onPress={close}
          accessibilityRole="button"
          accessibilityLabel={t('common.cancel')}
        />
        <View style={[styles.sheet, { paddingBottom: 24 + insets.bottom }]} accessibilityViewIsModal>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={2}>
              {t('offerPassengers.rejectPassenger')}
            </Text>
            <Pressable style={styles.closeBtn} onPress={close} accessibilityRole="button">
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M6 6l12 12M18 6L6 18"
                  stroke={theme.palette.text.primary}
                  strokeWidth={2.4}
                  strokeLinecap="round"
                />
              </Svg>
            </Pressable>
          </View>
          <Text style={styles.subtitle} numberOfLines={2}>
            {passengerName}
          </Text>

          <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
            {REJECT_REASON_KEYS.map((key) => {
              const on = reasonKey === key;
              return (
                <Pressable
                  key={key}
                  style={[styles.reason, on && styles.reasonOn]}
                  onPress={() => setReasonKey(key)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                >
                  <View style={[styles.dot, on && styles.dotOn]}>
                    {on && (
                      <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                        <Path
                          d="M5 12.5l4.5 4.5L19 7.5"
                          stroke={theme.palette.text.onDark}
                          strokeWidth={3}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
                    )}
                  </View>
                  <Text style={styles.reasonLabel}>{t(key)}</Text>
                </Pressable>
              );
            })}

            {reasonKey === REJECT_REASON_OTHER && (
              <TextInput
                style={styles.input}
                value={otherText}
                onChangeText={setOtherText}
                placeholder={t('offerPassengers.rejectReasonPlaceholder')}
                placeholderTextColor={theme.palette.text.tertiary}
                multiline
              />
            )}
          </ScrollView>

          <Pressable
            style={[styles.confirm, valid && !busy ? styles.confirmOn : styles.confirmOff]}
            onPress={confirm}
            disabled={!valid || busy}
            accessibilityRole="button"
          >
            <Text style={[styles.confirmLabel, valid && !busy ? styles.confirmInkOn : styles.confirmInkOff]}>
              {t('offerPassengers.reject')}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: theme.palette.scrim.modal },
  sheet: {
    backgroundColor: theme.palette.ground,
    borderTopLeftRadius: theme.borderRadius.hero,
    borderTopRightRadius: theme.borderRadius.hero,
    paddingTop: 12,
    paddingHorizontal: 14,
    maxHeight: '86%',
    gap: 10,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { flex: 1, minWidth: 0, fontSize: 15.5, ...theme.font('sans', 800), color: theme.palette.text.primary },
  subtitle: { fontSize: 12.5, ...theme.font('sans', 600), color: theme.palette.text.muted },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1.5,
    borderColor: theme.palette.borders.strong,
    backgroundColor: theme.palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  list: { flexGrow: 0 },
  reason: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    marginBottom: 8,
    borderRadius: theme.borderRadius.field,
    borderWidth: 1,
    borderColor: theme.palette.borders.strong,
    backgroundColor: theme.palette.surface,
  },
  reasonOn: { borderColor: theme.palette.dangerBorder, backgroundColor: theme.palette.dangerTint },
  dot: {
    width: 22,
    height: 22,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1.5,
    borderColor: theme.palette.borders.emphasis,
    backgroundColor: theme.palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotOn: { borderColor: theme.palette.danger, backgroundColor: theme.palette.danger },
  reasonLabel: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    ...theme.font('sans', 600),
    color: theme.palette.text.primary,
    lineHeight: 17,
  },
  input: {
    minHeight: 72,
    padding: 12,
    borderRadius: theme.borderRadius.field,
    borderWidth: 1,
    borderColor: theme.palette.borders.control,
    backgroundColor: theme.palette.surfaceInput,
    fontSize: 13,
    ...theme.font('sans', 500),
    color: theme.palette.text.primary,
    textAlignVertical: 'top',
  },

  confirm: {
    minHeight: 50,
    borderRadius: theme.borderRadius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmOn: { backgroundColor: theme.palette.danger },
  confirmOff: { backgroundColor: theme.palette.borders.emphasis },
  confirmLabel: { fontSize: 14, ...theme.font('sans', 800) },
  confirmInkOn: { color: theme.palette.text.onDark },
  confirmInkOff: { color: theme.palette.text.tertiary },
});
