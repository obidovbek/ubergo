/**
 * TimeWheelModal — the hour / minute wheel (T-057).
 *
 * The companion to `DateWheelModal`, deliberately built to the same shape: same
 * `AppModal` shell, same column markup, same confirm/cancel actions, same
 * controlled contract (the caller owns the in-progress value and commits it in
 * `onConfirm`). Read that file alongside this one — differences between them are
 * bugs, not choices.
 *
 * Why it exists: `TimeWindowCard` opened the bare OS `DateTimePicker`, so the
 * create-offer screen dropped out of the app's design three times in a row (date,
 * from-time, until-time). `DateWheelModal` covers only the date.
 *
 * ⚠️ Minutes step by `minuteStep` (default 5). A departure window does not need
 * per-minute precision, and a 60-row column is miserable to scroll.
 */

import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppModal } from './AppModal';
import { useTranslation } from '../hooks/useTranslation';
import { createTheme } from '../themes';

const theme = createTheme('light');
const m = theme.modal;

const pad = (value: number): string => String(value).padStart(2, '0');

interface TimeWheelModalProps {
  visible: boolean;
  /** The in-progress value. The caller commits it in `onConfirm`. */
  value: Date;
  onChange: (date: Date) => void;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  /** Minutes shown in the right-hand column: 0, step, 2×step … Default 5. */
  minuteStep?: number;
}

export const TimeWheelModal: React.FC<TimeWheelModalProps> = ({
  visible,
  value,
  onChange,
  onConfirm,
  onCancel,
  title,
  minuteStep = 5,
}) => {
  const { t } = useTranslation();

  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);

  const minutes = useMemo(() => {
    // Guard the prop: a 0 or negative step would loop forever building the list.
    const step = minuteStep > 0 ? Math.min(minuteStep, 60) : 5;
    const list: number[] = [];
    for (let minute = 0; minute < 60; minute += step) list.push(minute);
    return list;
  }, [minuteStep]);

  const withHour = (hour: number) => {
    const next = new Date(value);
    next.setHours(hour, value.getMinutes(), 0, 0);
    return next;
  };

  const withMinute = (minute: number) => {
    const next = new Date(value);
    next.setHours(value.getHours(), minute, 0, 0);
    return next;
  };

  /**
   * ⚠️ The selected minute is matched by BUCKET, not equality. A value already
   * on the clock (say 21:07) sits between two rows, and an equality test would
   * highlight nothing — leaving the user unable to see what is selected.
   */
  const selectedMinuteBucket = useMemo(() => {
    const current = value.getMinutes();
    let bucket = minutes[0] ?? 0;
    for (const minute of minutes) {
      if (minute <= current) bucket = minute;
    }
    return bucket;
  }, [minutes, value]);

  const column = (
    label: string,
    items: { key: number; label: string; selected: boolean; next: () => Date }[]
  ) => (
    <View style={styles.column}>
      <Text style={styles.columnLabel}>{label}</Text>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {items.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={[styles.item, item.selected && styles.itemSelected]}
            onPress={() => onChange(item.next())}
          >
            <Text style={[styles.itemText, item.selected && styles.itemTextSelected]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <AppModal
      visible={visible}
      onClose={onCancel}
      title={title}
      showCloseIcon={false}
      // A stray backdrop tap here would silently discard the time being picked.
      dismissOnBackdropPress={false}
      actions={[
        { label: t('common.confirm'), onPress: onConfirm },
        { label: t('common.cancel'), onPress: onCancel, variant: 'cancel' },
      ]}
    >
      <View style={styles.columns}>
        {column(
          t('common.hour'),
          hours.map((hour) => ({
            key: hour,
            label: pad(hour),
            selected: value.getHours() === hour,
            next: () => withHour(hour),
          }))
        )}
        {column(
          t('common.minute'),
          minutes.map((minute) => ({
            key: minute,
            label: pad(minute),
            selected: selectedMinuteBucket === minute,
            next: () => withMinute(minute),
          }))
        )}
      </View>
    </AppModal>
  );
};

const styles = StyleSheet.create({
  columns: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  column: {
    flex: 1,
  },
  columnLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: m.rowText,
    textAlign: 'center',
    marginBottom: 6,
  },
  scroll: {
    height: 220,
    backgroundColor: m.row,
    borderRadius: m.rowRadius,
    borderWidth: m.borderWidth,
    borderColor: m.border,
  },
  item: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  itemSelected: {
    backgroundColor: m.rowSelected,
  },
  itemText: {
    fontSize: 15,
    color: m.rowText,
  },
  itemTextSelected: {
    fontWeight: '700',
    color: m.rowSelectedText,
  },
});

export default TimeWheelModal;
