/**
 * PanelTabs — T-101 step 17b.
 *
 * The `Qidiruv` boards' class-filter strip: tabs WELDED to the panel beneath them — top
 * corners rounded, no bottom border — each a label over a mono count pill.
 *
 * Measured on `DriverQidiruv.dc.html` lines 128-135 and its `classFilters` render:
 *
 *   row     flex, padding 0 14px 8px, ground
 *   tab     flex:1, minHeight 44, column, centred, gap 1, padding 4px 6px,
 *           radius 12px 12px 0 0, border 1px, border-bottom NONE
 *   on      bg surface, border brand (the paid tab: `paid`), label 12/900 (→ 800, no Manrope 900)
 *   off     bg surfaceSunken with items · surfaceTrack when empty, border .14 (≈ `emphasis`),
 *           label 12/600
 *   pill    radius 99, padding 0 7px, mono 10/700
 *           with items: `successTint` / `actionPressed`   (paid tab: `paidTint` / `paid`)
 *           empty:      `disabled` / `text.muted`
 *
 * ⚠️ NOT `SegmentedModes`. Both carry a count pill; that one is a fully-rounded segmented
 * control on a sunken track, this one is a row of tabs opening onto the panel below. They were
 * measured side by side in step 9 and are deliberately two components.
 *
 * ⚠️ Deviations from the drawing, each deliberate:
 *   - The artboard's EMPTY-tab label inks (#A8A399, #B0A6C2) measure ~2:1 on their own greys.
 *     An empty tab is still a tappable control with a name, so it reads `text.muted` — the
 *     palette's own "inactive segment" tier — the 2026-08-31 ink-ladder rule
 *     (`DESIGN-TOKENS.md` §2.11). ⚠️ `text.tertiary` was tried first and measured 3.91:1 on
 *     `surfaceTrack` and 3.48:1 on `disabled`: below AA on both. Measured, not assumed.
 *   - The artboard's ON pill is a brighter green (#A9F0BE) than its with-items pill. Both use
 *     `successTint` here: the white tile and the coloured border already say "selected", and a
 *     third green tint would earn a token for one pill.
 *   - `rightTabHint` — a blink on the last tab when an urgent order hides behind it — is
 *     omitted, as the carousel arrows' pulse was in step 6.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { theme } from '../../themes';

export interface PanelTab<K extends string = string> {
  key: K;
  label: string;
  count: number;
  /** The paid ("Maxsus buyurtma") tab borders and inks in `paid` instead of `brand`. */
  tone?: 'brand' | 'paid';
}

interface PanelTabsProps<K extends string = string> {
  tabs: readonly PanelTab<K>[];
  value: K;
  onChange: (key: K) => void;
}

export function PanelTabs<K extends string = string>({ tabs, value, onChange }: PanelTabsProps<K>) {
  return (
    <View style={styles.row}>
      {tabs.map((tab) => {
        const on = tab.key === value;
        const empty = tab.count <= 0;
        const paid = tab.tone === 'paid';
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={`${tab.label}, ${tab.count}`}
            style={[
              styles.tab,
              on ? (paid ? styles.tabOnPaid : styles.tabOn) : empty ? styles.tabOffEmpty : styles.tabOff,
            ]}
          >
            <Text
              numberOfLines={2}
              style={[
                styles.label,
                on ? styles.labelOn : styles.labelOff,
                empty ? styles.labelEmpty : paid ? styles.labelPaid : styles.labelInk,
              ]}
            >
              {tab.label}
            </Text>
            <View style={[styles.pill, empty ? styles.pillEmpty : paid ? styles.pillPaid : styles.pillCount]}>
              <Text
                style={[
                  styles.pillText,
                  empty ? styles.pillTextEmpty : paid ? styles.pillTextPaid : styles.pillTextCount,
                ]}
              >
                {tab.count}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

// The welded corner. 12 is measured; the radius scale has 11 and 13 either side of it, and
// this control is the only place the artboards use 12 on a border that is missing a side.
const WELD_RADIUS = 12;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingBottom: 8,
    backgroundColor: theme.palette.ground,
  },
  tab: {
    flex: 1,
    minWidth: 0,
    minHeight: theme.sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderTopLeftRadius: WELD_RADIUS,
    borderTopRightRadius: WELD_RADIUS,
    borderWidth: theme.sizes.borderHairline,
    borderBottomWidth: 0,
  },
  tabOn: { backgroundColor: theme.palette.surface, borderColor: theme.palette.brand },
  tabOnPaid: { backgroundColor: theme.palette.surface, borderColor: theme.palette.paid },
  tabOff: { backgroundColor: theme.palette.surfaceSunken, borderColor: theme.palette.borders.emphasis },
  tabOffEmpty: { backgroundColor: theme.palette.surfaceTrack, borderColor: theme.palette.borders.emphasis },
  label: {
    fontSize: 12,
    lineHeight: 14,
    textAlign: 'center',
  },
  labelOn: { ...theme.font('sans', 800) },
  labelOff: { ...theme.font('sans', 600) },
  labelInk: { color: theme.palette.text.primary },
  labelPaid: { color: theme.palette.paid },
  labelEmpty: { color: theme.palette.text.muted },
  pill: {
    paddingHorizontal: 7,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillCount: { backgroundColor: theme.palette.successTint },
  pillPaid: { backgroundColor: theme.palette.paidTint },
  pillEmpty: { backgroundColor: theme.palette.disabled },
  pillText: { fontSize: 10, lineHeight: 14, ...theme.font('mono', 700) },
  pillTextCount: { color: theme.palette.actionPressed },
  pillTextPaid: { color: theme.palette.paid },
  pillTextEmpty: { color: theme.palette.text.muted },
});
