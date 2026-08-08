/**
 * Geo Select Modal
 * Searchable single-choice list used by the route cards of the order screen.
 * Extracted from CreatePassengerOfferScreen, where the same markup existed
 * twice (once for "from", once for "to").
 *
 * T-036: the markup moved to the shared `ModalList`, so this is now a thin adapter —
 * it maps `GeoOption` to the generic option shape and hands the choice back untouched.
 * The public props are unchanged on purpose: `LocationCard` did not have to move.
 */

import React, { useMemo } from 'react';
import { ModalList, type ModalListOption } from '../ModalList';
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
  const listOptions = useMemo<ModalListOption[]>(
    () => options.map((option) => ({ id: option.id, label: option.name })),
    [options]
  );

  const handleSelect = (picked: ModalListOption) => {
    // Hand back the ORIGINAL object, not the mapped one — callers read `latitude`,
    // `longitude` and `type` off it, none of which survive the mapping.
    const original = options.find((option) => option.id === picked.id);
    if (original) onSelect(original);
  };

  return (
    <ModalList
      visible={visible}
      title={title}
      options={listOptions}
      selectedId={selectedId ?? null}
      loading={loading}
      onSelect={handleSelect}
      onClose={onClose}
    />
  );
};

export default GeoSelectModal;
