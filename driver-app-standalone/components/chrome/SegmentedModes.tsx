/**
 * SegmentedModes — T-101 step 9.
 *
 * The artboards' mode strip: a sunken track carrying N segments, each a label plus a
 * MONO count pill. The selected segment lifts to a white `surface` tile with a small
 * shadow; the others are transparent on the track.
 *
 * Measured on `UserMyOrder` (three lifecycle modes) — DESIGN-TOKENS.md §6.4:
 *
 *   track     padding 5px 8px, background #E4E0D7 (`surfaceTrack`), hairline top+bottom
 *   segment   flex:1, minHeight 42, radius 12, gap 7
 *   on        bg #FFFFFF, shadow 0 1px 3px rgba(22,19,14,.12), ink #16130E, weight 800
 *   off       bg transparent,                                   ink secondary, weight 600
 *   pill      radius 99, minWidth 22, padding 1px 6px, mono 11/700
 *   pill on   #DCF6E4 on #155C40  (6.96:1)
 *   pill off  rgba(ink,.07) on secondary (4.61:1)
 *
 * ⚠️ NOT THE SAME CONTROL AS THE `Qidiruv` BOARDS' FILTER STRIP, though both carry a
 * count pill. Those are `border-radius: 12px 12px 0 0` with `border-bottom:none` — TABS
 * welded to the panel below them. This one is a fully-rounded segmented control. They
 * were measured side by side; unifying them would flatten a real distinction, so step 17
 * should build the tab variant separately rather than bending this component.
 *
 * ⚠️ The count is part of the segment's accessibility label, not a separate node — a
 * screen reader announcing "Faol" then "2" as two controls is worse than one label.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { theme } from '../../themes';

export interface SegmentedMode<K extends string = string> {
  key: K;
  label: string;
  count: number;
}

interface SegmentedModesProps<K extends string = string> {
  modes: readonly SegmentedMode<K>[];
  value: K;
  onChange: (key: K) => void;
}

export function SegmentedModes<K extends string = string>({
  modes,
  value,
  onChange,
}: SegmentedModesProps<K>) {
  return (
    <View style={styles.track}>
      {modes.map((m) => {
        const on = m.key === value;
        return (
          <Pressable
            key={m.key}
            onPress={() => onChange(m.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={`${m.label}, ${m.count}`}
            style={[styles.segment, on && styles.segmentOn]}
          >
            <Text
              numberOfLines={1}
              style={[styles.label, on ? styles.labelOn : styles.labelOff]}
            >
              {m.label}
            </Text>
            <View style={[styles.pill, on ? styles.pillOn : styles.pillOff]}>
              <Text style={[styles.pillText, on ? styles.pillTextOn : styles.pillTextOff]}>
                {m.count}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
    paddingVertical: 5,
    paddingHorizontal: 8,
    backgroundColor: theme.palette.surfaceTrack,
    borderTopWidth: theme.sizes.borderHairline,
    borderBottomWidth: theme.sizes.borderHairline,
    borderColor: theme.palette.borders.chrome,
  },
  segment: {
    flex: 1,
    minWidth: 0,
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 6,
    borderRadius: theme.borderRadius.xl,
  },
  segmentOn: {
    backgroundColor: theme.palette.surface,
    ...theme.shadows.card,
  },
  label: {
    flexShrink: 1,
    fontSize: 14,
    letterSpacing: -0.14,
    textAlign: 'center',
  },
  labelOn: { ...theme.font('sans', 800), color: theme.palette.text.primary },
  labelOff: { ...theme.font('sans', 600), color: theme.palette.text.secondary },
  pill: {
    minWidth: 22,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillOn: { backgroundColor: theme.palette.successTint },
  pillOff: { backgroundColor: theme.palette.borders.chrome },
  pillText: { ...theme.typography.monoMeta, ...theme.font('mono', 700) },
  pillTextOn: { color: theme.palette.actionPressed },
  pillTextOff: { color: theme.palette.text.secondary },
});
