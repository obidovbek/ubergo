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
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { DateWheelModal } from "../DateWheelModal";
import { TimeWheelModal } from "../TimeWheelModal";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "../../hooks/useTranslation";
import { CheckRow } from "./CheckRow";

const pad = (value: number): string => String(value).padStart(2, "0");

export const formatDateNumeric = (date: Date): string =>
  `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;

export const formatTime = (date: Date): string =>
  `${pad(date.getHours())}:${pad(date.getMinutes())}`;

/** Combine a picked day with a picked clock time into one Date. */
export const combineDateTime = (date: Date, time: Date): Date => {
  const combined = new Date(date);
  combined.setHours(time.getHours(), time.getMinutes(), 0, 0);
  return combined;
};

type PickerTarget = "date" | "from" | "until";

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
  const [picker, setPicker] = useState<PickerTarget | null>(null);
  /** The value the open wheel is editing; committed only on Confirm. */
  const [draft, setDraft] = useState<Date>(new Date());

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

  /**
   * ⚠️ The fallback for an unset time is the FLOOR, not `new Date()`. Opening
   * the wheel with "now" while the floor sits 31 minutes ahead would highlight
   * a row that is no longer in the list, so nothing would look selected.
   */
  const valueFor = (target: PickerTarget): Date => {
    const fallback = minimumDate ?? new Date();
    if (target === "date") return date ?? fallback;
    if (target === "from") return fromTime ?? fallback;
    return untilTime ?? fromTime ?? fallback;
  };

  /**
   * The wheels are controlled: `draft` holds the in-progress pick and nothing
   * reaches the form until Confirm. That is the opposite of the OS picker this
   * replaced, which fired `onChange` per spin on iOS — so cancelling used to be
   * impossible once the user had scrolled.
   */
  const openPicker = (target: PickerTarget) => {
    setDraft(valueFor(target));
    setPicker(target);
  };

  const closePicker = () => setPicker(null);

  const commitDraft = () => {
    const target = picker;
    setPicker(null);
    if (!target) return;

    if (target === "date") onDateChange(draft);
    else if (target === "from") onFromTimeChange?.(draft);
    else onUntilTimeChange(draft);
  };

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
   * 🔴 Departure only. The arrival card is a "must arrive by" time, bounded by
   * the departure (`errorArrivalTime`) rather than by the clock; putting a
   * floor on it would be a new rule invented on the way past.
   */
  const timeFloor = ((): Date | undefined => {
    if (!isDeparture || !minimumDate) return undefined;
    const day = date ?? minimumDate;
    const sameDay =
      day.getFullYear() === minimumDate.getFullYear() &&
      day.getMonth() === minimumDate.getMonth() &&
      day.getDate() === minimumDate.getDate();
    return sameDay ? minimumDate : undefined;
  })();

  return (
    <View style={styles.wrapper}>
      {isDeparture && onUrgentChange && (
        <View style={styles.urgentRow}>
          <Ionicons name="flash" size={22} color="#111827" />
          <CheckRow
            label={t("passengerOffers.urgent")}
            checked={urgent}
            onPress={() => onUrgentChange(!urgent)}
            style={styles.urgentCheck}
          />
        </View>
      )}

      <View style={[styles.card, !!error && styles.cardError]}>
        {!isDeparture && <View style={styles.arrivalMarker} />}

        <Text style={styles.summary}>{summary()}</Text>

        {!controlsDisabled && (
          <View style={styles.controls}>
            <TouchableOpacity
              style={styles.control}
              onPress={() => openPicker("date")}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar-outline" size={16} color="#4B5563" />
              <Text style={styles.controlText}>
                {date ? formatDateNumeric(date) : t("passengerOffers.pickDate")}
              </Text>
            </TouchableOpacity>

            {isDeparture && (
              <TouchableOpacity
                style={styles.control}
                onPress={() => openPicker("from")}
                activeOpacity={0.7}
              >
                <Ionicons name="time-outline" size={16} color="#4B5563" />
                <Text style={styles.controlText}>
                  {fromTime
                    ? formatTime(fromTime)
                    : t("passengerOffers.pickTimeFrom")}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.control}
              onPress={() => openPicker("until")}
              activeOpacity={0.7}
            >
              <Ionicons name="time-outline" size={16} color="#4B5563" />
              <Text style={styles.controlText}>
                {untilTime
                  ? formatTime(untilTime)
                  : t("passengerOffers.pickTimeUntil")}
              </Text>
            </TouchableOpacity>

            {!!untilTime && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => onUntilTimeChange(null)}
                activeOpacity={0.7}
                hitSlop={8}
              >
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {!!error && <Text style={styles.errorText}>{error}</Text>}
      </View>

      {/* T-057 — the app's own wheels, not the stock OS dialog. */}
      <DateWheelModal
        visible={picker === "date"}
        value={draft}
        onChange={setDraft}
        title={t("passengerOffers.pickDate")}
        // A trip is not a birthday: offer this year and the next, nothing else.
        earliestYear={new Date().getFullYear()}
        latestYear={new Date().getFullYear() + 1}
        /*
          T-069 — a departure cannot be in the past.

          🔴 `validateForm` already REFUSES a past time at submit
          (`CreatePassengerOfferScreen:377`, 31-minute minimum, message
          "Vaqt kamida 30 daqiqadan keyin bo'lishi kerak"). The defect the owner
          hit is that the wheel still OFFERED those dates, so the refusal only
          arrived after filling the whole form. The driver app's wizard has
          restricted its own wheels all along; this brings the passenger side
          into line. Submit stays the real guard — this only stops the user
          choosing something that is going to be rejected.
        */
        minimumDate={minimumDate ?? new Date()}
        onConfirm={commitDraft}
        onCancel={closePicker}
      />

      <TimeWheelModal
        visible={picker === "from" || picker === "until"}
        value={draft}
        onChange={setDraft}
        title={
          picker === "until"
            ? t("passengerOffers.pickTimeUntil")
            : t("passengerOffers.pickTimeFrom")
        }
        // T-069 — quarter-hours only (owner, 2026-08-12). A departure window
        // does not need per-minute precision, and 4 rows beat 12.
        minuteStep={15}
        /*
          The time floor, so the hours already gone are not offered on today.

          ⚠️ It is the minimum instant moved onto the DAY BEING EDITED. The
          wheel compares by calendar day, and `draft` for a from/until pick
          carries the day the user chose above — so passing the raw minimum
          would leave today unrestricted whenever `draft` had drifted to
          another date.

          🔴 Departure only. The arrival card is a "must arrive by" time and is
          bounded by the departure (`errorArrivalTime`), not by the clock — a
          floor here would be a different rule invented on the way past.
        */
        minimumDate={timeFloor}
        onConfirm={commitDraft}
        onCancel={closePicker}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 8,
  },
  urgentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  urgentCheck: {
    flex: 1,
  },
  card: {
    borderWidth: 1,
    borderColor: "#C7D2FE",
    borderRadius: 10,
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  cardError: {
    borderColor: "#EF4444",
  },
  arrivalMarker: {
    position: "absolute",
    left: -18,
    top: 14,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#22C55E",
  },
  summary: {
    fontSize: 15,
    lineHeight: 21,
    color: "#111827",
  },
  controls: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginTop: 10,
    gap: 8,
  },
  control: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  controlText: {
    fontSize: 14,
    color: "#111827",
  },
  clearButton: {
    paddingHorizontal: 4,
  },
  errorText: {
    marginTop: 6,
    fontSize: 12,
    color: "#EF4444",
  },
});

export default TimeWindowCard;
