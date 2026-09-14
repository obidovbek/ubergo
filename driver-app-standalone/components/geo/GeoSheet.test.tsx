/**
 * T-118 step 4 — `GeoSheet`'s QFY rule, the walk item no checker covered.
 *
 * `PLAN-T102c3.md` §6 item 3: *"ticking a second district must CLEAR the QFYs — if it fails
 * the offer claims precision in a district the driver never picked, and nothing throws."*
 * `check-offer-restore.mjs` proves `canPickSettlements` and `buildOfferPlaces` in isolation;
 * nothing proved the SHEET obeys the rule it is handed. This does, the way the wizard mounts
 * it: `multiSelectAt` at both adm2 and adm3, `endLevel` `settlement` for an endpoint and
 * `district` for a stop, `canAdvance={canPickSettlements}`.
 *
 * The geo API is mocked at the module boundary; the rows are real Farg‘ona places with
 * ASCII spellings so the fixture never depends on an apostrophe.
 */
import React from 'react';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, screen } from '@testing-library/react-native';

import {
  fetchGeoCityDistricts,
  fetchGeoCountries,
  fetchGeoProvinces,
  fetchGeoSettlements,
  type GeoOption,
} from '../../api/geo';
import { renderScreen } from '../../test/render';
import { canPickSettlements } from '../../utils/offerRestore';
import { GeoSheet, type GeoLevel, type GeoPath } from './GeoSheet';

jest.mock('../../api/geo');

const UZ: GeoOption = { id: 1, name: 'Ozbekiston' };
const FARGONA: GeoOption = { id: 10, name: 'Fargona viloyati' };
const QOQON: GeoOption = { id: 101, name: 'Qoqon' };
const RISHTON: GeoOption = { id: 102, name: 'Rishton' };
const YAYPAN: GeoOption = { id: 1001, name: 'Yaypan' };
const CHIMYON: GeoOption = { id: 1002, name: 'Chimyon' };

/** What the wizard passes — see `OfferWizardScreen.tsx`, the `<GeoSheet>` call. */
const MULTI: readonly GeoLevel[] = ['district', 'settlement'];

const mountSheet = (endLevel: GeoLevel, startLevel: GeoLevel = 'district') => {
  const onDone = jest.fn<(path: GeoPath) => void>();
  const onClose = jest.fn<() => void>();
  const rendered = renderScreen(
    <GeoSheet
      visible
      title="Qayerdan"
      startLevel={startLevel}
      endLevel={endLevel}
      multiSelectAt={MULTI}
      canAdvance={canPickSettlements}
      initialPath={startLevel === 'district' ? { country: UZ, province: FARGONA } : undefined}
      onDone={onDone}
      onClose={onClose}
    />,
  );
  return { rendered, onDone, onClose };
};

const donePath = (onDone: jest.Mock<(path: GeoPath) => void>): GeoPath => {
  expect(onDone).toHaveBeenCalledTimes(1);
  return onDone.mock.calls[0][0];
};

beforeEach(() => {
  jest.mocked(fetchGeoCountries).mockResolvedValue([UZ]);
  jest.mocked(fetchGeoProvinces).mockResolvedValue([FARGONA]);
  jest.mocked(fetchGeoCityDistricts).mockResolvedValue([QOQON, RISHTON]);
  jest.mocked(fetchGeoSettlements).mockResolvedValue([YAYPAN, CHIMYON]);
});

