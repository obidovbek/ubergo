/**
 * "Yurish vaqti" and "Yetib borish vaqti" — T-101 step 16c-2.
 *
 * The artboard's last two bottom sheets. One component serves both, because they are
 * the same sheet with a different body: a day strip, then either the departure ruler
 * or a single arrival time.
 *
 * 🔴 WHAT THIS MAKES POSSIBLE FOR THE FIRST TIME. `driver_offers` has carried
 * `depart_until` and `arrive_until` since T-080, and `loadExistingOffer` /`handleSave`
 * already round-trip them — but no control has ever SET them. Until now a driver could
 * only say "I leave at 08:00", never "between 08:00 and 11:00".
 *
 * ⚠️ EVERY RULE COMES FROM `utils/offerSchedule.ts`. This file decides nothing; it
 * shows. The arrival sheet in particular must NOT re-derive "is this reachable" — that
 * comparison is defect ③ from step 8f, and it is asserted in the checker.
 */

import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme, typography, borderRadius, space, sizes } from '../../themes';
import {
  SLOTS_PER_DAY,
  slotToLabel,
  type WindowSelection,
} from '../../utils/offerSchedule';
import { TimeRuler } from './TimeRuler';
import { ToggleChip } from './ToggleChip';

export interface ScheduleSheetLabels {
  departTitle: string;
  arriveTitle: string;
  departCrumb: string;
  arriveCrumb: string;
  urgent: string;
  confirm: string;
  close: string;
  nextDay: string;
  clear: string;
}

interface ScheduleSheetProps {
  visible: boolean;
  mode: 'depart' | 'arrive';
  /** The four days the artboard offers, starting today. */
  days: Date[];
  dayIndex: number;
  onPickDay: (index: number) => void;
  /** Departure only. */
  window: WindowSelection;
  onChangeWindow: (next: WindowSelection) => void;
  urgent: boolean;
  onToggleUrgent: () => void;
  /** Arrival only — a single slot, or null for "no deadline". */
  arriveSlot: number | null;
  onPickArriveSlot: (slot: number | null) => void;
  /** Set when the current choice breaks a rule; the confirm stays available anyway
   *  so the driver is never trapped, but the reason is on screen. */
  warning?: string;
  now: Date;
  formatDay: (day: Date) => string;
  labels: ScheduleSheetLabels;
  onConfirm: () => void;
  onClose: () => void;
}

