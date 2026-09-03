/**
 * Special Order Panel ("Maxsus buyurtma")
 *
 * Collapsed behind a bar on the order screen; expanding it reveals the price
 * list the passenger is willing to pay, and its own submit button.
 *
 * DATA ONLY — the "pullik" / "3000 so'm/birlik" wording comes straight from the
 * Figma, but nothing is charged anywhere. Real payments are T-006.
 */

import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "../../hooks/useTranslation";
import { CheckRow } from "./CheckRow";
import { theme } from "../../themes";

/** Prices are kept as typed strings ("150 000") and parsed on submit. */
export interface SpecialOrderValue {
  priceFront: string;
  priceBack: string;
  priceBackSalon: string;
  priceWholeSalon: string;
  reviewDriverOffers: boolean;
  fixedPrice: boolean;
  waitingFeePerMin: string;
}

export const emptySpecialOrder: SpecialOrderValue = {
  priceFront: "",
  priceBack: "",
  priceBackSalon: "",
  priceWholeSalon: "",
  reviewDriverOffers: false,
  fixedPrice: false,
  waitingFeePerMin: "",
};

/** Free waiting time is a fixed promise of the product, not an input. */
export const FREE_WAITING_MINUTES = 10;

/** "150000" → "150 000" */
export const formatMoney = (value: string): string =>
  value.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, " ");

/** "150 000" → 150000, or null when the field was left empty. */
export const parseMoney = (value: string): number | null => {
  const digits = value.replace(/\D/g, "");
  return digits ? Number(digits) : null;
};

export const hasAnySeatPrice = (value: SpecialOrderValue): boolean =>
  [
    value.priceFront,
    value.priceBack,
    value.priceBackSalon,
    value.priceWholeSalon,
  ].some((price) => parseMoney(price) !== null);

interface SpecialOrderPanelProps {
  expanded: boolean;
  onToggle: () => void;
  value: SpecialOrderValue;
  onChange: (value: SpecialOrderValue) => void;
  onSubmit: () => void;
  disabled?: boolean;
  error?: string;
}

