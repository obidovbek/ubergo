/**
 * Carousel — T-101 step 6.
 *
 * The horizontal picker from `UserMenuNeW.dc.html`, used for both the service row and
 * the scope row. Spec measured from the artboard, with the owner's 2026-08-30
 * adjustments applied:
 *
 *   card       selected -> `#D8F4E1` tint + 2px `brand` ring
 *              unselected -> surface + 1.5px `border.control`
 *              height 60 (artboard 84 — owner asked for shorter)
 *   arrows     40x40 round (artboard 34 — owner asked for bigger), surface,
 *              1.5px border, `actionPressed` chevron
 *   dots       one per item; active `brand`, inactive `disabled`
 *
 * THE SELECTED CARD IS ALWAYS CENTRED (owner, 2026-08-30). Three parts make that work
 * and all three are load-bearing:
 *   1. `sidePad` — half the leftover viewport, so the FIRST and LAST cards can reach
 *      the middle. Without it the ends jam against the edge and sit off-centre.
 *   2. the `useEffect` depends on `viewport` as well as the index, because the first
 *      layout arrives after the first render — otherwise the initial selection stays
 *      pinned left until something is tapped.
 *   3. a swipe SELECTS what it lands on, so "centred" and "selected" cannot disagree.
 *
 * ⚠️ The artboard's selected card uses `mix-blend-mode: multiply`, which React Native
 * has no equivalent for. The tint `#D8F4E1` is applied directly instead — the blend
 * only mattered over the artboard's photographic tiles, and there are none here.
 *
 * ⚠️ The artboard also animates its arrows (`ubxBlink`). Left out: a permanently
 * pulsing control is a hint that the row scrolls, and a real scrollable row already
 * communicates that by moving under the finger.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { theme } from '../themes';

export interface CarouselItem {
  key: string;
  label: string;
  /** false renders the card dimmed and inert — "not built yet", not "cancelled". */
  enabled?: boolean;
}

interface CarouselProps {
  items: CarouselItem[];
  selectedKey: string;
  onSelect: (key: string) => void;
  /** Card width. Two-and-a-bit visible is the artboard's rhythm. */
  itemWidth?: number;
  showDots?: boolean;
  testID?: string;
}

