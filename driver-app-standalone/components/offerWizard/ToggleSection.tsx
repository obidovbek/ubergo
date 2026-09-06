/**
 * A standalone yes/no row, optionally revealing more when it is on — step 16b.
 *
 * The artboard's "Qo'shimcha shartlar" block and the three loose toggles the screen
 * grew around it (jo'natma, yo'lda olish, to'lishi bilan yuraman) are the same
 * control: one chip, and fields that only mean anything once it is on.
 *
 * ⚠️ `children` render ONLY when `on`. That is not a styling choice — a parcel price
 * with no parcel accepted, or a pickup note with no pickup, are fields the driver
 * cannot see and cannot correct.
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SectionCard } from './SectionCard';
import { ToggleChip } from './ToggleChip';
import { space } from '../../themes';

interface ToggleSectionProps {
  /** Optional — these rows often stand alone, with the chip as their own label. */
  title?: string;
  label: string;
  on: boolean;
  onToggle: () => void;
  helper?: string;
  children?: React.ReactNode;
}

export const ToggleSection: React.FC<ToggleSectionProps> = ({
  title,
  label,
  on,
  onToggle,
  helper,
  children,
}) => (
  <SectionCard title={title} helper={helper}>
    <ToggleChip label={label} on={on} onPress={onToggle} />
    {on && !!children && <View style={styles.revealed}>{children}</View>}
  </SectionCard>
);

const styles = StyleSheet.create({
  revealed: {
    marginTop: space.xl,
  },
});

export default ToggleSection;
