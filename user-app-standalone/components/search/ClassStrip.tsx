/**
 * ClassStrip — T-101 step 14b-7.
 *
 * The vehicle-class filter strip of `UserQidiruv.dc.html` (lines 139-153). **This replaces the
 * wrapped rounded pills 14b-4 built**, which were wrong: the artboard draws a single strip
 * that scrolls sideways, with tabs welded to the content below.
 *
 * Measured from the artboard:
 *
 *   strip    horizontal scroll, gap 0, padding 0 34 8 34, on `ground`
 *   tab      min-height 40, padding 0 13, **radius 11 11 0 0** (flat bottom — welded),
 *            gap 6; label 12.5 at weight 900 selected / 600 otherwise
 *   pill     padding 1 6, radius 99, mono 10.5/700
 *   edges    a 38px fade each side, and a 26px arrow button over it
 *
 * Colour states, from the artboard's own `classFilters`:
 *   selected    surface fill, `action` border, dark label, `successTint` pill
 *   populated   `surfaceSunken` fill, hairline border, dark label
 *   EMPTY       `surfaceTrack` fill, muted label, `disabled` pill, **and not tappable**
 *               (`pick: () => { if (n) … }` — an empty class does nothing)
 *
 * 🔴 THE SELECTED BORDER IS `action`, NOT `brand`. The artboard's `#05BB42` measures 2.29:1
 * on `ground`; `action` measures 4.72:1. Third substitution of its kind on this card.
 * 🔴 AND THE EMPTY LABEL IS `text.muted`, NOT `text.tertiary` — 3.91:1 vs 5.45:1 on
 * `surfaceTrack`. **That is step 17b's finding, on the same control, in the other app.**
 *
 * ⚠️ The artboard blinks an arrow when a matching offer is hidden off-screen
 * (`rightTabHint`). Omitted, as in step 17b: a blinking affordance is a bigger call than a
 * repaint and nothing else in either app does it.
 */

import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../themes';

export interface ClassStripItem {
  key: string;
  label: string;
  count: number;
}

export interface ClassStripProps {
  items: readonly ClassStripItem[];
  value: string;
  onChange: (key: string) => void;
}

const EDGE = 38;

export const ClassStrip: React.FC<ClassStripProps> = ({ items, value, onChange }) => {
  const ref = useRef<ScrollView>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);
  const width = useRef(0);
  const offset = useRef(0);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    offset.current = contentOffset.x;
    width.current = layoutMeasurement.width;
    setAtStart(contentOffset.x <= 4);
    setAtEnd(contentOffset.x + layoutMeasurement.width >= contentSize.width - 4);
  }, []);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    width.current = e.nativeEvent.layout.width;
  }, []);

  // The artboard scrolls by 70% of the visible width.
  const nudge = (dir: -1 | 1) => {
    const step = Math.round(width.current * 0.7) || 160;
    ref.current?.scrollTo({ x: Math.max(0, offset.current + dir * step), animated: true });
  };

  return (
    <View style={styles.wrap} onLayout={onLayout}>
      <ScrollView
        ref={ref}
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.content}
      >
        {items.map((item) => {
          const on = value === item.key;
          const empty = item.count === 0;
          return (
            <Pressable
              key={item.key}
              // An empty class is inert in the artboard too — it filters to nothing.
              disabled={empty && !on}
              onPress={() => onChange(item.key)}
              style={[styles.tab, on ? styles.tabOn : empty ? styles.tabEmpty : styles.tabIdle]}
            >
              <Text
                style={[styles.label, on && styles.labelOn, empty && !on && styles.labelEmpty]}
                numberOfLines={1}
              >
                {item.label}
              </Text>
              <View style={[styles.pill, empty && !on && styles.pillEmpty]}>
                <Text style={[styles.pillLabel, empty && !on && styles.pillLabelEmpty]}>
                  {String(item.count)}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {!atStart && (
        <>
          <LinearGradient
            colors={[theme.palette.ground, theme.palette.groundClear]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.fade, styles.fadeLeft]}
            pointerEvents="none"
          />
          <Pressable style={[styles.arrow, styles.arrowLeft]} onPress={() => nudge(-1)}>
            <Text style={styles.arrowGlyph}>‹</Text>
          </Pressable>
        </>
      )}

      {!atEnd && (
        <>
          <LinearGradient
            colors={[theme.palette.groundClear, theme.palette.ground]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.fade, styles.fadeRight]}
            pointerEvents="none"
          />
          <Pressable style={[styles.arrow, styles.arrowRight]} onPress={() => nudge(1)}>
            <Text style={styles.arrowGlyph}>›</Text>
          </Pressable>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { backgroundColor: theme.palette.ground, position: 'relative' },
  content: { paddingLeft: 34, paddingRight: 34, paddingBottom: 8, gap: 0 },

  tab: {
    minHeight: 40,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopLeftRadius: 11,
    borderTopRightRadius: 11,
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  tabOn: { backgroundColor: theme.palette.surface, borderColor: theme.palette.action },
  tabIdle: {
    backgroundColor: theme.palette.surfaceSunken,
    borderColor: theme.palette.borders.strong,
  },
  tabEmpty: {
    backgroundColor: theme.palette.surfaceTrack,
    borderColor: theme.palette.borders.strong,
  },

  label: { fontSize: 12.5, ...theme.font('sans', 600), color: theme.palette.text.primary },
  labelOn: { ...theme.font('sans', 900) },
  labelEmpty: { color: theme.palette.text.muted },

  pill: {
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.palette.successTint,
  },
  pillEmpty: { backgroundColor: theme.palette.disabled },
  pillLabel: { fontSize: 10.5, ...theme.font('mono', 700), color: theme.palette.actionPressed },
  pillLabelEmpty: { color: theme.palette.text.muted },

  fade: { position: 'absolute', top: 0, bottom: 8, width: EDGE },
  fadeLeft: { left: 0 },
  fadeRight: { right: 0 },
  arrow: {
    position: 'absolute',
    top: 0,
    bottom: 8,
    width: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.palette.surfaceSunken,
    borderTopLeftRadius: 11,
    borderTopRightRadius: 11,
  },
  arrowLeft: { left: 0 },
  arrowRight: { right: 0 },
  arrowGlyph: { fontSize: 15, ...theme.font('sans', 800), color: theme.palette.text.primary },
});
