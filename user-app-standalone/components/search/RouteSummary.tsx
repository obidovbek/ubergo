/**
 * RouteSummary — T-101 step 14b-7.
 *
 * The route block at the top of `UserQidiruv.dc.html` (lines 110-127). **This replaces the
 * two-cell from/to form 14b-4 built**, which was wrong: the artboard does not draw a form
 * there at all. The owner said so on 2026-09-12 and they were right.
 *
 * Measured from the artboard:
 *
 *   block      ground, padding 11 18 9, column gap 8, hairline bottom border
 *   row        gap 11, items flex-start
 *   connector  14 wide column, padding-top 4: a 9px dot, a 2px line (min 16 tall,
 *              4px vertical margin), a 9px dot
 *   text       two lines, BOTH 13.5/800, line-height 1.3, gap 3
 *   meta       mono 11/600 depart time, then an optional pill (3px 8px, radius 99)
 *
 * 🔴 THE ARTBOARD'S ROUTE IS READ-ONLY BECAUSE ITS SCREEN IS. There, the passenger arrives
 * from an order they already placed, so the block reports. In this app the same screen is
 * also a TAB someone can open cold, and a read-only route would leave them no way to say
 * where they are going. **Owner decision 2026-09-12: draw it as designed, make the two lines
 * tappable.** The swap control is kept for the same reason: the app needs it and the
 * artboard's read-only context never did.
 *
 * 🔴 THE CONNECTOR'S GREEN IS NOT `brand`. The artboard uses `#05BB42`, which measures
 * **2.29:1** on `ground` — below the 3:1 non-text floor, on the element that carries the
 * whole route's meaning. `action` measures 4.72:1 and is used instead. The palette's own
 * comment says it: `brand` is "the wordmark, selection borders and tints. NOT a button fill."
 * **Third time this card has had to make that substitution** (steps 17b, 14b-2, here).
 *
 * ⚠️ The artboard's connector is a `repeating-linear-gradient` dashed line. React Native
 * cannot draw that, and RN's own dashed borders are unreliable on Android at 2px. A solid
 * line is used — the same call steps 9 and 17c made, recorded there too.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from '../../hooks/useTranslation';
import { theme } from '../../themes';

export interface RouteSummaryProps {
  /** Already-formatted place text, or null when nothing is chosen. */
  from: string | null;
  to: string | null;
  /** The mono line under the route — a depart time, or null. */
  time?: string | null;
  /** An optional pill, e.g. a women-only preference carried from the order. */
  badge?: string | null;
  onPressFrom: () => void;
  onPressTo: () => void;
  onSwap: () => void;
}

export const RouteSummary: React.FC<RouteSummaryProps> = ({
  from,
  to,
  time,
  badge,
  onPressFrom,
  onPressTo,
  onSwap,
}) => {
  const { t } = useTranslation();
  const unset = t('searchOffers.placeUnset');

  return (
    <View style={styles.block}>
      <View style={styles.row}>
        <View style={styles.connector}>
          <View style={[styles.dot, styles.dotStart]} />
          <View style={styles.line} />
          <View style={[styles.dot, styles.dotEnd]} />
        </View>

        <View style={styles.texts}>
          <Pressable onPress={onPressFrom} accessibilityRole="button" hitSlop={6}>
            <Text style={[styles.place, !from && styles.placeUnset]} numberOfLines={2}>
              {from || unset}
            </Text>
          </Pressable>
          <Pressable onPress={onPressTo} accessibilityRole="button" hitSlop={6}>
            <Text style={[styles.place, !to && styles.placeUnset]} numberOfLines={2}>
              {to || unset}
            </Text>
          </Pressable>
        </View>

        <Pressable
          style={styles.swap}
          onPress={onSwap}
          accessibilityRole="button"
          accessibilityLabel={t('searchOffers.swap')}
          hitSlop={6}
        >
          <Text style={styles.swapGlyph}>⇅</Text>
        </Pressable>
      </View>

      <View style={styles.meta}>
        <Text style={styles.time}>{time || t('searchOffers.timeUnset')}</Text>
        {!!badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeLabel} numberOfLines={1}>
              {badge}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  block: {
    paddingTop: 11,
    paddingHorizontal: 18,
    paddingBottom: 9,
    gap: 8,
    backgroundColor: theme.palette.ground,
    borderBottomWidth: theme.sizes.borderHairline,
    borderBottomColor: theme.palette.borders.chrome,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 11 },

  connector: { width: 14, alignItems: 'center', paddingTop: 4, alignSelf: 'stretch' },
  dot: { width: 9, height: 9, borderRadius: theme.borderRadius.full },
  dotStart: { backgroundColor: theme.palette.text.tertiary },
  dotEnd: { backgroundColor: theme.palette.action },
  line: {
    flex: 1,
    width: 2,
    minHeight: 16,
    marginVertical: 2,
    backgroundColor: theme.palette.action,
  },

  texts: { flex: 1, minWidth: 0, gap: 3 },
  place: {
    fontSize: 13.5,
    ...theme.font('sans', 800),
    color: theme.palette.text.primary,
    lineHeight: 18,
  },
  placeUnset: { color: theme.palette.text.tertiary },

  swap: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.palette.surface,
    borderWidth: 1,
    borderColor: theme.palette.borders.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swapGlyph: { fontSize: 16, ...theme.font('sans', 700), color: theme.palette.text.primary },

  meta: { flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' },
  time: { fontSize: 11, ...theme.font('mono', 600), color: theme.palette.text.muted },
  badge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.palette.femaleTint,
    borderWidth: 1,
    borderColor: theme.palette.female,
  },
  badgeLabel: { fontSize: 10.5, ...theme.font('sans', 700), color: theme.palette.femaleInk },
});
