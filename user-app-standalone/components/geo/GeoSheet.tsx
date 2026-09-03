/**
 * GeoSheet — the artboards' address picker. T-101, 2026-08-30.
 *
 * ONE sheet that walks its own levels, with a breadcrumb, instead of the caller
 * opening a flat list per level and re-implementing the cascade.
 *
 * 🔴 WHY THIS EXISTS: the cascade was implemented SEVEN times across the two apps —
 * `SearchOffersScreen`, `LocationCard`, `OfferWizardScreen`, `SearchPassengerOffersScreen`,
 * `DriverPersonalInfoScreen`, `DriverVehicleScreen`, and two differently-named modals
 * (`GeoSelectModal` here, `GeoPickerModal` in the driver app). Each kept its own
 * "clear the child when the parent changes" logic, which is exactly the rule that is
 * easy to get subtly wrong in one copy. The owner noticed the resulting inconsistency
 * on a device before this component existed.
 *
 * LEVELS — the owner's adm vocabulary (docs/PLAN-T101-SCOPES.md):
 *   adm0 country   GeoCountry
 *   adm1 viloyat   GeoProvince
 *   adm2 tuman     GeoCityDistrict
 *   adm3 QFY       GeoSettlement    <- decided 2026-08-30; NOT GeoNeighborhood,
 *                                     which is a sibling (mahalla), not a depth.
 *
 * `startLevel` lets a caller skip levels the scope already fixes — *Viloyat ichi*
 * opens at adm2 with the region pre-chosen, so the passenger does not pick it twice.
 * That is the whole reason the artboards have four `UserBuyurtma*` files.
 *
 * ⚠️ The sheet returns the FULL PATH, not just the leaf. Callers need the ancestors to
 * display "Farg'ona viloyat, Farg'ona shahar" and, once T-102 lands, to send the right
 * `*_id` per level. Returning only the leaf would throw that away.
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../../themes";
import { BottomSheet } from "../BottomSheet";
import {
  fetchGeoCountries,
  fetchGeoProvinces,
  fetchGeoCityDistricts,
  fetchGeoSettlements,
  type GeoOption,
} from "../../api/geo";

export type GeoLevel = "country" | "province" | "district" | "settlement";

/** The chosen path. Levels below the one the user stopped at are undefined. */
export interface GeoPath {
  country?: GeoOption;
  province?: GeoOption;
  district?: GeoOption;
  settlement?: GeoOption;
}

const ORDER: GeoLevel[] = ["country", "province", "district", "settlement"];

interface GeoSheetProps {
  visible: boolean;
  /** Where to open. Anything above it must be supplied in `initialPath`. */
  startLevel?: GeoLevel;
  /** The deepest level to offer. Stops here and confirms. */
  endLevel?: GeoLevel;
  /** Pre-chosen ancestors, e.g. the region fixed by a "Viloyat ichi" scope. */
  initialPath?: GeoPath;
  title: string;
  onDone: (path: GeoPath) => void;
  onClose: () => void;
}

