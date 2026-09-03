/**
 * TimeSheet — the order screen's date/time picker. T-101 step 8e.
 *
 * 🔴 REPLACES TWO CENTRED WHEEL DIALOGS, on three device findings from the owner
 * (2026-09-01), all correct and all the same root cause — the wheels used the DIALOG
 * shell (`AppModal`, `justifyContent: 'center'`) where the design specifies the SHEET one:
 *   ① "date time selection view do not look like design" — the artboard has date CARDS
 *      (weekday / big mono day / month), not a spinning wheel;
 *   ② "calender selected time always in center" — that is `AppModal` centring it;
 *   ③ "calender appears from bottom like county/city/..." — i.e. like `GeoSheet`.
 *
 * The shell is the shared `BottomSheet`, extracted from `GeoSheet` for this, so the two
 * pickers cannot drift apart and the safe-area fix inside it is not re-lost here.
 *
 * ⚠️ WHAT THIS DELIBERATELY DOES NOT BUILD: the artboard's time row is a DRAGGABLE strip
 * of 15-minute blocks with a ruler and a "keyingi kun" marker. Owner chose (2026-09-01)
 * the simpler tap-to-pick chips instead — a custom pan-gesture control is the most
 * intricate thing in the design and the easiest to get subtly wrong on a touchscreen.
 * The data model is identical either way, so the strip can replace the chips later
 * without touching the form.
 *
 * ⚠️ THE COMMIT CONTRACT IS PRESERVED: nothing reaches the form until "Tasdiqlash".
 * The wheels worked that way on purpose (the OS picker they replaced fired per-spin on
 * iOS, so cancelling was impossible once you had scrolled) and that must not regress.
 */

