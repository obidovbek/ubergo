/**
 * `Faol e'lon: n / 2` — the active-offer counter and its note. T-115.
 *
 * MEASURED off `DriverMyOrder.dc.html` (the row directly under the mode tabs):
 *   row    flex · align center · gap 9 · padding 9/4/0
 *   chip   padding 4/10 · radius 99 · mono 10.5 · 700 · nowrap
 *          bg `#EDEAE3` → `#FBE2DE` when full; fg `#5C574E` → `#8E2E1E`
 *   note   flex 1 · 11 · 600 · line-height 1.3
 *
 * 🔴 THE COLOURS ARE TOKENS, AND TWO OF THEM ARE THE PALETTE'S CORRECTED VALUES.
 * `#EDEAE3` is `surfaceSunken`, `#FBE2DE` `dangerTint`, `#8E2E1E` `dangerDeep`. But the drawn
 * `#5C574E` and the note's `#8A857A` are NOT copied: the palette already replaced them with
 * `muted` (#5B5750) and `tertiary` (#716D64) for contrast, and re-introducing the artboard's
 * hexes would undo a fix the design system had already made.
 *
 * ⚠️ It reports; it does not enforce. The server refuses the third offer regardless
 * (`api/src/utils/activeOffers.ts`) — see `utils/activeOffers.ts` for why both exist.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from '../../hooks/useTranslation';
import { theme } from '../../themes';
import { MAX_ACTIVE_OFFERS, isAtActiveLimit } from '../../utils/activeOffers';

interface ActiveLimitRowProps {
  activeCount: number;
}

export const ActiveLimitRow: React.FC<ActiveLimitRowProps> = ({ activeCount }) => {
  const { t } = useTranslation();
  const full = isAtActiveLimit(activeCount);

  return (
    <View style={styles.row}>
      <Text style={[styles.chip, full ? styles.chipFull : styles.chipFree]} numberOfLines={1}>
        {t('driverOffers.activeLimitCount')
          .replace('{count}', String(activeCount))
          .replace('{max}', String(MAX_ACTIVE_OFFERS))}
      </Text>
      <Text style={styles.note}>
        {full
          ? t('driverOffers.activeLimitFull')
          : t('driverOffers.activeLimitHint').replace('{max}', String(MAX_ACTIVE_OFFERS))}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingTop: 9,
    paddingHorizontal: 4,
  },
  chip: {
    flexGrow: 0,
    flexShrink: 0,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.full,
    /*
     * ⚠️ `monoPrice` for the FAMILY AND WEIGHT (mono 700), resized to the drawn 10.5.
     * `monoTiny` is already 10.5 but weight 500, and the bold is doing work here — this chip
     * turns red to say "you are at the ceiling", so it has to read as emphasis.
     */
    ...theme.typography.monoPrice,
    fontSize: 10.5,
  },
  chipFree: {
    backgroundColor: theme.palette.surfaceSunken,
    color: theme.palette.text.muted,
  },
  chipFull: {
    backgroundColor: theme.palette.dangerTint,
    color: theme.palette.dangerDeep,
  },
  note: {
    flex: 1,
    minWidth: 0,
    fontSize: 11,
    lineHeight: 14,
    color: theme.palette.text.tertiary,
  },
});