export const Carousel: React.FC<CarouselProps> = ({
  items,
  selectedKey,
  onSelect,
  itemWidth = 150,
  showDots = true,
  testID,
}) => {
  const scroller = useRef<ScrollView>(null);
  const [viewport, setViewport] = useState(0);

  const GAP = 10;
  const stride = itemWidth + GAP;

  const index = Math.max(0, items.findIndex((i) => i.key === selectedKey));

  /**
   * Side padding that lets the FIRST and LAST cards reach the middle of the track.
   * Without it a centred carousel can never centre its ends — they stop hard against
   * the edge, and the selection silently sits off-centre exactly when it matters most.
   */
  const sidePad = viewport > 0 ? Math.max(0, (viewport - itemWidth) / 2) : 0;

  const onLayout = (e: LayoutChangeEvent) =>
    setViewport(e.nativeEvent.layout.width);

  /**
   * Keeps the selected card centred. Runs on selection AND on viewport change, because
   * the very first layout arrives after the first render — without that dependency the
   * initial selection would sit at the left edge until the user touched something.
   */
  useEffect(() => {
    if (viewport <= 0) return;
    scroller.current?.scrollTo({ x: index * stride, animated: true });
  }, [index, viewport, stride]);

  /** A swipe selects whatever it lands on, so the centred card is always the live one. */
  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const landed = Math.round(e.nativeEvent.contentOffset.x / stride);
    const clamped = Math.max(0, Math.min(items.length - 1, landed));
    const item = items[clamped];
    // Skip disabled cards: a swipe must not select something a tap cannot.
    if (item && item.enabled !== false && item.key !== selectedKey) {
      onSelect(item.key);
    }
  };

  /** Steps to the nearest ENABLED neighbour, so an arrow never lands on a dead card. */
  const step = (dir: -1 | 1) => {
    for (let i = index + dir; i >= 0 && i < items.length; i += dir) {
      if (items[i].enabled !== false) {
        onSelect(items[i].key);
        return;
      }
    }
  };

  const hasPrev = items.slice(0, index).some((i) => i.enabled !== false);
  const hasNext = items.slice(index + 1).some((i) => i.enabled !== false);

  // Hide the arrows when everything already fits — an arrow that cannot move is worse
  // than no arrow.
  const overflows = viewport > 0 && items.length * stride - GAP > viewport;

  return (
    <View testID={testID}>
      <View style={styles.row}>
        {overflows && (
          <Pressable
            onPress={() => step(-1)}
            disabled={!hasPrev}
            style={[styles.arrow, !hasPrev && styles.arrowOff]}
            accessibilityRole="button"
            accessibilityLabel="Oldingi"
            hitSlop={8}
          >
            <Text style={styles.chevron}>‹</Text>
          </Pressable>
        )}

        <ScrollView
          ref={scroller}
          horizontal
          showsHorizontalScrollIndicator={false}
          onLayout={onLayout}
          onMomentumScrollEnd={onScrollEnd}
          snapToInterval={stride}
          decelerationRate="fast"
          contentContainerStyle={[
            styles.track,
            { paddingHorizontal: sidePad },
          ]}
          style={styles.flex}
        >
          {items.map((item) => {
            const selected = item.key === selectedKey;
            const enabled = item.enabled !== false;
            return (
              <Pressable
                key={item.key}
                onPress={() => enabled && onSelect(item.key)}
                disabled={!enabled}
                accessibilityRole="button"
                accessibilityState={{ selected, disabled: !enabled }}
                accessibilityLabel={item.label}
                style={({ pressed }) => [
                  styles.card,
                  { width: itemWidth },
                  selected ? styles.cardSelected : styles.cardIdle,
                  !enabled && styles.cardDisabled,
                  pressed && enabled && { opacity: theme.states.pressedOpacity },
                ]}
              >
                <Text
                  style={[
                    styles.label,
                    selected && styles.labelSelected,
                    !enabled && styles.labelDisabled,
                  ]}
                  numberOfLines={2}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {overflows && (
          <Pressable
            onPress={() => step(1)}
            disabled={!hasNext}
            style={[styles.arrow, !hasNext && styles.arrowOff]}
            accessibilityRole="button"
            accessibilityLabel="Keyingi"
            hitSlop={8}
          >
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        )}
      </View>

      {showDots && items.length > 1 && (
        <View style={styles.dots}>
          {items.map((item, i) => (
            <View
              key={item.key}
              style={[styles.dot, i === index && styles.dotActive]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  track: { gap: 10, paddingVertical: 4 },

  card: {
    // Owner asked for shorter cards (2026-08-30). 84 -> 60: still comfortably above the
    // 44px touch minimum, and two-line labels ("Maxsus texnika") still fit.
    minHeight: 60,
    borderRadius: theme.borderRadius.card,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: theme.sizes.borderEmphasis,
    ...theme.shadows.card,
  },
  cardIdle: {
    backgroundColor: theme.palette.surface,
    borderColor: theme.palette.borders.control,
  },
  cardSelected: {
    backgroundColor: theme.palette.successTint,
    borderColor: theme.palette.brand,
    borderWidth: 2,
  },
  cardDisabled: { opacity: theme.states.disabledOpacity },

  label: {
    ...theme.typography.chipLabel,
    color: theme.palette.text.primary,
    textAlign: 'center',
  },
  labelSelected: { color: theme.palette.actionPressed },
  labelDisabled: { color: theme.palette.text.tertiary },

  arrow: {
    // Owner asked for bigger arrows (2026-08-30). 34 -> 40, which also moves them
    // closer to the 44px touch target; the extra hitSlop covers the remainder.
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.palette.surface,
    borderWidth: theme.sizes.borderEmphasis,
    borderColor: theme.palette.borders.emphasis,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowOff: { opacity: theme.states.disabledOpacity },
  chevron: {
    ...theme.typography.h4,
    color: theme.palette.actionPressed,
    lineHeight: 26,
  },

  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.palette.disabled,
  },
  dotActive: { backgroundColor: theme.palette.brand },
});
