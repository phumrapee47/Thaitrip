// T67 / US-18: component-level tests for the Landmark Map (points + no-points
// fallback + tap-to-toggle wired through the same callback contract as
// LandmarkListItem). Geometry math itself (bounding box, normalize, degenerate
// cases) is unit-tested in src/utils/landmarkMap.test.ts — this file only
// checks the React wiring on top of it.
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import LandmarkMap from './LandmarkMap';
import type { Landmark } from '../data/thailand-landmarks';

const landmarksWithCoords: Landmark[] = [
  { id: 'l1', provinceId: 'p', nameTh: 'จุดเอ', lat: 10, lng: 100 },
  { id: 'l2', provinceId: 'p', nameTh: 'จุดบี', lat: 12, lng: 102 },
];

describe('LandmarkMap (T67 / US-18)', () => {
  it('renders a tappable point per landmark that has coordinates, with an accessibility label matching the list contract', async () => {
    await render(<LandmarkMap landmarks={landmarksWithCoords} checkins={{}} onToggle={jest.fn()} />);
    expect(screen.getByLabelText('จุดเอ, ยังไม่ได้เช็คอิน')).toBeTruthy();
    expect(screen.getByLabelText('จุดบี, ยังไม่ได้เช็คอิน')).toBeTruthy();
  });

  it('reflects check-in state in the accessibility label (visited vs not)', async () => {
    await render(<LandmarkMap landmarks={landmarksWithCoords} checkins={{ l1: true }} onToggle={jest.fn()} />);
    expect(screen.getByLabelText('จุดเอ, เช็คอินแล้ว')).toBeTruthy();
    expect(screen.getByLabelText('จุดบี, ยังไม่ได้เช็คอิน')).toBeTruthy();
  });

  it('tapping a point calls onToggle with the same (landmarkId, provinceId) contract as LandmarkListItem (US-18 AC3)', async () => {
    const onToggle = jest.fn();
    await render(<LandmarkMap landmarks={landmarksWithCoords} checkins={{}} onToggle={onToggle} />);
    fireEvent.press(screen.getByLabelText('จุดเอ, ยังไม่ได้เช็คอิน'));
    expect(onToggle).toHaveBeenCalledWith('l1', 'p');
  });

  it('excludes landmarks with no coordinates from the map but never errors (US-18 AC2)', async () => {
    const mixed: Landmark[] = [...landmarksWithCoords, { id: 'l3', provinceId: 'p', nameTh: 'ไม่มีพิกัด' }];
    await render(<LandmarkMap landmarks={mixed} checkins={{}} onToggle={jest.fn()} />);
    expect(screen.queryByLabelText(/ไม่มีพิกัด/)).toBeNull();
    // The ones with coordinates still render fine alongside it.
    expect(screen.getByLabelText('จุดเอ, ยังไม่ได้เช็คอิน')).toBeTruthy();
  });

  it('shows the no-points fallback message (not a blank/erroring map) when nothing has coordinates', async () => {
    const noCoords: Landmark[] = [{ id: 'l1', provinceId: 'p', nameTh: 'ไม่มีพิกัด' }];
    await render(<LandmarkMap landmarks={noCoords} checkins={{}} onToggle={jest.fn()} />);
    expect(screen.getByText('ยังไม่มีข้อมูลตำแหน่งสำหรับสถานที่แนะนำของจังหวัดนี้')).toBeTruthy();
  });
});
