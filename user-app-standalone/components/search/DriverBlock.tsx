/**
 * DriverBlock + RatingBreakdownSheet — T-101 step 14b-3.
 *
 * The driver identity block of `UserQidiruv.dc.html`'s detail sheet: avatar, name, ★ rating
 * with its count, plate and vehicle. Tapping the rating opens the breakdown.
 *
 * 🟢 THE RATING IS REAL AND THIS IS ITS FIRST USE ANYWHERE IN EITHER APP. `DriverRating` and
 * its routes have been live all along; the board said no rating model existed (T-109 ②, a grep
 * of the wrong directory). The average and count ride along on the search response, so the
 * block costs no extra call — only the breakdown fetches, and only on tap.
 *
 * 🔴 NOT A REVIEWS LIST, AND THAT IS NOT A CHOICE. The artboard draws
 * `Foydalanuvchilar izohi` with quoted comments. The `comment` column exists, but **no
 * endpoint exposes another driver's comments to a passenger**: the one that includes them is
 * scoped to `req.user.id`, i.e. a driver reading their own. So the sheet shows the **rating
 * distribution** the public summary really returns. → T-112.
 *
 * ⚠️ An unrated driver is a normal 200 with zeros, not an error. It must read "not rated yet",
 * never `0,0` — a zero score says "terrible driver" and the server means "nobody has said".
 * `ratingOf` in `utils/offerSearch.ts` owns that rule; this file only draws it.
 *
 * ⚠️ No presence dot, no "7 yil tajriba", no "100+ qatnov" — none has a backend
 * (`PLAN-T101-step14b.md` §2 → T-112 / T-082).
 */

