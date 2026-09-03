/**
 * Time Window Card
 *
 * Two flavours, both drawn inline on the order screen (K_buyurtma001Yangi.png):
 *  - departure: ⚡ "hoziroq" toggle + date + a from–until time window
 *               → start_at / depart_until
 *  - arrival:   date + a single "gacha" time → arrive_until (fully optional)
 *
 * Dates are formatted by hand instead of Intl: weekday names via a translation
 * key, numbers padded. Android/Hermes locale data is not something to rely on.
 */

import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { TimeSheet } from "./TimeSheet";
import { useTranslation } from "../../hooks/useTranslation";
import { Chip } from "../Chip";
import { theme } from "../../themes";

const pad = (value: number): string => String(value).padStart(2, "0");

export const formatDateNumeric = (date: Date): string =>
  `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;

export const formatTime = (date: Date): string =>
  `${pad(date.getHours())}:${pad(date.getMinutes())}`;

/*
  T-101 step 8f — `combineDateTime` moved to `utils/rideTime` with the time rules that
  depend on it, and is re-exported here so its existing importers do not have to move.
  Two identical copies of the same date arithmetic is how the form and its rules drift.
*/
export { combineDateTime } from "../../utils/rideTime";

interface TimeWindowCardProps {
  variant: "departure" | "arrival";
  date: Date | null;
  onDateChange: (date: Date) => void;
  /** Departure only — the start of the window. */
  fromTime?: Date | null;
  onFromTimeChange?: (time: Date) => void;
  untilTime: Date | null;
  onUntilTimeChange: (time: Date | null) => void;
  /** Departure only — ⚡ hoziroq (srochno). */
  urgent?: boolean;
  onUrgentChange?: (urgent: boolean) => void;
  /**
   * Earliest selectable departure instant. Passed straight to both wheels so
   * the picker cannot offer a moment the form is going to refuse.
   */
  minimumDate?: Date;
  error?: string;
}

export const TimeWindowCard: React.FC<TimeWindowCardProps> = ({
  variant,
  date,
  onDateChange,
  fromTime,
  onFromTimeChange,
  untilTime,
  onUntilTimeChange,
  urgent = false,
  onUrgentChange,
  minimumDate,
  error,
}) => {
  const { t } = useTranslation();
  const [sheetOpen, setSheetOpen] = useState(false);
  /** The value the open wheel is editing; committed only on Confirm. */

  const isDeparture = variant === "departure";
  const weekdays = t("passengerOffers.weekdays").split(",");

  const formatFullDate = (value: Date): string => {
    const weekday = weekdays[value.getDay()] ?? "";
    return weekday
      ? `${formatDateNumeric(value)} ${weekday}`
      : formatDateNumeric(value);
  };

  /** The Figma sentence: "21:00-23:00 da yurish vaqti / 25.08.2025 Yakshanba". */
  const summary = (): string => {
    if (isDeparture && urgent) return t("passengerOffers.departNow");
    if (!date) return t("passengerOffers.timeNotSet");

    if (isDeparture) {
      if (!fromTime) return t("passengerOffers.timeNotSet");
      const window = untilTime
        ? `${formatTime(fromTime)}-${formatTime(untilTime)}`
        : formatTime(fromTime);
      return `${window} ${t("passengerOffers.departureSummarySuffix")}\n${formatFullDate(date)}`;
    }

    if (!untilTime) return t("passengerOffers.timeNotSet");
    return `${formatFullDate(date)} ${formatTime(untilTime)} ${t("passengerOffers.arrivalSummarySuffix")}`;
  };

  /*
    T-101 step 8e — `draft`, `valueFor`, `openPicker`, `closePicker` and `commitDraft`
    moved into `TimeSheet` with the wheels they served. The "commit only on confirm"
    contract they existed to provide is now the sheet's `onApply`.
  */
  const controlsDisabled = isDeparture && urgent;

  /**
   * The floor handed to the TIME wheels, re-based onto the day being edited.
   *
   * The wheel only restricts rows when its `minimumDate` falls on the same
   * calendar day as the value being spun. `draft` for a from/until pick sits on
   * the day chosen in the date control, so the raw `minimumDate` (which is on
   * *today*) would restrict nothing whenever the passenger picked a later day —
   * and, worse, would restrict today's clock while they edited tomorrow.
   *
   * So: only when the chosen day IS the floor's day does a time floor apply.
   * On any later day the whole clock is legitimately open.
   *
   * ⚠️ Applies to BOTH variants. The floor's *meaning* is the caller's: for
   * departure it is "not in the past", for arrival it is "not before the
   * departure" — which `validateForm` has always enforced at submit
   * (`errorArrivalTime`). Restricting only the departure card left the arrival
   * wheels offering a moment before the trip starts, and the owner hit exactly
   * that (2026-08-13: an arrival of 12.08 for a departure on 13.08).
   */
  const timeFloor = ((): Date | undefined => {
    if (!minimumDate) return undefined;
    const day = date ?? minimumDate;
    const sameDay =
      day.getFullYear() === minimumDate.getFullYear() &&
      day.getMonth() === minimumDate.getMonth() &&
      day.getDate() === minimumDate.getDate();
    return sameDay ? minimumDate : undefined;
  })();

  return (
    <View style={styles.wrapper}>
      {/*
        T-101 step 8c — the artboard's header row: a mono eyebrow on the left, the
        "Hoziroq" toggle on the right as a CHIP rather than the old flash-icon +
        checkbox. `Chip` carries the artboards' own selected/unselected treatment.
      */}
      <View style={styles.headerRow}>
        <Text style={styles.eyebrow}>
          {(isDeparture
            ? t("passengerOffers.departTitle")
            : t("passengerOffers.arriveTitle")
          ).toUpperCase()}
        </Text>

        {isDeparture && onUrgentChange && (
          <Chip
            label={t("passengerOffers.urgent")}
            selected={urgent}
            onPress={() => onUrgentChange(!urgent)}
          />
        )}
      </View>

      <View style={[styles.card, !!error && styles.cardError]}>
        <Text style={styles.summary}>{summary()}</Text>

        {/*
          T-101 step 8e — ONE row opens the sheet, replacing the three inline
          date/time/until buttons. The artboard has no inline controls here at all: the
          summary panel IS the control, and everything is picked in the sheet.
        */}
        {!controlsDisabled && (
          <TouchableOpacity
            style={styles.openRow}
            onPress={() => setSheetOpen(true)}
            activeOpacity={0.7}
            accessibilityRole="button"
          >
            <Text style={styles.openRowText}>
              {t("passengerOffers.pickDate")}
            </Text>
            <Text style={styles.openRowChevron}>›</Text>
          </TouchableOpacity>
        )}

        {!!error && <Text style={styles.errorText}>{error}</Text>}
      </View>

      {/*
        T-101 step 8e — the artboard's time sheet, replacing the two wheel modals.

        🔴 THREE THINGS THE OWNER REPORTED FROM A DEVICE, all correct:
        ① it did not look like the design — the design has DATE CARDS, not a wheel;
        ② the picker opened CENTRED (`AppModal` is `justifyContent: 'center'`);
        ③ it should rise from the bottom "like county/city" — i.e. like `GeoSheet`.
        All three are the same root cause: this used the dialog shell, not the sheet one.

        The shell is now the shared `BottomSheet`, extracted from `GeoSheet` so the two
        pickers cannot drift — and so the safe-area fix in it is not re-lost here.
      */}
      <TimeSheet
        visible={sheetOpen}
        title={
          isDeparture
            ? t("passengerOffers.departTitle")
            : t("passengerOffers.arriveTitle")
        }
        isDeparture={isDeparture}
        date={date}
        fromTime={fromTime ?? null}
        untilTime={untilTime}
        minimumDate={minimumDate}
        timeFloor={timeFloor}
        onApply={(next) => {
          // The sheet commits everything at once: nothing reaches the form until the
          // passenger confirms, which is the same contract the wheels had.
          onDateChange(next.date);
          if (isDeparture) onFromTimeChange?.(next.fromTime as Date);
          onUntilTimeChange(next.untilTime);
          setSheetOpen(false);
        }}
        onClose={() => setSheetOpen(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  /** Eyebrow on the left, the "Hoziroq" chip on the right (artboard header row). */
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  eyebrow: {
    ...theme.typography.eyebrow,
    color: theme.palette.text.tertiary,
  },
  /**
   * T-101 step 8c — the artboard's inner panel: the neutral GROUND, radius 13, pad 11.
   * It was a blue tint, a colour that appears nowhere on this screen in the design.
   */
  card: {
    borderRadius: 13,
    backgroundColor: theme.palette.ground,
    padding: 11,
  },
  cardError: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.palette.dangerBorder,
  },
  summary: {
    ...theme.typography.bodyStrong,
    lineHeight: 18,
    color: theme.palette.text.primary,
  },
  /** T-101 step 8e — the single row that opens the sheet. */
  openRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 11,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.palette.borders.control,
    backgroundColor: theme.palette.surface,
  },
  openRowText: {
    ...theme.typography.caption,
    color: theme.palette.text.primary,
  },
  openRowChevron: {
    fontSize: 15,
    color: theme.palette.text.chevron,
  },
  errorText: {
    marginTop: 6,
    ...theme.typography.helper,
    // A fill token on text is the defect class from DESIGN-TOKENS.md §2.10 — `danger`
    // is the fill, `dangerText` the ink. This read 1.9:1 before.
    color: theme.palette.dangerText,
  },
});

export default TimeWindowCard;
