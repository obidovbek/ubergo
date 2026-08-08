/**
 * ModalList — the searchable single-choice picker (T-036).
 *
 * This one shape covers 17 of the app's 33 modals: the geo cascade, country pickers,
 * language, vehicle types, filters. Call sites map their data to `ModalListOption` and
 * get the Figma treatment for free.
 *
 * Chrome lives in `AppModal`; this owns only the search box and the rows.
 */

import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppModal } from './AppModal';
import { useTranslation } from '../hooks/useTranslation';
import { createTheme } from '../themes';

const theme = createTheme('light');
const m = theme.modal;

export interface ModalListOption {
  id: string | number;
  label: string;
  /** Optional second line, e.g. a region under a city name. */
  sublabel?: string;
}

/**
 * Multi-select mode. When present, rows toggle instead of closing the modal and a
 * confirm action appears — used by the driver app's stop/city pickers, which let a
 * driver pick several towns along a route in one pass.
 */
export interface ModalListMultiSelect {
  selectedIds: (string | number)[];
  onToggle: (option: ModalListOption) => void;
  onConfirm: () => void;
  confirmLabel?: string;
  /** Optional line above the actions, e.g. "3 stops selected". */
  footerText?: string;
}

interface ModalListProps {
  visible: boolean;
  title: string;
  options: ModalListOption[];
  selectedId?: string | number | null;
  loading?: boolean;
  /** Shows the search box. Leave off for short, fixed lists (language, gender). */
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyText?: string;
  onSelect: (option: ModalListOption) => void;
  onClose: () => void;
  multiSelect?: ModalListMultiSelect;
}

export const ModalList: React.FC<ModalListProps> = ({
  visible,
  title,
  options,
  selectedId,
  loading = false,
  searchable = true,
  searchPlaceholder,
  emptyText,
  onSelect,
  onClose,
  multiSelect,
}) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const visibleOptions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return options;
    return options.filter((option) => option.label.toLowerCase().includes(query));
  }, [options, search]);

  // The search box is per-open state, not per-selection — reset it on both exits so
  // reopening the picker never starts pre-filtered.
  const close = () => {
    setSearch('');
    onClose();
  };

  const select = (option: ModalListOption) => {
    // In multi-select the modal stays open and the search text stays put — the user is
    // still picking, and clearing it would throw away the filter mid-task.
    if (multiSelect) {
      multiSelect.onToggle(option);
      return;
    }
    setSearch('');
    onSelect(option);
  };

  const isSelected = (option: ModalListOption) =>
    multiSelect
      ? multiSelect.selectedIds.includes(option.id)
      : selectedId === option.id;

  return (
    <AppModal
      visible={visible}
      onClose={close}
      title={title}
      actions={
        multiSelect
          ? [
              {
                label: multiSelect.confirmLabel ?? t('common.confirm'),
                onPress: multiSelect.onConfirm,
                disabled: multiSelect.selectedIds.length === 0,
              },
              { label: t('common.cancel'), onPress: close, variant: 'cancel' },
            ]
          : [{ label: t('common.cancel'), onPress: close, variant: 'cancel' }]
      }
    >
      {searchable && (
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={m.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder={searchPlaceholder ?? t('common.search')}
            placeholderTextColor={m.muted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={m.muted} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {loading ? (
        <View style={styles.stateBox}>
          <ActivityIndicator size="small" color={m.primary} />
        </View>
      ) : visibleOptions.length === 0 ? (
        <View style={styles.stateBox}>
          <Text style={styles.emptyText}>{emptyText ?? t('common.noResults')}</Text>
        </View>
      ) : (
        <FlatList
          data={visibleOptions}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const selected = isSelected(item);
            return (
              <TouchableOpacity
                style={[styles.row, selected && styles.rowSelected]}
                onPress={() => select(item)}
                activeOpacity={0.8}
              >
                <View style={styles.rowTextWrap}>
                  <Text
                    style={[styles.rowText, selected && styles.rowTextSelected]}
                    numberOfLines={2}
                  >
                    {item.label}
                  </Text>
                  {!!item.sublabel && (
                    <Text style={styles.rowSub} numberOfLines={1}>
                      {item.sublabel}
                    </Text>
                  )}
                </View>
                {selected && (
                  <Ionicons name="checkmark" size={20} color={m.rowSelectedText} />
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}

      {!!multiSelect?.footerText && (
        <Text style={styles.footerText}>{multiSelect.footerText}</Text>
      )}
    </AppModal>
  );
};

const styles = StyleSheet.create({
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 12,
    minHeight: 46,
    backgroundColor: m.row,
    borderRadius: m.rowRadius,
    borderWidth: m.borderWidth,
    borderColor: m.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: m.rowText,
    paddingVertical: 8,
  },
  stateBox: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: m.muted,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 4,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
    backgroundColor: m.row,
    borderRadius: m.rowRadius,
    borderWidth: m.borderWidth,
    borderColor: m.border,
  },
  rowSelected: {
    backgroundColor: m.rowSelected,
  },
  rowTextWrap: {
    flex: 1,
  },
  rowText: {
    fontSize: 15,
    color: m.rowText,
  },
  rowTextSelected: {
    fontWeight: '700',
    color: m.rowSelectedText,
  },
  rowSub: {
    fontSize: 12,
    color: m.muted,
    marginTop: 2,
  },
  footerText: {
    fontSize: 13,
    color: m.muted,
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
});

export default ModalList;