export const GeoSheet: React.FC<GeoSheetProps> = ({
  visible,
  startLevel = "country",
  endLevel = "district",
  initialPath,
  title,
  onDone,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const [level, setLevel] = useState<GeoLevel>(startLevel);
  const [path, setPath] = useState<GeoPath>(initialPath ?? {});
  const [options, setOptions] = useState<GeoOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  // Re-arm on each open so a sheet closed half-way does not reopen mid-cascade.
  useEffect(() => {
    if (visible) {
      setLevel(startLevel);
      setPath(initialPath ?? {});
      setQuery("");
      setError(null);
    }
  }, [visible, startLevel, initialPath]);

  const load = useCallback(async (lvl: GeoLevel, p: GeoPath) => {
    setLoading(true);
    setError(null);
    try {
      let rows: GeoOption[] = [];
      if (lvl === "country") rows = await fetchGeoCountries();
      else if (lvl === "province" && p.country)
        rows = await fetchGeoProvinces(p.country.id);
      else if (lvl === "district" && p.province)
        rows = await fetchGeoCityDistricts(p.province.id);
      else if (lvl === "settlement" && p.district)
        rows = await fetchGeoSettlements(p.district.id);
      setOptions(rows);
    } catch (e) {
      // An empty list and a failed request look identical to a user, and the
      // difference decides whether retrying is worth anything.
      setOptions([]);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) void load(level, path);
  }, [visible, level, path, load]);

  const pick = (option: GeoOption) => {
    const next: GeoPath = { ...path, [level]: option };

    /*
     * Clearing the descendants is the rule every hand-rolled copy had to remember.
     * Choosing a different region must drop the district beneath it, or the form
     * silently keeps a district that no longer belongs to the chosen region.
     */
    const from = ORDER.indexOf(level);
    for (const deeper of ORDER.slice(from + 1)) delete next[deeper];

    setPath(next);
    setQuery("");

    const nextLevel = ORDER[from + 1];
    if (level === endLevel || !nextLevel) {
      onDone(next);
      return;
    }
    setLevel(nextLevel);
  };

  const back = () => {
    const i = ORDER.indexOf(level);
    if (i <= ORDER.indexOf(startLevel)) {
      onClose();
      return;
    }
    setQuery("");
    setLevel(ORDER[i - 1]);
  };

  /** "Farg'ona viloyat, Farg'ona shahar" — the choices made so far. */
  const crumb = ORDER.slice(0, ORDER.indexOf(level))
    .map((l) => path[l]?.name)
    .filter(Boolean)
    .join(", ");

  const filtered = query
    ? options.filter((o) => o.name.toLowerCase().includes(query.toLowerCase()))
    : options;

  return (
    /*
      T-101 step 8e — the sheet chrome moved to the shared `BottomSheet` when the time
      picker became its second user. The safe-area padding that used to live here (the
      system nav bar covering the last row, found on an S24 Ultra) went with it, so
      neither sheet can lose it independently.
    */
    <BottomSheet
      visible={visible}
      title={title}
      crumb={crumb}
      onBack={back}
      onClose={onClose}
      contentStyle={styles.content}
    >
      <TextInput
        style={styles.search}
        value={query}
        onChangeText={setQuery}
        placeholder="Qidirish"
        placeholderTextColor={theme.palette.text.tertiary}
        autoCorrect={false}
      />

      {loading ? (
        <ActivityIndicator style={styles.state} color={theme.palette.action} />
      ) : error ? (
        <View style={styles.state}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable
            onPress={() => void load(level, path)}
            accessibilityRole="button"
          >
            <Text style={styles.retry}>Qayta urinish</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[
            styles.list,
            // The last row must be able to scroll ABOVE the nav bar, not just
            // stop behind it — padding on the sheet alone clips it.
            { paddingBottom: 18 + insets.bottom },
          ]}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <Text style={styles.empty}>
              {query ? "Topilmadi" : "Ro'yxat bo'sh"}
            </Text>
          }
          renderItem={({ item }) => {
            const selected = path[level]?.id === item.id;
            return (
              <Pressable
                onPress={() => pick(item)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={({ pressed }) => [
                  styles.row,
                  selected && styles.rowSelected,
                  pressed && { opacity: theme.states.pressedOpacity },
                ]}
              >
                <Text
                  style={[styles.rowLabel, selected && styles.rowLabelSelected]}
                  numberOfLines={2}
                >
                  {item.name}
                </Text>
                <Text style={styles.rowChevron}>{selected ? "✓" : "›"}</Text>
              </Pressable>
            );
          }}
        />
      )}
    </BottomSheet>
  );
};

/*
  T-101 step 8e — the shell styles (overlay, scrim, sheet, grabber, header, title,
  crumb) moved to `BottomSheet`.

  ⚠️ ONE DELIBERATE CHANGE CAME WITH THE MOVE: this sheet centred its header text
  (`headerText: { alignItems: 'center' }`). The artboard's header block is a plain
  left-aligned column, so the shared shell follows the artboard and this sheet's title
  is now left-aligned like the time sheet's. Checked against `UserBuyurtma.dc.html`
  rather than preserved by habit.
*/
const styles = StyleSheet.create({
  /** The list area below the shared header. */
  content: { paddingHorizontal: 0, paddingTop: 0, paddingBottom: 0 },

  search: {
    marginHorizontal: 18,
    marginTop: 12,
    minHeight: theme.sizes.controlLg,
    paddingHorizontal: 14,
    borderRadius: theme.borderRadius.field,
    backgroundColor: theme.palette.surfaceInput,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.palette.borders.control,
    ...theme.typography.body,
    color: theme.palette.text.primary,
  },

  list: { padding: 18, gap: 6 },
  row: {
    minHeight: theme.sizes.controlLg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: theme.borderRadius.field,
    backgroundColor: theme.palette.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.palette.borders.default,
  },
  rowSelected: {
    backgroundColor: theme.palette.successTint,
    borderColor: theme.palette.brand,
  },
  rowLabel: {
    ...theme.typography.rowLabel,
    color: theme.palette.text.primary,
    flex: 1,
  },
  rowLabelSelected: { color: theme.palette.actionPressed },
  rowChevron: {
    ...theme.typography.cardTitle,
    color: theme.palette.text.chevron,
  },

  state: { paddingVertical: 40, alignItems: "center", gap: 10 },
  errorText: { ...theme.typography.secondary, color: theme.palette.dangerText },
  retry: { ...theme.typography.chipLabel, color: theme.palette.action },
  empty: {
    ...theme.typography.secondary,
    color: theme.palette.text.tertiary,
    textAlign: "center",
    paddingVertical: 32,
  },
});
