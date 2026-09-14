/**
 * T-118 step 3 — the harness's proof, on the smallest real control.
 *
 * `SegmentedModes` is rendered THROUGH `renderScreen`, so a green run here proves the whole
 * provider stack mounts (navigator, safe area, auth stub, dialog) — not just the component.
 * The radius assertion pins the defect T-101 step 17b found in BOTH apps: the segment read
 * the deprecated 24 alias on a control measured at 12, and nobody saw it because nothing had
 * run on a device. Identical to the user app's copy on purpose.
 */
import React from 'react';
import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, screen } from '@testing-library/react-native';

import { renderScreen } from '../../test/render';
import { theme } from '../../themes';
import { SegmentedModes } from './SegmentedModes';

const MODES = [
  { key: 'active', label: 'Faol', count: 2 },
  { key: 'waiting', label: 'Kutilmoqda', count: 0 },
  { key: 'history', label: 'Tarix' },
] as const;

const noop = () => undefined;

describe('SegmentedModes', () => {
  it('renders one tab per mode, the count folded into the accessible name', async () => {
    await renderScreen(<SegmentedModes modes={MODES} value="active" onChange={noop} />);
    expect(screen.getAllByRole('tab')).toHaveLength(3);
    expect(screen.getByRole('tab', { name: 'Faol, 2' })).toBeOnTheScreen();
    // A zero is still a count — the pill is drawn, the name carries it.
    expect(screen.getByRole('tab', { name: 'Kutilmoqda, 0' })).toBeOnTheScreen();
    expect(screen.getByText('0')).toBeOnTheScreen();
    // No count → the bare label, no pill (the driver's `DriverQidiruv` strip).
    expect(screen.getByRole('tab', { name: 'Tarix' })).toBeOnTheScreen();
  });

  it('marks only the current mode as selected', async () => {
    await renderScreen(<SegmentedModes modes={MODES} value="waiting" onChange={noop} />);
    expect(screen.getByRole('tab', { name: 'Kutilmoqda, 0' })).toBeSelected();
    expect(screen.getByRole('tab', { name: 'Faol, 2' })).not.toBeSelected();
    expect(screen.getByRole('tab', { name: 'Tarix' })).not.toBeSelected();
  });

  it('a press reports the pressed key, once', async () => {
    const onChange = jest.fn<(key: string) => void>();
    await renderScreen(<SegmentedModes modes={MODES} value="active" onChange={onChange} />);
    fireEvent.press(screen.getByRole('tab', { name: 'Tarix' }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('history');
  });

  it('draws the rounded segment at the measured 12, not the 24 alias (17b)', async () => {
    await renderScreen(<SegmentedModes modes={MODES} value="active" onChange={noop} />);
    expect(screen.getByRole('tab', { name: 'Faol, 2' })).toHaveStyle({ borderRadius: 12 });
  });

  it('the pill shape is fully rounded', async () => {
    await renderScreen(
      <SegmentedModes modes={MODES} value="active" onChange={noop} shape="pill" />,
    );
    expect(screen.getByRole('tab', { name: 'Faol, 2' })).toHaveStyle({
      borderRadius: theme.borderRadius.full,
    });
  });
});
