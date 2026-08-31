/**
 * Status Filter Tabs Component
 * Displays filter tabs for offer statuses with counts
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from '../../hooks/useTranslation';
import type { OfferStatus } from '../../api/driverOffers';
import { theme } from '../../themes';

interface StatusFilterTabsProps {
  statusFilter: OfferStatus | 'all';
  onFilterChange: (filter: OfferStatus | 'all') => void;
  allOffers: Array<{ status: OfferStatus }>;
}

export const StatusFilterTabs: React.FC<StatusFilterTabsProps> = ({
  statusFilter,
  onFilterChange,
  allOffers,
}) => {
  const { t } = useTranslation();

  const filterOptions = [
    { key: 'all' as const, defaultLabel: 'Barchasi' },
    { key: 'published' as const, defaultLabel: 'Faol' },
    { key: 'archived' as const, defaultLabel: 'Arxivlangan' },
    { key: 'cancelled' as const, defaultLabel: 'Bekor qilingan' },
  ];

  return (
    <View style={styles.filterContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScrollContent}
      >
        {filterOptions.map(({ key, defaultLabel }) => {
          // Get translated label with fallback
          const label =
            key === 'all'
              ? t('common.all') || defaultLabel
              : (() => {
                  const statusKey = `driverOffers.status.${key}`;
                  const translated = t(statusKey);
                  return translated !== statusKey ? translated : defaultLabel;
                })();

          // Count offers for each status
          const count =
            key === 'all'
              ? allOffers.length
              : allOffers.filter((o) => o.status === key).length;

          return (
            <TouchableOpacity
              key={key}
              style={[
                styles.filterChip,
                statusFilter === key && styles.filterChipActive,
              ]}
              onPress={() => onFilterChange(key)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterChipText,
                  statusFilter === key && styles.filterChipTextActive,
                ]}
              >
                {label}
                {count > 0 && (
                  <Text
                    style={[
                      styles.filterChipCount,
                      statusFilter === key && styles.filterChipCountActive,
                    ]}
                  >
                    {' '}({count})
                  </Text>
                )}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  filterContainer: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    backgroundColor: theme.palette.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.palette.borders.strong,
  },
  filterScrollContent: {
    paddingHorizontal: 12,
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.palette.surfaceSunken,
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: theme.palette.borders.strong,
  },
  filterChipActive: {
    backgroundColor: theme.palette.action,
    borderColor: theme.palette.action,
    shadowColor: theme.palette.action,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  filterChipText: {
    fontSize: 13,
    color: theme.palette.text.secondary,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: theme.palette.surface,
    fontWeight: '700',
  },
  filterChipCount: {
    fontSize: 11,
    color: theme.palette.text.tertiary,
    fontWeight: '600',
  },
  filterChipCountActive: {
    color: theme.palette.surface,
    opacity: 0.9,
  },
});