import React from 'react';
import { View, Text, Pressable, Modal, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '../../hooks/useTranslation';
import type { DriverOffer } from '../../api/offers';
import type { DriverRatingSummary } from '../../api/ratings';
import { formatRating, ratingOf } from '../../utils/offerSearch';
import { theme } from '../../themes';

const STARS = ['5', '4', '3', '2', '1'] as const;

export interface DriverBlockProps {
  offer: DriverOffer;
  onOpenBreakdown: () => void;
}

export const DriverBlock: React.FC<DriverBlockProps> = ({ offer, onOpenBreakdown }) => {
  const { t } = useTranslation();

  const name = offer.driver?.name?.trim() || t('offerDrivers.unknownDriver');
  const initials = name.charAt(0).toUpperCase() || '?';
  const rating = ratingOf(offer);

  return (
    <View style={styles.block}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>

      <View style={styles.text}>
        <Text style={styles.name} numberOfLines={2}>
          {name}
        </Text>
        <Text style={styles.vehicle} numberOfLines={1}>
          {[offer.vehicle?.make, offer.vehicle?.model, offer.vehicle?.license_plate]
            .filter(Boolean)
            .join(' · ')}
        </Text>
      </View>

      {rating ? (
        <Pressable
          style={styles.ratingPill}
          onPress={onOpenBreakdown}
          accessibilityRole="button"
          accessibilityLabel={t('searchOffers.ratingBreakdown')}
        >
          <Text style={styles.star}>★</Text>
          <Text style={styles.ratingValue}>{formatRating(rating.value)}</Text>
          {rating.count > 0 && <Text style={styles.ratingCount}>{`(${rating.count})`}</Text>}
        </Pressable>
      ) : (
        <View style={styles.unratedPill}>
          <Text style={styles.unratedLabel} numberOfLines={2}>
            {t('searchOffers.notRatedYet')}
          </Text>
        </View>
      )}
    </View>
  );
};

export interface RatingBreakdownSheetProps {
  visible: boolean;
  driverName: string;
  summary: DriverRatingSummary | null;
  loading: boolean;
  onClose: () => void;
}

export const RatingBreakdownSheet: React.FC<RatingBreakdownSheetProps> = ({
  visible,
  driverName,
  summary,
  loading,
  onClose,
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const total = summary?.total_ratings ?? 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable
          style={styles.scrim}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t('common.cancel')}
        />
        <View style={[styles.sheet, { paddingBottom: 24 + insets.bottom }]} accessibilityViewIsModal>
          <View style={styles.grabber} />
          <Text style={styles.sheetTitle} numberOfLines={2}>
            {driverName}
          </Text>

          {loading ? (
            <ActivityIndicator color={theme.palette.action} style={styles.loader} />
          ) : total === 0 ? (
            <Text style={styles.empty}>{t('searchOffers.notRatedYet')}</Text>
          ) : (
            <>
              <View style={styles.headline}>
                <Text style={styles.headlineStar}>★</Text>
                <Text style={styles.headlineValue}>
                  {formatRating(summary?.average_rating ?? 0)}
                </Text>
                <Text style={styles.headlineCount}>
                  {t('searchOffers.ratingCount').replace('{count}', String(total))}
                </Text>
              </View>

              {STARS.map((s) => {
                const n = summary?.rating_distribution?.[s] ?? 0;
                // Guarded: `total` is non-zero in this branch, but a divide stays explicit.
                const pct = total > 0 ? Math.round((n / total) * 100) : 0;
                return (
                  <View key={s} style={styles.barRow}>
                    <Text style={styles.barLabel}>{`${s} ★`}</Text>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${pct}%` }]} />
                    </View>
                    <Text style={styles.barCount}>{String(n)}</Text>
                  </View>
                );
              })}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  block: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: theme.borderRadius.field,
    backgroundColor: theme.palette.surface,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.palette.successTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 15, ...theme.font('sans', 800), color: theme.palette.actionPressed },
  text: { flex: 1, minWidth: 0, gap: 2 },
  name: { fontSize: 14.5, ...theme.font('sans', 800), color: theme.palette.text.primary, lineHeight: 18 },
  vehicle: { fontSize: 11.5, ...theme.font('mono', 500), color: theme.palette.text.tertiary },

  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.palette.warnTint,
    borderWidth: 1,
    borderColor: theme.palette.warnBorder,
  },
  star: { fontSize: 12, color: theme.palette.warnInk },
  ratingValue: { fontSize: 13, ...theme.font('mono', 700), color: theme.palette.warnInk },
  ratingCount: { fontSize: 11, ...theme.font('mono', 500), color: theme.palette.warnInk },
  unratedPill: {
    maxWidth: 96,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.palette.surfaceSunken,
  },
  unratedLabel: { fontSize: 10.5, ...theme.font('sans', 600), color: theme.palette.text.muted },

  root: { flex: 1, justifyContent: 'flex-end' },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: theme.palette.scrim.modal },
  sheet: {
    backgroundColor: theme.palette.ground,
    borderTopLeftRadius: theme.borderRadius.sheet,
    borderTopRightRadius: theme.borderRadius.sheet,
    paddingTop: 10,
    paddingHorizontal: 16,
    gap: 10,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.palette.borders.emphasis,
  },
  sheetTitle: { fontSize: 15.5, ...theme.font('sans', 800), color: theme.palette.text.primary },
  loader: { paddingVertical: 24 },
  empty: {
    paddingVertical: 20,
    fontSize: 13,
    ...theme.font('sans', 600),
    color: theme.palette.text.muted,
    textAlign: 'center',
  },

  headline: { flexDirection: 'row', alignItems: 'baseline', gap: 7 },
  headlineStar: { fontSize: 18, color: theme.palette.warnInk },
  headlineValue: { fontSize: 26, ...theme.font('mono', 800), color: theme.palette.text.primary },
  headlineCount: { fontSize: 12, ...theme.font('sans', 600), color: theme.palette.text.tertiary },

  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barLabel: { width: 30, fontSize: 11.5, ...theme.font('mono', 600), color: theme.palette.text.muted },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.palette.surfaceSunken,
    overflow: 'hidden',
  },
  barFill: { height: 8, borderRadius: theme.borderRadius.full, backgroundColor: theme.palette.action },
  barCount: { minWidth: 24, fontSize: 11.5, ...theme.font('mono', 600), color: theme.palette.text.tertiary, textAlign: 'right' },
});
