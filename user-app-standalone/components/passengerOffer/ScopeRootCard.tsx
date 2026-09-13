/**
 * The scope root — the card above the route block on two of the four order artboards.
 * T-114 ①, 2026-09-13.
 *
 * 🎯 WHAT IT IS. `Viloyat ichi` and `Tuman ichi` fix a level for BOTH ends of the journey
 * before either is picked, and this card is where that level is chosen and shown. The
 * from/to pickers then open BELOW it, so the passenger never picks the same province twice.
 * `Shaharlar aro` and `Yaqin` fix nothing and draw no such card — `openVil` and its `map`
 * icon appear **zero** times in those two files — so the screen renders this only when
 * `orderScopeGeo(scope).rootLevel !== null`.
 *
 * MEASURED off `UserBuyurtmaTuman.dc.html` / `UserBuyurtmaViloyat.dc.html` (the two are
 * identical but for the eyebrow and the value):
 *   card     white · border 1.5 · radius 20 · padding 13 · gap 11 · the usual 1px shadow
 *   icon     38×38 tile · radius 13 · bg successTint · Material `map` glyph 21px
 *   eyebrow  mono · 11 · 700 · uppercase · tracking .1em
 *
 * ⚠️ THE ARTBOARDS' EYEBROWS READ "Viloyat (Adm1)" / "Tuman (Adm2)"; the owner had the adm
 * notation dropped on 2026-09-13, so they render "Viloyat" / "Tuman" (and each locale's own
 * word in ru/en, since the Uzbek term was only carried there as part of a technical label).
 * The `adm1/adm2/adm3` vocabulary stays in CODE and docs, where it is precise and needed.
 *   value    15 · 800
 *   chevron  19px, right
 *
 * 🔴 THE THREE DRAWN COLOURS ARE TOKENS, NOT LITERALS — and one of them is corrected.
 * `#DCF6E4` is `successTint` and `#155C40` is `actionPressed` ("icon glyphs", verbatim).
 * The border's `#05BB42` is `brand`, which the palette header permits for exactly this
 * ("the wordmark, selection borders and tints. NOT a button fill"). But the drawn eyebrow
 * `#8A857A` measures 3.28:1 and is NOT used: the palette already corrected it to `tertiary`
 * (#716D64, 4.61:1). Copying the artboard's hex there would reintroduce a contrast defect
 * the design system had already fixed.
 */

import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "../../hooks/useTranslation";
import { theme } from "../../themes";
import { GeoSheet, type GeoLevel, type GeoPath } from "../geo/GeoSheet";
import { scopeSheetPath } from "../../utils/scopeRoot";
import {
  orderScopeGeo,
  scopeRootLabelKey,
  scopeRootSheetTitleKey,
  type OrderScope,
} from "../../types/orderScope";

interface ScopeRootCardProps {
  scope: OrderScope;
  /**
   * 🔴 REQUIRED, even though the country is never shown. `GeoSheet` opens at `province` and
   * will not load one without `path.country` — it renders an empty list instead, with no
   * error. That was the 2026-09-13 device report. See `scopeSheetPath`.
   */
  countryId: number | null;
  /** The chosen root. Empty until the passenger picks one. */
  value: GeoPath;
  /**
   * ⚠️ Changing the root MUST clear both endpoints — see the screen. They were chosen
   * underneath the old root and would otherwise go on describing a different place.
   */
  onChange: (path: GeoPath) => void;
  error?: string;
}

export const ScopeRootCard: React.FC<ScopeRootCardProps> = ({
  scope,
  countryId,
  value,
  onChange,
  error,
}) => {
  const { t } = useTranslation();
  const [sheetOpen, setSheetOpen] = useState(false);

  const { rootLevel } = orderScopeGeo(scope);
  const labelKey = scopeRootLabelKey(scope);
  const titleKey = scopeRootSheetTitleKey(scope);

  // A scope with no root draws nothing at all. Rendering an empty card would take the
  // artboards' two files down to one by accident.
  if (!rootLevel || !labelKey || !titleKey) return null;

  /*
   * The artboard's `vilLabel`: the province alone on the Viloyat board, "province, district"
   * on the Tuman board. Built from the path rather than stored, so it cannot drift from what
   * the picker actually returned.
   */
  const parts = [value.province?.name, rootLevel === "district" ? value.district?.name : null]
    .filter((part): part is string => !!part);
  const summary = parts.join(", ");

  return (
    <View>
      <TouchableOpacity
        style={[styles.card, !!error && styles.cardError]}
        onPress={() => setSheetOpen(true)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={t(labelKey)}
      >
        <View style={styles.iconTile}>
          <MaterialIcons
            name="map"
            size={21}
            color={theme.palette.actionPressed}
          />
        </View>

        <View style={styles.body}>
          <Text style={styles.eyebrow}>{t(labelKey)}</Text>
          <Text
            style={[styles.value, !summary && styles.valuePlaceholder]}
            numberOfLines={2}
          >
            {summary || t(titleKey)}
          </Text>
        </View>

        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>

      {!!error && <Text style={styles.errorText}>{error}</Text>}

      <GeoSheet
        visible={sheetOpen}
        title={t(titleKey)}
        startLevel="province"
        endLevel={rootLevel as GeoLevel}
        initialPath={scopeSheetPath(countryId, value) as GeoPath}
        onDone={(path) => {
          setSheetOpen(false);
          onChange(path);
        }}
        onClose={() => setSheetOpen(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    padding: 13,
    borderRadius: theme.borderRadius.card,
    borderWidth: 1.5,
    borderColor: theme.palette.brand,
    backgroundColor: theme.palette.surface,
    ...theme.shadows.card,
  },
  cardError: {
    borderColor: theme.palette.dangerBorder,
    backgroundColor: theme.palette.dangerTint,
  },
  iconTile: {
    width: 38,
    height: 38,
    borderRadius: theme.borderRadius.control,
    backgroundColor: theme.palette.successTint,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  eyebrow: {
    ...theme.typography.eyebrow,
    fontSize: 11,
    color: theme.palette.text.tertiary,
  },
  value: {
    ...theme.typography.cardTitle,
    lineHeight: 20,
    color: theme.palette.text.primary,
  },
  valuePlaceholder: {
    color: theme.palette.dangerText,
  },
  chevron: {
    fontSize: 19,
    color: theme.palette.text.chevron,
  },
  errorText: {
    ...theme.typography.caption,
    color: theme.palette.dangerText,
    marginTop: 4,
    marginLeft: 4,
  },
});