export const SpecialOrderPanel: React.FC<SpecialOrderPanelProps> = ({
  expanded,
  onToggle,
  value,
  onChange,
  onSubmit,
  disabled = false,
  error,
}) => {
  const { t } = useTranslation();

  const priceRow = (
    label: string,
    key: "priceFront" | "priceBack" | "priceBackSalon" | "priceWholeSalon",
  ) => (
    <View style={styles.priceRow}>
      <Text style={styles.priceLabel}>{label}</Text>
      <TextInput
        style={styles.priceInput}
        value={value[key]}
        onChangeText={(text) =>
          onChange({ ...value, [key]: formatMoney(text) })
        }
        keyboardType="number-pad"
        placeholder="0"
        placeholderTextColor={theme.palette.text.tertiary}
        textAlign="center"
        maxLength={11}
      />
      <Text style={styles.priceCurrency}>
        {t("passengerOffers.currencySom")}
      </Text>
    </View>
  );

  return (
    <View>
      <TouchableOpacity
        style={styles.toggle}
        onPress={onToggle}
        activeOpacity={0.8}
      >
        <Text style={styles.toggleText}>
          {t("passengerOffers.specialOrderToggle")}
        </Text>
        <Ionicons
          name={expanded ? "chevron-down" : "chevron-forward"}
          size={20}
          color={theme.palette.maleInk}
        />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.panel}>
          <Text style={styles.title}>
            {t("passengerOffers.specialOrderTitle")}
          </Text>
          <Text style={styles.priceNotice}>
            {t("passengerOffers.specialOrderPrice")}
          </Text>
          <Text style={styles.intro}>
            {t("passengerOffers.specialOrderIntro")}
          </Text>

          <Text style={styles.pricesHeading}>
            {t("passengerOffers.specialOrderPrices")}
          </Text>

          {priceRow(t("passengerOffers.priceFront"), "priceFront")}
          {priceRow(t("passengerOffers.priceBack"), "priceBack")}
          {priceRow(t("passengerOffers.priceBackSalon"), "priceBackSalon")}
          {priceRow(t("passengerOffers.priceWholeSalon"), "priceWholeSalon")}

          <CheckRow
            label={t("passengerOffers.reviewDriverOffers")}
            checked={value.reviewDriverOffers}
            onPress={() =>
              onChange({
                ...value,
                reviewDriverOffers: !value.reviewDriverOffers,
              })
            }
          />
          <CheckRow
            label={t("passengerOffers.fixedPrice")}
            checked={value.fixedPrice}
            onPress={() =>
              onChange({ ...value, fixedPrice: !value.fixedPrice })
            }
          />

          <View style={styles.waitingRow}>
            <Text style={styles.priceLabel}>
              {t("passengerOffers.waiting")}
            </Text>
            <TextInput
              style={[styles.priceInput, styles.waitingInput]}
              value={value.waitingFeePerMin}
              onChangeText={(text) =>
                onChange({ ...value, waitingFeePerMin: formatMoney(text) })
              }
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={theme.palette.text.tertiary}
              textAlign="center"
              maxLength={9}
            />
            <Text style={styles.priceCurrency}>
              {t("passengerOffers.somPerMinute")}
            </Text>
          </View>

          <Text style={styles.freeWaiting}>
            {t("passengerOffers.freeWaiting")}
          </Text>

          {!!error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity
            style={[styles.submit, disabled && styles.submitDisabled]}
            onPress={onSubmit}
            disabled={disabled}
            activeOpacity={0.8}
          >
            <Text style={styles.submitText}>
              {t("passengerOffers.specialOrderToggle")}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

/**
 * T-101 step 8c — measured off `UserBuyurtma.dc.html`'s "Maxsus buyurtma" block.
 *
 * 🔴 THE WHOLE BLOCK IS PURPLE-ACCENTED, and the palette already had the token:
 * `paid` (#5B2E9D), used 6× on this artboard and present on **9 of the 33 boards**. The
 * panel had been a patchwork instead — a green border on mint, blue price inputs, an
 * amber waiting field and a RED price notice — four accent families in one card, none of
 * them the one the design assigns to paid flows.
 *
 * Toggle: 52px, radius 16, solid `paid`, white 15/800 label.
 * Panel: white, radius 20, pad 14, a `paid`-tinted hairline border.
 * Money reads in MONO, as every number in these artboards does.
 */
const styles = StyleSheet.create({
  toggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 52,
    paddingHorizontal: 16,
    marginHorizontal: 18,
    marginTop: 12,
    borderRadius: 16,
    backgroundColor: theme.palette.paid,
  },
  toggleText: {
    ...theme.typography.button,
    color: theme.palette.text.onAccent,
    letterSpacing: -0.15,
  },
  panel: {
    marginHorizontal: 18,
    marginTop: 9,
    padding: 14,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    // The artboard's rgba(91,46,157,.22) — the paid accent at low opacity.
    borderColor: theme.palette.paidBorder,
    backgroundColor: theme.palette.surface,
    gap: 8,
  },
  title: {
    ...theme.typography.cardTitle,
    color: theme.palette.text.primary,
  },
  /** "Maxsus buyurtma narxi 3 000 so'm/birlik" — the artboard prints this in `paid`. */
  priceNotice: {
    ...theme.typography.bodyStrong,
    color: theme.palette.paid,
  },
  intro: {
    ...theme.typography.secondary,
    color: theme.palette.text.secondary,
  },
  pricesHeading: {
    ...theme.typography.eyebrow,
    color: theme.palette.text.tertiary,
    marginTop: 6,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  priceLabel: {
    flex: 1,
    ...theme.typography.caption,
    color: theme.palette.text.primary,
  },
  priceInput: {
    width: 120,
    minHeight: 44,
    paddingHorizontal: 10,
    borderRadius: 11,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.palette.borders.control,
    backgroundColor: theme.palette.ground,
    // Every number in these artboards is mono, and a price column only lines up in it.
    ...theme.typography.monoPrice,
    color: theme.palette.text.primary,
    textAlign: "right",
  },
  priceCurrency: {
    width: 78,
    ...theme.typography.monoMeta,
    color: theme.palette.text.tertiary,
  },
  waitingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  // The waiting fee is the same kind of input as the prices; it was amber for no reason
  // the artboards support.
  waitingInput: {},
  freeWaiting: {
    ...theme.typography.helper,
    color: theme.palette.text.tertiary,
  },
  errorText: {
    ...theme.typography.helper,
    // `danger` is the FILL; text takes `dangerText` (DESIGN-TOKENS.md §2.10).
    color: theme.palette.dangerText,
  },
  submit: {
    marginTop: 8,
    height: 52,
    borderRadius: 16,
    backgroundColor: theme.palette.paid,
    alignItems: "center",
    justifyContent: "center",
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitText: {
    ...theme.typography.button,
    color: theme.palette.text.onAccent,
  },
});

export default SpecialOrderPanel;
