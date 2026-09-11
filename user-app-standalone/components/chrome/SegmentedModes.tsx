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
 * 🔴 T-101 step 17b FOUND THE RADIUS WRONG SINCE STEP 9. The segment read
 * `theme.borderRadius.xl` — the DEPRECATED alias, worth 24 — on a 42px control measured at
 * 12, so it rendered as a pill on `UserMyOrder`. Nobody saw it: nothing from step 8e on has
 * run on a device. Fixed here with the measured value; the alias dies in step 23.
 *
 * ⚠️ `shape="pill"` — T-101 step 17d. `DriverQidiruv`'s mode strip is the SAME control at a
 * different radius: track `radius 99, padding 4, gap 4, inset shadow`, segments `minHeight 44,
 * radius 99`, and NO count pill (its render exposes only label/bg/fg/weight). So `count` is
 * optional and the pill is drawn only when one is given. Measured on `DriverQidiruv.dc.html`
 * lines 120-126.
 *
 * ⚠️ NOT THE SAME CONTROL AS THE `Qidiruv` BOARDS' FILTER STRIP, though both carry a
 * count pill. Those are `border-radius: 12px 12px 0 0` with `border-bottom:none` — TABS
 * welded to the panel below. This one is a fully-rounded segmented control. They
 * were measured side by side; unifying them would flatten a real distinction, so step 17
 * built the tab variant separately (`PanelTabs`).
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
  /** Omit it and no pill is drawn (the driver's `DriverQidiruv` strip has none). */
  count?: number;
}

interface SegmentedModesProps<K extends string = string> {
  modes: readonly SegmentedMode<K>[];
  value: K;
  onChange: (key: K) => void;
  /** `rounded` = `UserMyOrder` (radius 12); `pill` = `DriverQidiruv` (radius 99). */
  shape?: 'rounded' | 'pill';
}

export function SegmentedModes<K extends string = string>({
  modes,
  value,
  onChange,
  shape = 'rounded',
}: SegmentedModesProps<K>) {
  const pill = shape === 'pill';
  return (
    <View style={[styles.track, pill && styles.trackPill]}>
      {modes.map((m) => {
        const on = m.key === value;
        const hasCount = m.count !== undefined;
        return (
          <Pressable
            key={m.key}
            onPress={() => onChange(m.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={hasCount ? `${m.label}, ${m.count}` : m.label}
            style={[styles.segment, pill && styles.segmentPill, on && styles.segmentOn]}
          >
            <Text
              numberOfLines={1}
              style={[styles.label, on ? styles.labelOn : styles.labelOff]}
            >
              {m.label}
            </Text>
            {hasCount && (
              <View style={[styles.pill, on ? styles.pillOn : styles.pillOff]}>
                <Text style={[styles.pillText, on ? styles.pillTextOn : styles.pillTextOff]}>
                  {m.count}
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

// Measured on `UserMyOrder`: 12. The radius scale carries 11 and 13 either side of it, and
// `borderRadius.xl` (the value this used to read) is the deprecated 24 alias.
const SEGMENT_RADIUS = 12;

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
  trackPill: {
    gap: 4,
    padding: 4,
    borderRadius: theme.borderRadius.full,
    borderTopWidth: 0,
    borderBottomWidth: 0,
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
    borderRadius: SEGMENT_RADIUS,
  },
  segmentPill: {
    minHeight: 44,
    borderRadius: theme.borderRadius.full,
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
