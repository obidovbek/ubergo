/**
 * DateWheelModal — the day / month / year wheel (T-036).
 *
 * `UserDetailsScreen` and `EditProfileScreen` each carried an identical copy of this
 * markup **and** identical `generateDays`/`generateMonths`/`generateYears` helpers, so
 * they collapse into one component rather than being re-skinned twice.
 *
 * ⚠️ Controlled on purpose: the screens keep owning `tempDate` and their
 * confirm/cancel handlers, so this change is presentation-only.
 */

import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppModal } from './AppModal';
import { useTranslation } from '../hooks/useTranslation';
import { createTheme } from '../themes';

const theme = createTheme('light');
const m = theme.modal;

/** The app has always offered 1900 → this year; kept exactly as it was. */
const EARLIEST_YEAR = 1900;

interface DateWheelModalProps {
  visible: boolean;
  /** The in-progress value. The caller commits it in `onConfirm`. */
  value: Date;
  onChange: (date: Date) => void;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  earliestYear?: number;
  latestYear?: number;
}

export const DateWheelModal: React.FC<DateWheelModalProps> = ({
  visible,
  value,
  onChange,
  onConfirm,
  onCancel,
  title,
  earliestYear = EARLIEST_YEAR,
  latestYear,
}) => {
  const { t } = useTranslation();

  const years = useMemo(() => {
    const last = latestYear ?? new Date().getFullYear();
    const list: number[] = [];
    for (let year = last; year >= earliestYear; year--) list.push(year);
    return list;
  }, [earliestYear, latestYear]);

  const months = useMemo(
    () => [
      { value: 1, label: t('months.january') },
      { value: 2, label: t('months.february') },
      { value: 3, label: t('months.march') },
      { value: 4, label: t('months.april') },
      { value: 5, label: t('months.may') },
      { value: 6, label: t('months.june') },
      { value: 7, label: t('months.july') },
      { value: 8, label: t('months.august') },
      { value: 9, label: t('months.september') },
      { value: 10, label: t('months.october') },
      { value: 11, label: t('months.november') },
      { value: 12, label: t('months.december') },
    ],
    [t]
  );

  const days = useMemo(() => {
    const daysInMonth = new Date(value.getFullYear(), value.getMonth() + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  }, [value]);

  // Changing month or year can strip a day off the end (31 Jan -> Feb); clamp rather
  // than let Date roll the selection into the following month.
  const withMonth = (month: number) => {
    const maxDay = new Date(value.getFullYear(), month, 0).getDate();
    return new Date(value.getFullYear(), month - 1, Math.min(value.getDate(), maxDay));
  };

  const withYear = (year: number) => {
    const maxDay = new Date(year, value.getMonth() + 1, 0).getDate();
    return new Date(year, value.getMonth(), Math.min(value.getDate(), maxDay));
  };

  const column = (
    label: string,
    items: { key: number; label: string | number; selected: boolean; next: () => Date }[]
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
      // A stray backdrop tap here would silently discard the date being picked.
      dismissOnBackdropPress={false}
      actions={[
        { label: t('common.confirm'), onPress: onConfirm },
        { label: t('common.cancel'), onPress: onCancel, variant: 'cancel' },
      ]}
    >
      <View style={styles.columns}>
        {column(
          t('common.day'),
          days.map((day) => ({
            key: day,
            label: day,
            selected: value.getDate() === day,
            next: () => new Date(value.getFullYear(), value.getMonth(), day),
          }))
        )}
        {column(
          t('common.month'),
          months.map((month) => ({
            key: month.value,
            label: month.label,
            selected: value.getMonth() + 1 === month.value,
            next: () => withMonth(month.value),
          }))
        )}
        {column(
          t('common.year'),
          years.map((year) => ({
            key: year,
            label: year,
            selected: value.getFullYear() === year,
            next: () => withYear(year),
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

export default DateWheelModal;
