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
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
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
  error,
}) => {
  const { t } = useTranslation();
  const [picker, setPicker] = useState<PickerTarget | null>(null);

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

  const handlePicked = (event: any, picked?: Date) => {
    const target = picker;
    if (Platform.OS === "android" || event?.type === "dismissed") {
      setPicker(null);
    }
    if (event?.type !== "set" || !picked || !target) return;

    if (target === "date") onDateChange(picked);
    else if (target === "from") onFromTimeChange?.(picked);
    else onUntilTimeChange(picked);

    if (Platform.OS === "ios") setPicker(null);
  };

  const pickerValue = (): Date => {
    if (picker === "date") return date ?? new Date();
    if (picker === "from") return fromTime ?? new Date();
    return untilTime ?? new Date();
  };

  const controlsDisabled = isDeparture && urgent;

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
              onPress={() => setPicker("date")}
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
                onPress={() => setPicker("from")}
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
              onPress={() => setPicker("until")}
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

      {picker !== null && (
        <DateTimePicker
          value={pickerValue()}
          mode={picker === "date" ? "date" : "time"}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          is24Hour
          minimumDate={picker === "date" ? new Date() : undefined}
          onChange={handlePicked}
        />
      )}
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
