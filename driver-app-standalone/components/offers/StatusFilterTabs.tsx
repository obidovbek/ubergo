/**
 * Status Filter Tabs Component
 * Displays filter tabs for offer statuses with counts
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from '../../hooks/useTranslation';
import type { OfferStatus } from '../../api/driverOffers';

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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterScrollContent: {
    paddingHorizontal: 12,
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
    shadowColor: '#10B981',
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
    color: '#6B7280',
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  filterChipCount: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  filterChipCountActive: {
    color: '#FFFFFF',
    opacity: 0.9,
  },
});

