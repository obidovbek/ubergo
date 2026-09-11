/**
 * OrderResultSheet — T-101 step 17f.
 *
 * The result dialog of `DriverQidiruv.dc.html` (lines 432-452), shown after the driver has
 * accepted an order or sent a counter-offer, in place of the old success toast.
 *
 * Measured: centred, padding 26 · scrim .5 (`scrim.modal`) · card `surface`, radius 22
 * (`cardLarge`), padding 20, gap 12 · check disc 48 on `successTint` in `action`, stroke 2.4 ·
 * title 18/800 · body 13.5/500 muted, line-height 1.5 · lines block on `ground`, radius 14,
 * padding 12, gap 5 — label 13/600 muted, value mono 13/700 · close button 48 high, radius 14,
 * `text.primary` fill, `text.onDark` ink.
 *
 * ⚠️ The copy is CORRECTED, not copied (owner decision ③ 2026-09-11). The artboard's accept
 * result says the passenger was "sent a confirmation" and lists their phone. In this product the
 * passenger chooses the driver (T-024) and the number opens only then (T-054), so an accept is a
 * proposal at the listed price and the phone line reads "opens once the passenger confirms".
 * The artboard's third variant, "Buyurtma rad etildi", has no backend and is not here.
 *
 * ⚠️ `Modal` sits outside the SafeAreaProvider — nothing here reaches an edge, so no inset is
 * needed; the 26px padding keeps the card clear of both bars.
 */

import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from '../../hooks/useTranslation';
import { formatNumberWithSpaces } from '../../utils/format';
import { Icon } from '../chrome/Icon';
import { theme } from '../../themes';

export type ResultKind = 'accept' | 'offer';

interface OrderResultSheetProps {
  visible: boolean;
  kind: ResultKind;
  passengerName: string;
  seatKindLabel: string;
  total: number | null;
  currency: string;
  onClose: () => void;
}

export const OrderResultSheet: React.FC<OrderResultSheetProps> = ({
  visible,
  kind,
  passengerName,
  seatKindLabel,
  total,
  currency,
  onClose,
}) => {
  const { t } = useTranslation();
  const money = total === null ? '—' : `${formatNumberWithSpaces(Math.round(total))} ${currency}`;

  const lines: [string, string][] = [
    [t('passengerOfferDetails.passenger'), passengerName],
    [t('passengerOrders.seatKind'), seatKindLabel],
    [kind === 'offer' ? t('passengerOrders.resultOfferPrice') : t('passengerOrders.resultTotal'), money],
  ];
  if (kind === 'accept') lines.push([t('passengerOrders.phone'), t('passengerOrders.phoneHidden')]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.scrim} onPress={onClose} accessibilityRole="button" accessibilityLabel={t('passengerOrders.close')} />
        <View style={styles.card} accessibilityViewIsModal>
          <View style={styles.disc}>
            <Icon name="check" size={26} color={theme.palette.action} strokeWidth={2.4} />
          </View>
          <Text style={styles.title}>
            {kind === 'offer' ? t('passengerOfferDetails.sentTitle') : t('passengerOrders.resultAcceptTitle')}
          </Text>
          <Text style={styles.body}>
            {kind === 'offer' ? t('passengerOrders.resultOfferBody') : t('passengerOrders.resultAcceptBody')}
          </Text>
          <View style={styles.lines}>
            {lines.map(([label, value]) => (
              <View key={label} style={styles.line}>
                <Text style={styles.lineLabel}>{label}</Text>
                <Text style={styles.lineValue} numberOfLines={2}>
                  {value}
                </Text>
              </View>
            ))}
          </View>
          <Pressable style={styles.close} onPress={onClose} accessibilityRole="button">
            <Text style={styles.closeText}>{t('passengerOrders.close')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 26 },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: theme.palette.scrim.modal },
  card: {
    width: '100%',
    backgroundColor: theme.palette.surface,
    borderRadius: theme.borderRadius.cardLarge,
    padding: 20,
    gap: 12,
    ...theme.shadows.drawer,
  },
  disc: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.palette.successTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 18, lineHeight: 23, ...theme.font('sans', 800), color: theme.palette.text.primary },
  body: { fontSize: 13.5, lineHeight: 20, ...theme.font('sans', 500), color: theme.palette.text.muted },
  lines: { gap: 5, padding: 12, borderRadius: theme.borderRadius.field, backgroundColor: theme.palette.ground },
  line: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 },
  lineLabel: { fontSize: 13, lineHeight: 17, ...theme.font('sans', 600), color: theme.palette.text.muted },
  lineValue: { flexShrink: 1, fontSize: 13, lineHeight: 17, ...theme.font('mono', 700), color: theme.palette.text.primary, textAlign: 'right' },
  close: {
    minHeight: 48,
    borderRadius: theme.borderRadius.field,
    backgroundColor: theme.palette.text.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { fontSize: 15, lineHeight: 19, ...theme.font('sans', 800), color: theme.palette.text.onDark },
});
