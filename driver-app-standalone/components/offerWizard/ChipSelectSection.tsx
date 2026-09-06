/**
 * A section whose whole content is a row of chips — T-101 step 16b.
 *
 * `DriverElon.dc.html` draws "To'lov turi", "Avto turi" and "Qo'shimcha shartlar"
 * identically: an eyebrow and a wrapping chip row. In the screen they were three
 * hand-rolled copies of the same 25 lines, differing only in what they iterated.
 *
 * 🔴 The one real difference between them is SELECTION BEHAVIOUR, and it stays with
 * the caller's `onToggle` rather than becoming a `mode` prop here — because getting
 * it wrong is a data bug, not a styling one, and it should be readable at the call
 * site:
 *   To'lov turi   INDEPENDENT toggles. T-031's lesson on the passenger side was that
 *                 one shared value makes the pair behave as a radio group, so picking
 *                 card silently cleared cash.
 *   Avto turi     a DESELECTABLE radio — tapping the active chip clears it.
 *   Shartlar      independent toggles again.
 */

import React from 'react';
import type { ViewStyle } from 'react-native';
import { SectionCard } from './SectionCard';
import { ToggleChip, ToggleChipRow } from './ToggleChip';

export interface ChipOption<T extends string> {
  value: T;
  label: string;
}

interface ChipSelectSectionProps<T extends string> {
  title: string;
  options: readonly ChipOption<T>[];
  /** Every value drawn as "on". A radio section passes an array of nought or one. */
  selected: readonly T[];
  onToggle: (value: T) => void;
  /** The artboard stretches the payment pair edge to edge; the rest hug. */
  layout?: 'hug' | 'fill';
  helper?: string;
  error?: string;
  style?: ViewStyle;
}

export function ChipSelectSection<T extends string>({
  title,
  options,
  selected,
  onToggle,
  layout = 'hug',
  helper,
  error,
  style,
}: ChipSelectSectionProps<T>) {
  return (
    <SectionCard title={title} helper={helper} error={error} style={style}>
      <ToggleChipRow>
        {options.map((option) => (
          <ToggleChip
            key={option.value}
            label={option.label}
            layout={layout}
            on={selected.includes(option.value)}
            onPress={() => onToggle(option.value)}
          />
        ))}
      </ToggleChipRow>
    </SectionCard>
  );
}

export default ChipSelectSection;
