/**
 * PhotoSourceModal — "camera or gallery?" in the app's own chrome (T-057).
 *
 * Five registration screens (`DriverLicense`, `DriverPassport`,
 * `DriverPersonalInfo`, `DriverTaxiLicense`, `DriverVehicle`) each opened the
 * bare OS `Alert.alert` with three buttons for this. That is the one place the
 * app dropped out of its own design on every photo upload.
 *
 * ⚠️ It is NOT a `ConfirmDialog`: that renders one action plus an optional
 * cancel, and this needs **two real choices**. `ModalList` is the shape the
 * project already uses for "pick one of these" (17 of the app's modals), so this
 * is a thin, fixed-option wrapper rather than a new kind of dialog.
 *
 * Uncontrolled by design: the caller owns `visible` and remembers WHICH photo is
 * being replaced — the modal only answers camera-or-gallery.
 */

import React from 'react';
import { ModalList, type ModalListOption } from './ModalList';
import { useTranslation } from '../hooks/useTranslation';

/** Matches `pickImage`'s existing second argument — 'library', not 'gallery'. */
export type PhotoSource = 'camera' | 'library';

interface PhotoSourceModalProps {
  visible: boolean;
  onSelect: (source: PhotoSource) => void;
  onClose: () => void;
  /** Defaults to the generic "select a photo" heading. */
  title?: string;
}

export const PhotoSourceModal: React.FC<PhotoSourceModalProps> = ({
  visible,
  onSelect,
  onClose,
  title,
}) => {
  const { t } = useTranslation();

  const options: ModalListOption[] = [
    { id: 'camera', label: t('common.camera') },
    { id: 'library', label: t('common.gallery') },
  ];

  return (
    <ModalList
      visible={visible}
      title={title ?? t('common.selectPhoto')}
      options={options}
      // Two fixed rows — a search box would be absurd.
      searchable={false}
      onSelect={(option) => onSelect(option.id as PhotoSource)}
      onClose={onClose}
    />
  );
};

export default PhotoSourceModal;