import React, { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "../../hooks/useTranslation";
import { BottomSheet } from "../BottomSheet";
import { theme } from "../../themes";

/** How many days forward the date row offers. The artboard draws 4. */
const DAY_COUNT = 4;

/** Owner, 2026-08-12 (T-069): quarter-hours only. A window needs no finer grain. */
const MINUTE_STEP = 15;

export interface TimeSheetValue {
  date: Date;
  /** Departure only; null for the arrival variant. */
  fromTime: Date | null;
  untilTime: Date | null;
}

interface TimeSheetProps {
  visible: boolean;
  title: string;
  isDeparture: boolean;
  date: Date | null;
  fromTime: Date | null;
  untilTime: Date | null;
  /** Earliest selectable instant overall — used to drop whole days from the row. */
  minimumDate?: Date;
  /**
   * The floor re-based onto the day being edited, or undefined when the chosen day is
   * later than the floor's day and the whole clock is legitimately open.
   * ⚠️ Computed by the caller — see the long note in `TimeWindowCard`. It is why the
   * arrival wheels stopped offering a moment before the departure (owner, 2026-08-13).
   */
  timeFloor?: Date;
  onApply: (value: TimeSheetValue) => void;
  onClose: () => void;
}

const sameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const atMidnight = (d: Date): Date => {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

/** Puts a clock time onto a given day, which is what the form stores. */
const combine = (day: Date, time: Date): Date => {
  const out = new Date(day);
  out.setHours(time.getHours(), time.getMinutes(), 0, 0);
  return out;
};

const pad = (n: number): string => String(n).padStart(2, "0");
const hhmm = (d: Date): string => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

export const TimeSheet: React.FC<TimeSheetProps> = ({
  visible,
  title,
  isDeparture,
  date,
  fromTime,
  untilTime,
  minimumDate,
  timeFloor,
  onApply,
  onClose,
}) => {
  const { t } = useTranslation();
  // Short forms: a full weekday name overflows a quarter-width day card.
  const weekdays = t("passengerOffers.weekdaysShort").split(",");
  const months = t("passengerOffers.monthsShort").split(",");

  // Draft state — the commit contract. Re-armed on each open so a sheet dismissed
  // half-way does not reopen holding the abandoned pick.
  const [draftDate, setDraftDate] = useState<Date>(
    date ?? minimumDate ?? new Date(),
  );
  const [draftFrom, setDraftFrom] = useState<Date | null>(fromTime);
  const [draftUntil, setDraftUntil] = useState<Date | null>(untilTime);

  useEffect(() => {
    if (!visible) return;
    setDraftDate(date ?? minimumDate ?? new Date());
    setDraftFrom(fromTime);
    setDraftUntil(untilTime);
  }, [visible, date, fromTime, untilTime, minimumDate]);

  /** The artboard's four day cards, starting at the floor's day (never in the past). */
  const days = useMemo<Date[]>(() => {
    const first = atMidnight(minimumDate ?? new Date());
    return Array.from({ length: DAY_COUNT }, (_, i) => {
      const d = new Date(first);
      d.setDate(first.getDate() + i);
      return d;
    });
  }, [minimumDate]);

  /**
   * The quarter-hour slots for the chosen day.
   *
   * ⚠️ `timeFloor` is honoured HERE, not just at submit. The wheels used to offer hours
   * already gone and the refusal only arrived after the whole form was filled — the
   * T-069 complaint. Submit stays the real guard; this stops the user picking something
   * that is going to be rejected.
   */
  const slots = useMemo<Date[]>(() => {
    const out: Date[] = [];
    const floorOnDay =
      timeFloor && sameDay(timeFloor, draftDate) ? timeFloor : null;

    for (let minutes = 0; minutes < 24 * 60; minutes += MINUTE_STEP) {
      const slot = new Date(draftDate);
      slot.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
      if (floorOnDay && slot.getTime() < floorOnDay.getTime()) continue;
      out.push(slot);
    }
    return out;
  }, [draftDate, timeFloor]);

  /** The end of the window can never precede its start. */
  const untilSlots = useMemo<Date[]>(() => {
    if (!isDeparture || !draftFrom) return slots;
    return slots.filter((s) => s.getTime() > draftFrom.getTime());
  }, [slots, draftFrom, isDeparture]);

  const canApply = isDeparture ? !!draftFrom : !!draftUntil;

  const handleApply = () => {
    if (!canApply) return;
    onApply({
      date: draftDate,
      fromTime: draftFrom,
      untilTime: draftUntil,
    });
  };

  const renderSlotRow = (
    label: string,
    options: Date[],
    selected: Date | null,
    onPick: (d: Date) => void,
    clearable?: () => void,
  ) => (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={styles.eyebrow}>{label.toUpperCase()}</Text>
        {!!selected && !!clearable && (
          <TouchableOpacity onPress={clearable} hitSlop={8}>
            <Text style={styles.clear}>{t("common.clear")}</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.slotRow}
      >
        {options.map((slot) => {
          const active = !!selected && hhmm(selected) === hhmm(slot);
          return (
            <TouchableOpacity
              key={slot.getTime()}
              style={[styles.slot, active && styles.slotActive]}
              onPress={() => onPick(slot)}
              activeOpacity={0.7}
            >
              <Text style={[styles.slotText, active && styles.slotTextActive]}>
                {hhmm(slot)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <BottomSheet visible={visible} title={title} onClose={onClose}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ---- date cards: weekday / big mono day / month, as the artboard draws ---- */}
        <View style={styles.section}>
          <Text style={styles.eyebrow}>
            {t("passengerOffers.pickDate").toUpperCase()}
          </Text>
          <View style={styles.dayRow}>
            {days.map((day) => {
              const active = sameDay(day, draftDate);
              return (
                <TouchableOpacity
                  key={day.getTime()}
                  style={[styles.dayCard, active && styles.dayCardActive]}
                  onPress={() => {
                    /*
                       Moving to another day can strand times that the old day allowed
                       and the new one does not (or vice versa). The window is rebased
                       onto the new day rather than cleared, so a passenger changing
                       their mind about the DAY does not lose their chosen HOURS.
                    */
                    setDraftDate(day);
                    setDraftFrom((prev) => (prev ? combine(day, prev) : prev));
                    setDraftUntil((prev) => (prev ? combine(day, prev) : prev));
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dayDow, active && styles.dayInkActive]}>
                    {weekdays[day.getDay()] ?? ""}
                  </Text>
                  <Text style={[styles.dayNum, active && styles.dayInkActive]}>
                    {day.getDate()}
                  </Text>
                  <Text style={[styles.dayMon, active && styles.dayInkActive]}>
                    {months[day.getMonth()] ?? ""}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ---- times ---- */}
        {isDeparture
          ? renderSlotRow(
              t("passengerOffers.pickTimeFrom"),
              slots,
              draftFrom,
              (slot) => {
                setDraftFrom(slot);
                // Keep the window coherent: an end before the new start is meaningless.
                setDraftUntil((prev) =>
                  prev && prev.getTime() <= slot.getTime() ? null : prev,
                );
              },
            )
          : null}

        {renderSlotRow(
          t("passengerOffers.pickTimeUntil"),
          untilSlots,
          draftUntil,
          setDraftUntil,
          // The end of a departure window is optional; an arrival deadline is the point
          // of the arrival card, so only the departure one offers a clear.
          isDeparture ? () => setDraftUntil(null) : undefined,
        )}

        <TouchableOpacity
          style={[styles.confirm, !canApply && styles.confirmDisabled]}
          onPress={handleApply}
          disabled={!canApply}
          activeOpacity={0.85}
        >
          <Text style={styles.confirmText}>{t("common.confirm")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </BottomSheet>
  );
};

/**
 * Measured off `UserBuyurtma.dc.html`'s time sheet: day card radius 13, pad 9/4, the
 * day number in mono 20/600 with the weekday and month at 12/600 and reduced opacity;
 * confirm button 52px, radius 16, `action` green.
 */
const styles = StyleSheet.create({
  section: { gap: 8, marginBottom: 16 },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  eyebrow: {
    ...theme.typography.eyebrow,
    color: theme.palette.text.tertiary,
  },
  clear: {
    ...theme.typography.caption,
    color: theme.palette.actionPressed,
  },

  dayRow: { flexDirection: "row", gap: 8 },
  dayCard: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    gap: 2,
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderRadius: 13,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.palette.borders.control,
    backgroundColor: theme.palette.surface,
  },
  dayCardActive: {
    borderColor: theme.palette.action,
    backgroundColor: theme.palette.successTint,
  },
  dayDow: { ...theme.typography.caption, color: theme.palette.text.secondary },
  dayNum: {
    ...theme.typography.monoValue,
    fontSize: 20,
    color: theme.palette.text.primary,
  },
  dayMon: { ...theme.typography.caption, color: theme.palette.text.secondary },
  dayInkActive: { color: theme.palette.actionPressed },

  slotRow: { flexDirection: "row", gap: 7, paddingRight: 4 },
  slot: {
    minWidth: 62,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    borderRadius: 11,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.palette.borders.control,
    backgroundColor: theme.palette.surface,
  },
  slotActive: {
    borderColor: theme.palette.action,
    backgroundColor: theme.palette.action,
  },
  slotText: {
    ...theme.typography.monoValue,
    color: theme.palette.text.primary,
  },
  slotTextActive: { color: theme.palette.text.onAccent },

  confirm: {
    height: 52,
    borderRadius: 16,
    backgroundColor: theme.palette.action,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  confirmDisabled: { opacity: 0.5 },
  confirmText: {
    ...theme.typography.button,
    color: theme.palette.text.onAccent,
  },
});

export default TimeSheet;
