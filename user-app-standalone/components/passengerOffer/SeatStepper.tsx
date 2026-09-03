/**
 * Seat Stepper ("old o'rindiq" / "orqa o'rindiq")
 *
 * One row of the Figma seat picker: the seats of that row drawn as boxes
 * (filled ones carry a male/female icon), then a − count + stepper.
 * "+" always asks which gender; "−" only asks when both are present.
 */

import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "../../hooks/useTranslation";
import { GenderPickSheet, type SeatGender } from "./GenderPickSheet";
import { theme } from "../../themes";

export interface SeatRowCounts {
  male: number;
  female: number;
}

interface SeatStepperProps {
  label: string;
  counts: SeatRowCounts;
  /** How many seats this row physically has (Figma: 1 front, 3 back). */
  capacity: number;
  disabled?: boolean;
  onChange: (counts: SeatRowCounts) => void;
}

export const SeatStepper: React.FC<SeatStepperProps> = ({
  label,
  counts,
  capacity,
  disabled = false,
  onChange,
}) => {
  const { t } = useTranslation();
  const [sheet, setSheet] = useState<"add" | "remove" | null>(null);

  const total = counts.male + counts.female;

  const handleAdd = () => {
    if (disabled || total >= capacity) return;
    setSheet("add");
  };

  const handleRemove = () => {
    if (disabled || total === 0) return;

    // Only ambiguous when the row holds both a man and a woman
    if (counts.male > 0 && counts.female > 0) {
      setSheet("remove");
      return;
    }
    onChange(
      counts.male > 0
        ? { ...counts, male: counts.male - 1 }
        : { ...counts, female: counts.female - 1 },
    );
  };

  /**
   * Tapping a seat. An OCCUPIED seat is unambiguous — that exact seat goes back, with
   * no sheet — while an empty one still has to ask which gender, exactly as "+" does.
   */
  const handleSeatPress = (gender: SeatGender | null) => {
    if (disabled) return;
    if (gender) {
      onChange({ ...counts, [gender]: Math.max(0, counts[gender] - 1) });
      return;
    }
    handleAdd();
  };

  const handlePick = (gender: SeatGender) => {
    if (sheet === "add") {
      onChange({ ...counts, [gender]: counts[gender] + 1 });
    } else if (counts[gender] > 0) {
      onChange({ ...counts, [gender]: counts[gender] - 1 });
    }
    setSheet(null);
  };

  // Occupied seats first (men, then women), the rest drawn empty
  const seats: (SeatGender | null)[] = [
    ...Array<SeatGender>(counts.male).fill("male"),
    ...Array<SeatGender>(counts.female).fill("female"),
    ...Array<null>(Math.max(0, capacity - total)).fill(null),
  ].slice(0, Math.max(capacity, total));

  return (
    <View style={[styles.row, disabled && styles.rowDisabled]}>
      <Text style={styles.label}>{label}</Text>

      {/*
        T-101 step 8c — the seats are TAPPABLE, as in `UserBuyurtma.dc.html`: an empty
        square asks which gender, a filled one gives the seat back. The +/− stepper is
        kept beside them deliberately — it is the only control that still works when the
        row is full, and it is the one already proven on a device.
      */}
      <View style={styles.seats}>
        {seats.map((gender, index) => (
          <TouchableOpacity
            key={`${label}-${index}`}
            style={[
              styles.seat,
              gender === "male" && styles.seatMale,
              gender === "female" && styles.seatFemale,
            ]}
            onPress={() => handleSeatPress(gender)}
            disabled={disabled}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={
              gender
                ? t("passengerOffers.genderRemoveTitle")
                : t("passengerOffers.genderAddTitle")
            }
          >
            {gender && (
              <Ionicons
                name={gender === "male" ? "man" : "woman"}
                size={18}
                color={
                  gender === "male"
                    ? theme.palette.maleInk
                    : theme.palette.femaleInk
                }
              />
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.stepper}>
        <TouchableOpacity
          style={[
            styles.stepperButton,
            (disabled || total === 0) && styles.stepperButtonOff,
          ]}
          onPress={handleRemove}
          disabled={disabled || total === 0}
          activeOpacity={0.7}
        >
          <Ionicons
            name="remove"
            size={18}
            color={theme.palette.text.primary}
          />
        </TouchableOpacity>

        <Text style={styles.count}>{total}</Text>

        <TouchableOpacity
          style={[
            styles.stepperButton,
            (disabled || total >= capacity) && styles.stepperButtonOff,
          ]}
          onPress={handleAdd}
          disabled={disabled || total >= capacity}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={18} color={theme.palette.text.primary} />
        </TouchableOpacity>
      </View>

      <GenderPickSheet
        visible={sheet !== null}
        title={
          sheet === "remove"
            ? t("passengerOffers.genderRemoveTitle")
            : t("passengerOffers.genderAddTitle")
        }
        available={
          sheet === "remove"
            ? ([
                counts.male > 0 && "male",
                counts.female > 0 && "female",
              ].filter(Boolean) as SeatGender[])
            : ["male", "female"]
        }
        onPick={handlePick}
        onClose={() => setSheet(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 52,
    gap: 8,
  },
  rowDisabled: {
    opacity: 0.45,
  },
  label: {
    flex: 1,
    fontSize: 15,
    color: theme.palette.text.primary,
  },
  seats: {
    flexDirection: "row",
    gap: 4,
  },
  // Artboard: 30x30, radius 8, a 2px border — the empty seat is the neutral control
  // border, not the green one, so an unfilled seat does not read as selected.
  seat: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: theme.palette.borders.emphasis,
    backgroundColor: theme.palette.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  seatMale: {
    backgroundColor: theme.palette.maleTint,
    borderColor: theme.palette.blueBorder,
  },
  seatFemale: {
    backgroundColor: theme.palette.femaleTint,
    borderColor: theme.palette.female,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  stepperButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: theme.palette.borders.strong,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperButtonOff: {
    opacity: 0.4,
  },
  count: {
    minWidth: 28,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    color: theme.palette.text.primary,
  },
});

export default SeatStepper;
