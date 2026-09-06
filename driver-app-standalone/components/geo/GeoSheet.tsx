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

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../themes';
import {
  fetchGeoCountries,
  fetchGeoProvinces,
  fetchGeoCityDistricts,
  fetchGeoSettlements,
  type GeoOption,
} from '../../api/geo';

export type GeoLevel = 'country' | 'province' | 'district' | 'settlement';

/** The chosen path. Levels below the one the user stopped at are undefined. */
export interface GeoPath {
  country?: GeoOption;
  province?: GeoOption;
  district?: GeoOption;
  settlement?: GeoOption;
  /**
   * Every district picked, when the caller opted into `multiSelectAt="district"`.
   *
   * ⚠️ `district` still holds the FIRST of them, so a caller that never asked for
   * multi-select reads exactly what it always read. That is deliberate: the search
   * screen predates this and must not change behaviour.
   */
  districts?: GeoOption[];
}

const ORDER: GeoLevel[] = ['country', 'province', 'district', 'settlement'];

interface GeoSheetProps {
  visible: boolean;
  /** Where to open. Anything above it must be supplied in `initialPath`. */
  startLevel?: GeoLevel;
  /** The deepest level to offer. Stops here and confirms. */
  endLevel?: GeoLevel;
  /** Pre-chosen ancestors, e.g. the region fixed by a "Viloyat ichi" scope. */
  initialPath?: GeoPath;
  /**
   * Let the user pick SEVERAL at this level instead of one — T-101 step 16c.
   *
   * 🔴 The artboard's place sheet does exactly this at adm2 (`toggleAdm2`,
   * `tmpAdm2s`, a "tanlangan ✓" row), and the offer wizard has always let a driver
   * name several tumans for one endpoint. Without it, adopting this sheet in the
   * wizard would DELETE a feature drivers already have.
   *
   * Rows toggle instead of advancing, and the sheet confirms on the footer button.
   */
  multiSelectAt?: GeoLevel;
  title: string;
  onDone: (path: GeoPath) => void;
  onClose: () => void;
}

