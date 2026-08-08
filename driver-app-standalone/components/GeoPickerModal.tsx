/**
 * GeoPickerModal — the driver app's country / province / city picker (T-036).
 *
 * The same markup existed **seven times** across `OfferWizardScreen` (from, to, stop),
 * `DriverVehicleScreen`, `DriverPersonalInfoScreen` and `DriverPassportScreen`, each
 * with its own overlay styles, its own `🔍`/`✕`/`✓` glyphs and its own hard-coded
 * Uzbek titles. They all funnel through here now.
 *
 * Mirrors the user app's `passengerOffer/GeoSelectModal`, plus the multi-select the
 * driver's stop picker needs.
 */

import React, { useMemo } from 'react';
import { ModalList, type ModalListOption } from './ModalList';
import type { GeoOption } from '../api/geo';

interface GeoPickerMultiSelect {
  selected: GeoOption[];
  onToggle: (option: GeoOption) => void;
  onConfirm: () => void;
  confirmLabel?: string;
  footerText?: string;
}

interface GeoPickerModalProps {
  visible: boolean;
  title: string;
  options: GeoOption[];
  selectedId?: number | null;
  loading?: boolean;
  onSelect: (option: GeoOption) => void;
  onClose: () => void;
  multiSelect?: GeoPickerMultiSelect;
}

export const GeoPickerModal: React.FC<GeoPickerModalProps> = ({
  visible,
  title,
  options,
  selectedId,
  loading = false,
  onSelect,
  onClose,
  multiSelect,
}) => {
  const listOptions = useMemo<ModalListOption[]>(
    () =>
      options.map((option) => ({
        id: option.id,
        label: option.name,
        // Several screens rendered this inline as "Name (type)". Kept as a second line
        // so the distinction between e.g. a city and a district is not lost.
        sublabel: option.type ?? undefined,
      })),
    [options]
  );

  // Hand back the ORIGINAL object, not the mapped row — callers read `latitude`,
  // `longitude` and `type` off it, none of which survive the mapping.
  const original = (id: string | number) => options.find((o) => o.id === id);

  return (
    <ModalList
      visible={visible}
      title={title}
      options={listOptions}
      selectedId={selectedId ?? null}
      loading={loading}
      onSelect={(picked) => {
        const found = original(picked.id);
        if (found) onSelect(found);
      }}
      onClose={onClose}
      multiSelect={
        multiSelect
          ? {
              selectedIds: multiSelect.selected.map((o) => o.id),
              onToggle: (picked) => {
                const found = original(picked.id);
                if (found) multiSelect.onToggle(found);
              },
              onConfirm: multiSelect.onConfirm,
              confirmLabel: multiSelect.confirmLabel,
              footerText: multiSelect.footerText,
            }
          : undefined
      }
    />
  );
};

export default GeoPickerModal;