describe('GeoSheet — the QFY step (T-102c-3)', () => {
  it('one district → Tayyor → the QFY level opens, and the chosen QFY is returned', async () => {
    const { rendered, onDone } = mountSheet('settlement');
    await rendered;

    fireEvent.press(await screen.findByText('Qoqon'));
    fireEvent.press(screen.getByText('Tayyor (1)'));

    // The cascade CONTINUED: settlements were fetched for exactly that district.
    expect(await screen.findByText('Yaypan')).toBeOnTheScreen();
    expect(fetchGeoSettlements).toHaveBeenCalledWith(QOQON.id);
    expect(onDone).not.toHaveBeenCalled();

    fireEvent.press(screen.getByText('Yaypan'));
    fireEvent.press(screen.getByText('Tayyor (1)'));

    const path = donePath(onDone);
    expect(path.districts).toEqual([QOQON]);
    expect(path.district).toEqual(QOQON);
    expect(path.settlements).toEqual([YAYPAN]);
    expect(path.settlement).toEqual(YAYPAN);
  });

  it('two districts → Tayyor → done at the district level, with NO settlements key', async () => {
    const { rendered, onDone } = mountSheet('settlement');
    await rendered;

    fireEvent.press(await screen.findByText('Qoqon'));
    fireEvent.press(screen.getByText('Rishton'));
    fireEvent.press(screen.getByText('Tayyor (2)'));

    const path = donePath(onDone);
    expect(path.districts).toEqual([QOQON, RISHTON]);
    expect(path.district).toEqual(QOQON);
    expect(path).not.toHaveProperty('settlements');
    expect(path).not.toHaveProperty('settlement');
    expect(fetchGeoSettlements).not.toHaveBeenCalled();
  });

  it('ticking a second district CLEARS the QFYs already chosen (walk item 3)', async () => {
    const { rendered, onDone } = mountSheet('settlement');
    await rendered;

    // Choose one district, go into its QFYs, tick one…
    fireEvent.press(await screen.findByText('Qoqon'));
    fireEvent.press(screen.getByText('Tayyor (1)'));
    fireEvent.press(await screen.findByText('Yaypan'));
    expect(screen.getByText('Tayyor (1)')).toBeOnTheScreen();

    // …then step back and widen the endpoint to a second district.
    fireEvent.press(screen.getByRole('button', { name: 'Ortga' }));
    fireEvent.press(await screen.findByText('Rishton'));
    fireEvent.press(screen.getByText('Tayyor (2)'));

    const path = donePath(onDone);
    expect(path.districts).toEqual([QOQON, RISHTON]);
    expect(path).not.toHaveProperty('settlements');
    expect(path).not.toHaveProperty('settlement');
  });

  it('a stop row (endLevel district) never offers QFYs, even for one district', async () => {
    const { rendered, onDone } = mountSheet('district');
    await rendered;

    fireEvent.press(await screen.findByText('Qoqon'));
    fireEvent.press(screen.getByText('Tayyor (1)'));

    const path = donePath(onDone);
    expect(path.districts).toEqual([QOQON]);
    expect(path).not.toHaveProperty('settlements');
    expect(fetchGeoSettlements).not.toHaveBeenCalled();
  });

  it('at the QFY level, skipping is an answer: "Butun tuman" returns an EMPTY settlements list', async () => {
    const { rendered, onDone } = mountSheet('settlement');
    await rendered;

    fireEvent.press(await screen.findByText('Qoqon'));
    fireEvent.press(screen.getByText('Tayyor (1)'));
    await screen.findByText('Yaypan');

    fireEvent.press(screen.getByText('Butun tuman'));

    const path = donePath(onDone);
    expect(path.districts).toEqual([QOQON]);
    expect(path.settlements).toEqual([]);
    expect(path.settlement).toBeUndefined();
  });

  it('at the district level, zero is NOT an answer: the footer is disabled and does nothing', async () => {
    const { rendered, onDone } = mountSheet('settlement');
    await rendered;
    await screen.findByText('Qoqon');

    const footer = screen.getByRole('button', { name: 'Tayyor' });
    expect(footer).toBeDisabled();
    fireEvent.press(footer);
    expect(onDone).not.toHaveBeenCalled();
  });

  it('walks the whole cascade from the country, single levels advancing on tap', async () => {
    const { rendered, onDone } = mountSheet('settlement', 'country');
    await rendered;

    fireEvent.press(await screen.findByText('Ozbekiston'));
    fireEvent.press(await screen.findByText('Fargona viloyati'));
    fireEvent.press(await screen.findByText('Rishton'));
    fireEvent.press(screen.getByText('Tayyor (1)'));
    fireEvent.press(await screen.findByText('Chimyon'));
    fireEvent.press(screen.getByText('Tayyor (1)'));

    const path = donePath(onDone);
    expect(path.country).toEqual(UZ);
    expect(path.province).toEqual(FARGONA);
    expect(path.districts).toEqual([RISHTON]);
    expect(path.settlements).toEqual([CHIMYON]);
  });
});