export const GeoSheet: React.FC<GeoSheetProps> = ({
  visible,
  startLevel = 'country',
  endLevel = 'district',
  initialPath,
  multiSelectAt,
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
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<GeoOption[]>(initialPath?.districts ?? []);

  // Re-arm on each open so a sheet closed half-way does not reopen mid-cascade.
  useEffect(() => {
    if (visible) {
      setLevel(startLevel);
      setPath(initialPath ?? {});
      setPicked(initialPath?.districts ?? []);
      setQuery('');
      setError(null);
    }
  }, [visible, startLevel, initialPath]);

  const load = useCallback(
    async (lvl: GeoLevel, p: GeoPath) => {
      setLoading(true);
      setError(null);
      try {
        let rows: GeoOption[] = [];
        if (lvl === 'country') rows = await fetchGeoCountries();
        else if (lvl === 'province' && p.country) rows = await fetchGeoProvinces(p.country.id);
        else if (lvl === 'district' && p.province) rows = await fetchGeoCityDistricts(p.province.id);
        else if (lvl === 'settlement' && p.district) rows = await fetchGeoSettlements(p.district.id);
        setOptions(rows);
      } catch (e) {
        // An empty list and a failed request look identical to a user, and the
        // difference decides whether retrying is worth anything.
        setOptions([]);
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (visible) void load(level, path);
  }, [visible, level, path, load]);

  const pick = (option: GeoOption) => {
    /*
     * The multi-select level toggles and stays put — the cascade does NOT advance,
     * because the user is still building one answer. Confirming is the footer's job.
     */
    if (level === multiSelectAt) {
      setPicked((current) =>
        current.some((o) => o.id === option.id)
          ? current.filter((o) => o.id !== option.id)
          : [...current, option],
      );
      return;
    }

    const next: GeoPath = { ...path, [level]: option };

    /*
     * Clearing the descendants is the rule every hand-rolled copy had to remember.
     * Choosing a different region must drop the district beneath it, or the form
     * silently keeps a district that no longer belongs to the chosen region.
     */
    const from = ORDER.indexOf(level);
    for (const deeper of ORDER.slice(from + 1)) delete next[deeper];

    // 🔴 The same rule, for the multi-selection: districts chosen under the OLD
    // region do not belong under the new one. Forgetting this is how a driver ends
    // up with an offer listing tumans from a province they no longer selected.
    if (multiSelectAt && ORDER.indexOf(multiSelectAt) > from) {
      setPicked([]);
      delete next.districts;
    }

    setPath(next);
    setQuery('');

    const nextLevel = ORDER[from + 1];
    if (level === endLevel || !nextLevel) {
      onDone(next);
      return;
    }
    setLevel(nextLevel);
  };

  /** The footer's "Tayyor" — only reachable at the multi-select level. */
  const confirmPicked = () => {
    if (picked.length === 0) return;
    // `district` keeps the first, so single-select callers read what they always read.
    onDone({ ...path, [multiSelectAt as GeoLevel]: picked[0], districts: picked });
  };

  const back = () => {
    const i = ORDER.indexOf(level);
    if (i <= ORDER.indexOf(startLevel)) {
      onClose();
      return;
    }
    setQuery('');
    setLevel(ORDER[i - 1]);
  };

  /** "Farg'ona viloyat, Farg'ona shahar" — the choices made so far. */
  const crumb = ORDER.slice(0, ORDER.indexOf(level))
    .map((l) => path[l]?.name)
    .filter(Boolean)
    .join(', ');

  const filtered = query
    ? options.filter((o) => o.name.toLowerCase().includes(query.toLowerCase()))
    : options;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Yopish" />

        {/*
          🔴 The system navigation bar sits OVER the sheet. Without this the last row
          of the list is half-hidden behind the home/back buttons — reported on an
          S24 Ultra, where the gesture/button bar is ~48px tall.

          `Modal` renders outside the app's SafeAreaProvider layout, so the inset has
          to be applied here by hand; nothing upstream does it. A fixed padding cannot
          work — the bar is 0 on some devices, ~24px with gestures and ~48px with
          three-button navigation.
        */}
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          <View style={styles.grabber} />

          <View style={styles.header}>
            <Pressable
              onPress={back}
              style={styles.headerButton}
              accessibilityRole="button"
              accessibilityLabel="Ortga"
            >
              <Text style={styles.headerBack}>‹</Text>
            </Pressable>

            <View style={styles.headerText}>
              <Text style={styles.title} numberOfLines={1}>{title}</Text>
              {!!crumb && <Text style={styles.crumb} numberOfLines={1}>{crumb}</Text>}
            </View>

            <Pressable
              onPress={onClose}
              style={styles.headerButton}
              accessibilityRole="button"
              accessibilityLabel="Yopish"
            >
              <Text style={styles.headerClose}>✕</Text>
            </Pressable>
          </View>

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
              <Pressable onPress={() => void load(level, path)} accessibilityRole="button">
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
                  {query ? 'Topilmadi' : "Ro'yxat bo'sh"}
                </Text>
              }
              renderItem={({ item }) => {
                const selected =
                  level === multiSelectAt
                    ? picked.some((o) => o.id === item.id)
                    : path[level]?.id === item.id;
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
                    <Text style={styles.rowChevron}>
                      {selected ? '✓' : level === multiSelectAt ? '+' : '›'}
                    </Text>
                  </Pressable>
                );
              }}
            />
          )}

          {/*
            The multi-select level is the ONLY one with a confirm: every other level
            advances the cascade on tap, so a button there would be a second way to do
            the same thing. Disabled at zero, because an endpoint with no tuman is not
            an answer the caller can use.
          */}
          {level === multiSelectAt && (
            <View style={styles.footer}>
              <Pressable
                onPress={confirmPicked}
                disabled={picked.length === 0}
                accessibilityRole="button"
                accessibilityState={{ disabled: picked.length === 0 }}
                style={({ pressed }) => [
                  styles.confirm,
                  picked.length === 0 && styles.confirmOff,
                  pressed && { opacity: theme.states.pressedOpacity },
                ]}
              >
                <Text style={styles.confirmText}>
                  {picked.length > 0 ? `Tayyor (${picked.length})` : 'Tayyor'}
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: theme.palette.scrim.sheet },

  sheet: {
    maxHeight: '78%',
    backgroundColor: theme.palette.ground,
    borderTopLeftRadius: theme.borderRadius.sheet,
    borderTopRightRadius: theme.borderRadius.sheet,
  },
  grabber: {
    alignSelf: 'center',
    width: theme.modal.grabber.width,
    height: theme.modal.grabber.height,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.modal.grabber.color,
    marginTop: 8,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.palette.borders.chrome,
  },
  headerButton: {
    width: theme.sizes.touchTarget,
    height: theme.sizes.touchTarget,
    borderRadius: theme.borderRadius.control,
    backgroundColor: theme.palette.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.palette.borders.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBack: { ...theme.typography.cardTitle, color: theme.palette.text.primary },
  headerClose: { ...theme.typography.rowLabel, color: theme.palette.text.secondary },
  headerText: { flex: 1, alignItems: 'center' },
  title: { ...theme.typography.sheetTitle, color: theme.palette.text.primary },
  crumb: { ...theme.typography.monoTiny, color: theme.palette.text.tertiary },

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  rowLabel: { ...theme.typography.rowLabel, color: theme.palette.text.primary, flex: 1 },
  rowLabelSelected: { color: theme.palette.actionPressed },
  rowChevron: { ...theme.typography.cardTitle, color: theme.palette.text.chevron },

  footer: {
    paddingHorizontal: 18,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.palette.borders.chrome,
  },
  confirm: {
    minHeight: theme.sizes.buttonLg,
    borderRadius: theme.borderRadius.button,
    backgroundColor: theme.palette.action,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmOff: { opacity: theme.states.disabledOpacity },
  confirmText: {
    ...theme.typography.button,
    color: theme.palette.text.onAccent,
  },

  state: { paddingVertical: 40, alignItems: 'center', gap: 10 },
  errorText: { ...theme.typography.secondary, color: theme.palette.dangerText },
  retry: { ...theme.typography.chipLabel, color: theme.palette.action },
  empty: {
    ...theme.typography.secondary,
    color: theme.palette.text.tertiary,
    textAlign: 'center',
    paddingVertical: 32,
  },
});
