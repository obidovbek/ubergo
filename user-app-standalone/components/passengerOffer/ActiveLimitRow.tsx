/**
 * `Faol buyurtma: n / 2` — the active-order counter and its note. T-115, passenger side.
 *
 * ⚠️ NO ARTBOARD DRAWS THIS ONE. The four `UserBuyurtma*` boards and `UserMening*` do not show
 * a limit at all — only `DriverMyOrder` does. So the measurements are the driver's, carried
 * across deliberately rather than invented: the same rule deserves the same shape in both apps,
 * and the alternative is two different-looking answers to one question.
 *
 * FROM `DriverMyOrder.dc.html`, via the driver app's own `ActiveLimitRow`:
 *   row    flex · align center · gap 9 · padding 9/4/0
 *   chip   padding 4/10 · radius 99 · mono 700 at 10.5 · nowrap
 *          bg `surfaceSunken` → `dangerTint` when full; fg `muted` → `dangerDeep`
 *   note   flex 1 · 11 · line-height 1.3 · `tertiary`
 *
 * ⚠️ It reports; it does not enforce. The server refuses the third order regardless.
 */

import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "../../hooks/useTranslation";
import { theme } from "../../themes";
import { MAX_ACTIVE_OFFERS, isAtActiveLimit } from "../../utils/activeOffers";

interface ActiveLimitRowProps {
  activeCount: number;
}

export const ActiveLimitRow: React.FC<ActiveLimitRowProps> = ({ activeCount }) => {
  const { t } = useTranslation();
  const full = isAtActiveLimit(activeCount);

  return (
    <View style={styles.row}>
      <Text style={[styles.chip, full ? styles.chipFull : styles.chipFree]} numberOfLines={1}>
        {t("myOrders.activeLimitCount")
          .replace("{count}", String(activeCount))
          .replace("{max}", String(MAX_ACTIVE_OFFERS))}
      </Text>
      <Text style={styles.note}>
        {full
          ? t("myOrders.activeLimitFull")
          : t("myOrders.activeLimitHint").replace("{max}", String(MAX_ACTIVE_OFFERS))}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
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
    // `monoPrice` for family and weight (mono 700), resized to the drawn 10.5 — see the
    // driver app's copy; `monoTiny` is the right size but weight 500, and the bold is doing
    // work here, because this chip turns red to say "you are at the ceiling".
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