export const ScheduleSheet: React.FC<ScheduleSheetProps> = ({
  visible,
  mode,
  days,
  dayIndex,
  onPickDay,
  window,
  onChangeWindow,
  urgent,
  onToggleUrgent,
  arriveSlot,
  onPickArriveSlot,
  warning,
  now,
  formatDay,
  labels,
  onConfirm,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const isDepart = mode === 'depart';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel={labels.close} />

        {/*
          🔴 The system navigation bar sits OVER the sheet — the same S24 Ultra finding
          `GeoSheet` records. `Modal` renders outside the SafeAreaProvider layout, so the
          inset has to be applied here by hand.
        */}
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          <View style={styles.grabber} />

          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>
                {isDepart ? labels.departTitle : labels.arriveTitle}
              </Text>
              <Text style={styles.crumb}>
                {isDepart ? labels.departCrumb : labels.arriveCrumb}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              style={styles.headerButton}
              accessibilityRole="button"
              accessibilityLabel={labels.close}
            >
              <Text style={styles.headerClose}>✕</Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* The day strip — the artboard offers four days from today. */}
            <View style={styles.days}>
              {days.map((day, index) => {
                const on = index === dayIndex;
                return (
                  <Pressable
                    key={day.toISOString()}
                    onPress={() => onPickDay(index)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    style={[styles.day, on && styles.dayOn]}
                  >
                    <Text style={[styles.dayText, on && styles.dayTextOn]}>
                      {formatDay(day)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {isDepart ? (
              <>
                {/*
                  "Hoziroq". It is not merely a shortcut: an urgent offer is exempt from
                  the advance floor, which is a different promise, not a loophole
                  (step 8f, defect ①). The ruler is disabled while it is on so the two
                  cannot both claim to describe the departure.
                */}
                <ToggleChip label={labels.urgent} on={urgent} onPress={onToggleUrgent} />

                <View style={urgent ? styles.rulerOff : undefined} pointerEvents={urgent ? 'none' : 'auto'}>
                  <TimeRuler
                    window={window}
                    onChange={onChangeWindow}
                    now={now}
                    isToday={dayIndex === 0}
                    disabled={urgent}
                    nextDayLabel={labels.nextDay}
                  />
                </View>
              </>
            ) : (
              <View style={styles.slots}>
                <Pressable
                  onPress={() => onPickArriveSlot(null)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: arriveSlot === null }}
                  style={[styles.slot, styles.slotWide, arriveSlot === null && styles.slotOn]}
                >
                  <Text style={[styles.slotText, arriveSlot === null && styles.slotTextOn]}>
                    {labels.clear}
                  </Text>
                </Pressable>

                {Array.from({ length: SLOTS_PER_DAY / 2 }, (_, i) => i * 2).map((slot) => {
                  const on = arriveSlot === slot;
                  return (
                    <Pressable
                      key={slot}
                      onPress={() => onPickArriveSlot(slot)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                      style={[styles.slot, on && styles.slotOn]}
                    >
                      <Text style={[styles.slotText, on && styles.slotTextOn]}>
                        {slotToLabel(slot)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {!!warning && <Text style={styles.warning}>{warning}</Text>}
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              onPress={onConfirm}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.confirm,
                pressed && { opacity: theme.states.pressedOpacity },
              ]}
            >
              <Text style={styles.confirmText}>{labels.confirm}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: theme.palette.scrim.sheet },
  sheet: {
    maxHeight: '82%',
    backgroundColor: theme.palette.ground,
    borderTopLeftRadius: borderRadius.sheet,
    borderTopRightRadius: borderRadius.sheet,
  },
  grabber: {
    alignSelf: 'center',
    width: theme.modal.grabber.width,
    height: theme.modal.grabber.height,
    borderRadius: borderRadius.full,
    backgroundColor: theme.modal.grabber.color,
    marginTop: space.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    paddingHorizontal: 18,
    paddingTop: space.xl,
    paddingBottom: space.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.palette.borders.chrome,
  },
  headerText: { flex: 1, alignItems: 'center' },
  title: { ...typography.sheetTitle, color: theme.palette.text.primary },
  crumb: { ...typography.monoTiny, color: theme.palette.text.tertiary },
  headerButton: {
    width: sizes.touchTarget,
    height: sizes.touchTarget,
    borderRadius: borderRadius.control,
    backgroundColor: theme.palette.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.palette.borders.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerClose: { ...typography.rowLabel, color: theme.palette.text.secondary },

  body: { flexGrow: 0 },
  bodyContent: { padding: 18, gap: 14 },

  days: { flexDirection: 'row', gap: 7 },
  day: {
    flex: 1,
    minHeight: sizes.touchTarget,
    borderRadius: borderRadius.control,
    borderWidth: sizes.borderHairline,
    borderColor: theme.palette.borders.control,
    backgroundColor: theme.palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.sm,
  },
  dayOn: { backgroundColor: theme.palette.action, borderColor: theme.palette.action },
  dayText: { ...typography.caption, color: theme.palette.text.primary, textAlign: 'center' },
  dayTextOn: { color: theme.palette.text.onAccent },

  rulerOff: { opacity: theme.states.disabledOpacity },

  slots: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  slot: {
    minWidth: 64,
    minHeight: sizes.touchTarget,
    borderRadius: borderRadius.md,
    borderWidth: sizes.borderHairline,
    borderColor: theme.palette.borders.control,
    backgroundColor: theme.palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  slotWide: { minWidth: '100%' },
  slotOn: { backgroundColor: theme.palette.action, borderColor: theme.palette.action },
  slotText: { ...typography.monoMeta, color: theme.palette.text.primary },
  slotTextOn: { color: theme.palette.text.onAccent },

  warning: { ...typography.caption, color: theme.palette.dangerText },

  footer: {
    paddingHorizontal: 18,
    paddingTop: space.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.palette.borders.chrome,
  },
  confirm: {
    minHeight: sizes.buttonLg,
    borderRadius: borderRadius.button,
    backgroundColor: theme.palette.action,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: { ...typography.button, color: theme.palette.text.onAccent },
});

export default ScheduleSheet;
