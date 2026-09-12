import { getLandmarkProgress, isProvinceMaster } from './landmarkDerived';
import type { Landmark } from '../data/thailand-landmarks';

const landmarks: Landmark[] = [
  { id: 'l1', provinceId: 'phuket', nameTh: 'A' },
  { id: 'l2', provinceId: 'phuket', nameTh: 'B' },
  { id: 'l3', provinceId: 'phuket', nameTh: 'C' },
  { id: 'l4', provinceId: 'krabi', nameTh: 'D' },
];

describe('getLandmarkProgress (T36 / US-8 AC3)', () => {
  it('counts only landmarks belonging to the requested province', () => {
    const progress = getLandmarkProgress('phuket', landmarks, { l1: true });
    expect(progress).toEqual({ checkedInCount: 1, totalCount: 3 });
  });

  it('returns 0/0 for a province with no seeded landmarks (US-8 AC4 empty-state branch)', () => {
    const progress = getLandmarkProgress('bueng-kan-imaginary', landmarks, {});
    expect(progress).toEqual({ checkedInCount: 0, totalCount: 0 });
  });

  it('ignores checkins belonging to a different province landmark id namespace', () => {
    const progress = getLandmarkProgress('krabi', landmarks, { l1: true, l2: true, l3: true });
    expect(progress).toEqual({ checkedInCount: 0, totalCount: 1 });
  });
});

describe('isProvinceMaster (T36 / US-9)', () => {
  it('is false when 0 landmarks exist for the province (US-9 AC3 — no base to compare)', () => {
    expect(isProvinceMaster({ checkedInCount: 0, totalCount: 0 })).toBe(false);
  });

  it('is false when only some landmarks are checked in', () => {
    expect(isProvinceMaster({ checkedInCount: 2, totalCount: 3 })).toBe(false);
  });

  it('is true when every landmark (>=1) is checked in', () => {
    expect(isProvinceMaster({ checkedInCount: 3, totalCount: 3 })).toBe(true);
    expect(isProvinceMaster({ checkedInCount: 1, totalCount: 1 })).toBe(true);
  });

  it('recomputes live: toggling one check-in back off immediately revokes master status (US-9 AC2)', () => {
    let progress = getLandmarkProgress('phuket', landmarks, { l1: true, l2: true, l3: true });
    expect(isProvinceMaster(progress)).toBe(true);

    // User un-checks one landmark.
    progress = getLandmarkProgress('phuket', landmarks, { l1: true, l2: false, l3: true });
    expect(isProvinceMaster(progress)).toBe(false);
  });
});
