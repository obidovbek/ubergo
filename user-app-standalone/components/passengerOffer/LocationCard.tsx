/**
 * Location row ("Qayerdan" / "Qayerga") — the route block of the order screen.
 *
 * T-101 step 8c — rebuilt onto the shared `GeoSheet`, the same picker the passenger
 * SEARCH screen uses. Before this it was the eighth hand-rolled copy of the geo cascade
 * (four stacked dropdowns per direction) and the last one left in the user app.
 *
 * 🔴 **THE MAHALLA (neighborhood) IS GONE — owner decision 2026-09-01, taken on the
 * design's own logic.** Four independent lines of evidence agreed:
 *   ① `UserBuyurtma.dc.html` mentions mahalla/MFY **zero** times; its adm3 step is
 *      labelled "mavze/QFY", i.e. the settlement.
 *   ② `GeoSheet`'s own level list — written for these artboards — records mahalla as
 *      "a sibling, not a depth".
 *   ③ It has **no id column** (T-029), so `hydrateLocation` could never restore it:
 *      opening an order for edit already dropped it from the form.
 *   ④ Nothing can match on it, now or after T-102.
 * It was the ONLY reason this component could not use `GeoSheet` (see the trap note in
 * docs/PLAN.md: "picks settlement AND neighborhood as siblings — a branch").
 *
 * ⚠️ `LocationValue` KEEPS its `neighborhood` field, set to null and never written.
 * `buildLocationText` still reads it. That is deliberate: orders created before today
 * have the mahalla inside their stored `from_text`/`to_text`, and `handleSubmit`'s guard
 * only resends that text when the passenger re-picks the location. Deleting the field
 * would rewrite those strings and lose real addresses.
 *
 * The country is fixed to Uzbekistan by the screen and never shown (OR-004), so the
 * sheet opens at province.
 */

import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "../../hooks/useTranslation";
import type { GeoOption } from "../../api/geo";
import { GeoSheet, type GeoPath } from "../geo/GeoSheet";
import { theme } from "../../themes";

export interface LocationValue {
  province: GeoOption | null;
  cityDistrict: GeoOption | null;
  settlement: GeoOption | null;
  /**
   * @deprecated Mahalla. No longer selectable (see the header). Kept so the text of
   * orders created before 2026-09-01 still composes correctly.
   */
  neighborhood: GeoOption | null;
  landmark: string;
}

export const emptyLocation: LocationValue = {
  province: null,
  cityDistrict: null,
  settlement: null,
  neighborhood: null,
  landmark: "",
};

/**
 * "Farg'ona viloyat, Farg'ona tumani, Chimyon QFY/ Natarius yonida"
 * Country is intentionally left out (OR-004).
 *
 * ⚠️ UNCHANGED by step 8c, including the `neighborhood` term — this is what the API
 * stores, and a hydrated legacy order can still carry one.
 */
export const buildLocationText = (value: LocationValue): string => {
  const parts = [
    value.province?.name,
    value.cityDistrict?.name,
    value.settlement?.name,
    value.neighborhood?.name,
  ].filter((part): part is string => !!part);

  const landmark = value.landmark.trim();
  if (parts.length === 0) return landmark;

  return landmark ? `${parts.join(", ")}/ ${landmark}` : parts.join(", ");
};

interface LocationCardProps {
  label: string;
  /** Uzbekistan, resolved once by the screen. */
  countryId: number | null;
  value: LocationValue;
  onChange: (value: LocationValue) => void;
  /** Marker style: the origin is a hollow ring, the destination a filled one. */
  accent: "start" | "end";
  error?: string;
}

