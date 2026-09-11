/**
 * SortChips — T-101 step 17b.
 *
 * The `Qidiruv` boards' sort row: N equal chips butted edge to edge — radius 0, no gap, no side
 * padding — each a glyph and a label; the selected one inverts onto the ink.
 *
 * Measured on `DriverQidiruv.dc.html` lines 137-144 and its `sorts` render:
 *
 *   row    flex, align centre, padding 0 0 9px, ground — the strip runs edge to edge
 *   chip   flex:1, minHeight 38, gap 4, padding 0 4px, radius 0, border 1px
 *   on     bg text.primary, border text.primary, ink `text.onDark`
 *   off    bg surface, border .12 (`strong`), ink `text.secondary`
 *   text   glyph 10.5, label 10.5/700
 *
 * The glyph is the CALLER's: the price and seats chips flip ↑/↓ with their direction, and that
 * rule lives in `utils/passengerOrders.nextSortState`, not in a presentational strip.
 *
 * ⚠️ Adjacent chips each draw their own 1px border, so the shared edge is 2px — exactly as the
 * artboard renders it (it does the same). Not a defect to "fix" with negative margins.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { theme } from '../../themes';

export interface SortChip<K extends string = string> {
  key: K;
  label: string;
  /** ★ · ↑ · ↓ · ⚡ — decorative; the accessibility label is the text alone. */
  glyph: string;
}

interface SortChipsProps<K extends string = string> {
  chips: readonly SortChip<K>[];
  value: K;
  onChange: (key: K) => void;
}

export function SortChips<K extends string = string>({ chips, value, onChange }: SortChipsProps<K>) {
  return (
    <View style={styles.row}>
      {chips.map((chip) => {
        const on = chip.key === value;
        return (
          <Pressable
            key={chip.key}
            onPress={() => onChange(chip.key)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            accessibilityLabel={chip.label}
            style={[styles.chip, on ? styles.chipOn : styles.chipOff]}
          >
            <Text style={[styles.glyph, on ? styles.inkOn : styles.inkOff]}>{chip.glyph}</Text>
            <Text numberOfLines={1} style={[styles.label, on ? styles.inkOn : styles.inkOff]}>
              {chip.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 9,
    backgroundColor: theme.palette.ground,
  },
  chip: {
    flex: 1,
    minWidth: 0,
    minHeight: theme.sizes.controlSm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 4,
    borderRadius: 0,
    borderWidth: theme.sizes.borderHairline,
  },
  chipOn: { backgroundColor: theme.palette.text.primary, borderColor: theme.palette.text.primary },
  chipOff: { backgroundColor: theme.palette.surface, borderColor: theme.palette.borders.strong },
  glyph: { fontSize: 10.5, lineHeight: 13 },
  label: { flexShrink: 1, fontSize: 10.5, lineHeight: 13, textAlign: 'center', ...theme.font('sans', 700) },
  inkOn: { color: theme.palette.text.onDark },
  inkOff: { color: theme.palette.text.secondary },
});
