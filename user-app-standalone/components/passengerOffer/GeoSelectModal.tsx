/**
 * Geo Select Modal
 * Searchable single-choice list used by the route cards of the order screen.
 * Extracted from CreatePassengerOfferScreen, where the same markup existed
 * twice (once for "from", once for "to").
 */

import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from '../../hooks/useTranslation';
import type { GeoOption } from '../../api/geo';

interface GeoSelectModalProps {
  visible: boolean;
  title: string;
  options: GeoOption[];
  selectedId?: number | null;
  loading?: boolean;
  onSelect: (option: GeoOption) => void;
  onClose: () => void;
}

export const GeoSelectModal: React.FC<GeoSelectModalProps> = ({
  visible,
  title,
  options,
  selectedId,
  loading = false,
  onSelect,
  onClose,
}) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const visibleOptions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return options;
    return options.filter((option) => option.name.toLowerCase().includes(query));
  }, [options, search]);

  const close = () => {
    setSearch('');
    onClose();
  };

  const select = (option: GeoOption) => {
    setSearch('');
    onSelect(option);
  };

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={close}>
      <View style={styles.overlay}>
        <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={close} />

        <View style={styles.contentWrapper}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <TouchableOpacity onPress={close} style={styles.closeButton} hitSlop={8}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.searchBox}>
              <View style={styles.searchContainer}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder={t('searchOffers.searchPlaceholder')}
                  placeholderTextColor="#9CA3AF"
                  value={search}
                  onChangeText={setSearch}
                />
                {search.length > 0 && (
                  <TouchableOpacity onPress={() => setSearch('')} style={styles.searchClear}>
                    <Text style={styles.searchClearText}>×</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {loading ? (
              <View style={styles.stateBox}>
                <ActivityIndicator size="small" color="#10B981" />
              </View>
            ) : visibleOptions.length === 0 ? (
              <View style={styles.stateBox}>
                <Text style={styles.emptyText}>{t('passengerOffers.geoNoResults')}</Text>
              </View>
            ) : (
              <FlatList
                data={visibleOptions}
                keyExtractor={(item) => String(item.id)}
                style={styles.list}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => {
                  const isSelected = selectedId === item.id;
                  return (
                    <TouchableOpacity
                      style={[styles.item, isSelected && styles.itemSelected]}
                      onPress={() => select(item)}
                    >
                      <Text style={[styles.itemText, isSelected && styles.itemTextSelected]}>
                        {item.name}
                      </Text>
                      {isSelected && <Text style={styles.check}>✓</Text>}
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentWrapper: {
    width: '100%',
    paddingHorizontal: 20,
    maxHeight: '80%',
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 18,
    color: '#6B7280',
  },
  searchBox: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    minHeight: 44,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    paddingVertical: 8,
  },
  searchClear: {
    paddingHorizontal: 6,
  },
  searchClearText: {
    fontSize: 20,
    color: '#9CA3AF',
  },
  stateBox: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  list: {
    maxHeight: 360,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    minHeight: 48,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemSelected: {
    backgroundColor: '#ECFDF5',
  },
  itemText: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  itemTextSelected: {
    fontWeight: '700',
    color: '#059669',
  },
  check: {
    fontSize: 16,
    color: '#10B981',
    marginLeft: 8,
  },
});

export default GeoSelectModal;