export const LocationCard: React.FC<LocationCardProps> = ({
  label,
  countryId,
  value,
  onChange,
  accent,
  error,
}) => {
  const { t } = useTranslation();
  const [sheetOpen, setSheetOpen] = useState(false);

  /**
   * `GeoSheet` speaks in `GeoPath`, this screen in `LocationValue`. The two are the same
   * levels under different names, so the mapping is a rename — except `country`, which
   * the sheet needs as an ancestor but this screen never displays (OR-004).
   */
  const toPath = (): GeoPath => ({
    country: countryId ? ({ id: countryId, name: "" } as GeoOption) : undefined,
    province: value.province ?? undefined,
    district: value.cityDistrict ?? undefined,
    settlement: value.settlement ?? undefined,
  });

  const handleDone = (path: GeoPath) => {
    onChange({
      ...value,
      province: path.province ?? null,
      cityDistrict: path.district ?? null,
      settlement: path.settlement ?? null,
      // Re-picking the location retires any legacy mahalla: the address the passenger
      // just chose is the address, and keeping the old one would append a mahalla from
      // a district they may no longer be in.
      neighborhood: null,
    });
    setSheetOpen(false);
  };

  // Line 1 is the most specific place chosen, line 2 the path above it — the artboard's
  // two-line row. `buildLocationText` still builds the single string the API stores;
  // this is a display split only and the two must not be conflated.
  const chosen = value.settlement ?? value.cityDistrict ?? value.province;
  const line1 = chosen?.name ?? "";
  const line2 = [
    value.province?.name,
    value.cityDistrict?.name,
    value.settlement?.name,
  ]
    .filter((part): part is string => !!part && part !== line1)
    .join(", ");

  return (
    <View>
      <TouchableOpacity
        style={[styles.row, !!error && styles.rowError]}
        onPress={() => setSheetOpen(true)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <View style={styles.markerColumn}>
          <View style={[styles.marker, accent === "end" && styles.markerEnd]}>
            {accent === "end" && <View style={styles.markerCore} />}
          </View>
        </View>

        <View style={styles.rowBody}>
          <Text style={styles.eyebrow}>{label.toUpperCase()}</Text>
          <Text
            style={[styles.line1, !line1 && styles.line1Placeholder]}
            numberOfLines={2}
          >
            {line1 || t("passengerOffers.selectProvince")}
          </Text>
          {!!line2 && (
            <Text style={styles.line2} numberOfLines={2}>
              {line2}
            </Text>
          )}
        </View>

        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>

      {!!error && <Text style={styles.errorText}>{error}</Text>}

      {/*
        The landmark ("mo'ljal") — step 4/4 of the artboard's sheet, kept on the row
        because it is free text rather than a list and the passenger often edits it after
        the address is settled. Only offered once there is an address to qualify.
      */}
      {!!value.cityDistrict && (
        <View style={styles.landmarkRow}>
          <TextInput
            style={styles.landmarkInput}
            value={value.landmark}
            onChangeText={(text) => onChange({ ...value, landmark: text })}
            placeholder={t("passengerOffers.landmarkPlaceholder")}
            placeholderTextColor={theme.palette.text.tertiary}
            // The stored column is 255; without this the refusal came from the server.
            maxLength={255}
          />
        </View>
      )}

      {/*
        `endLevel="settlement"` is adm3 — one level deeper than the search screen, whose
        own comment says "the order screen goes to adm3". `startLevel="province"` skips
        the country, which is fixed (OR-004).
      */}
      <GeoSheet
        visible={sheetOpen}
        title={label}
        startLevel="province"
        endLevel="settlement"
        initialPath={toPath()}
        onDone={handleDone}
        onClose={() => setSheetOpen(false)}
      />
    </View>
  );
};

/**
 * Measured off `UserBuyurtma.dc.html`'s route card: row padding 12/10/12/12 · radius 15 ·
 * origin marker an 11px ring with a 3px stroke, destination a 20px ring with an 8px core ·
 * eyebrow mono uppercase · line 1 14.5/700 · line 2 12.5/500. The card itself is the
 * screen's `routeCard`; this component is one row inside it.
 */
const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingTop: 12,
    paddingRight: 10,
    paddingBottom: 12,
    paddingLeft: 12,
    borderRadius: 15,
  },
  rowError: {
    backgroundColor: theme.palette.dangerTint,
  },
  markerColumn: {
    width: 22,
    alignItems: "center",
    paddingTop: 4,
  },
  marker: {
    width: 11,
    height: 11,
    borderRadius: 99,
    borderWidth: 3,
    borderColor: theme.palette.action,
    alignItems: "center",
    justifyContent: "center",
  },
  markerEnd: {
    width: 20,
    height: 20,
  },
  markerCore: {
    width: 8,
    height: 8,
    borderRadius: 99,
    backgroundColor: theme.palette.action,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  eyebrow: {
    ...theme.typography.eyebrow,
    fontSize: 11,
    color: theme.palette.text.tertiary,
  },
  line1: {
    ...theme.typography.placeLine,
    color: theme.palette.text.primary,
    lineHeight: 20,
  },
  line1Placeholder: {
    color: theme.palette.text.tertiary,
  },
  line2: {
    ...theme.typography.secondary,
    color: theme.palette.text.secondary,
  },
  chevron: {
    fontSize: 15,
    color: theme.palette.text.chevron,
    paddingTop: 8,
  },
  landmarkRow: {
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  landmarkInput: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 11,
    backgroundColor: theme.palette.ground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.palette.borders.control,
    ...theme.typography.caption,
    color: theme.palette.text.primary,
  },
  errorText: {
    ...theme.typography.helper,
    color: theme.palette.dangerText,
    paddingHorizontal: 12,
    paddingBottom: 6,
  },
});

export default LocationCard;
