/**
 * CountryPickerModal — the phone-country picker (T-036).
 *
 * The same markup existed **three times** (`PhoneRegistrationScreen`,
 * `UserDetailsScreen`, `EditProfileScreen`), each with its own copy of the overlay
 * styles. Migrating three identical copies onto the shared shell would have kept the
 * duplication, so they collapse into this one component instead.
 */

import React, { useMemo } from 'react';
import { ModalList, type ModalListOption } from './ModalList';
import { useTranslation } from '../hooks/useTranslation';
import type { CountryOption } from '../types/country';

interface CountryPickerModalProps {
  visible: boolean;
  countries: CountryOption[];
  selected?: CountryOption | null;
  onSelect: (country: CountryOption) => void;
  onClose: () => void;
}

/** Matches the composite key the screens already used — `id` is not always present. */
const keyOf = (country: CountryOption) =>
  `${country.id ?? country.code}-${country.name}`;

export const CountryPickerModal: React.FC<CountryPickerModalProps> = ({
  visible,
  countries,
  selected,
  onSelect,
  onClose,
}) => {
  const { t } = useTranslation();

  const options = useMemo<ModalListOption[]>(
    () =>
      countries.map((country) => ({
        id: keyOf(country),
        label: `${country.flag ?? '🌐'}  ${country.name}`,
        sublabel: country.code,
      })),
    [countries]
  );

  return (
    <ModalList
      visible={visible}
      title={t('phoneRegistration.selectCountry')}
      options={options}
      selectedId={selected ? keyOf(selected) : null}
      // The list is long enough to be worth searching, and users know their country.
      searchable={countries.length > 8}
      onSelect={(picked) => {
        const original = countries.find((country) => keyOf(country) === picked.id);
        if (original) onSelect(original);
      }}
      onClose={onClose}
    />
  );
};

export default CountryPickerModal;
