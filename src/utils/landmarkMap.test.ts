import { landmarksWithCoords, computeBoundingBox, normalizePoint } from './landmarkMap';
import type { Landmark } from '../data/thailand-landmarks';

describe('landmarksWithCoords (T67 / US-18 AC2)', () => {
  it('keeps only landmarks with both lat and lng present and finite', () => {
    const landmarks: Landmark[] = [
      { id: 'a', provinceId: 'p', nameTh: 'A', lat: 1, lng: 2 },
      { id: 'b', provinceId: 'p', nameTh: 'B' }, // no coords at all
      { id: 'c', provinceId: 'p', nameTh: 'C', lat: 1 }, // lng missing
      { id: 'd', provinceId: 'p', nameTh: 'D', lat: NaN, lng: 2 }, // guards against NaN
    ];
    const result = landmarksWithCoords(landmarks);
    expect(result.map((l) => l.id)).toEqual(['a']);
  });

  it('returns an empty array (not an error) when nothing has coordinates', () => {
    const landmarks: Landmark[] = [{ id: 'a', provinceId: 'p', nameTh: 'A' }];
    expect(landmarksWithCoords(landmarks)).toEqual([]);
  });
});

describe('computeBoundingBox (T67)', () => {
  it('computes min/max lat/lng across the given points', () => {
    const points = [
      { id: 'a', provinceId: 'p', nameTh: 'A', lat: 10, lng: 100 },
      { id: 'b', provinceId: 'p', nameTh: 'B', lat: 12, lng: 98 },
      { id: 'c', provinceId: 'p', nameTh: 'C', lat: 8, lng: 99 },
    ];
    expect(computeBoundingBox(points)).toEqual({ minLat: 8, maxLat: 12, minLng: 98, maxLng: 100 });
  });
});

describe('normalizePoint (T67 / US-18, design-spec normalize formula)', () => {
  const bbox = { minLat: 10, maxLat: 20, minLng: 100, maxLng: 110 };

  it('places the min corner at (padding, height-padding) — south-west is bottom-left', () => {
    const p = normalizePoint(10, 100, bbox, 200, 100, 20);
    expect(p.x).toBeCloseTo(20);
    expect(p.y).toBeCloseTo(80); // lowest lat -> bottom of the image
  });

  it('places the max corner at (width-padding, padding) — north-east is top-right', () => {
    const p = normalizePoint(20, 110, bbox, 200, 100, 20);
    expect(p.x).toBeCloseTo(180);
    expect(p.y).toBeCloseTo(20); // highest lat -> top of the image
  });

  it('places the midpoint at the visual center of the padded box', () => {
    const p = normalizePoint(15, 105, bbox, 200, 100, 20);
    expect(p.x).toBeCloseTo(100);
    expect(p.y).toBeCloseTo(50);
  });

  it('never divides by zero / produces NaN when lat span is degenerate (single point or all-equal lat)', () => {
    const degenerate = { minLat: 15, maxLat: 15, minLng: 100, maxLng: 110 };
    const p = normalizePoint(15, 105, degenerate, 200, 100, 20);
    expect(p).toEqual({ x: 100, y: 50 });
    expect(Number.isNaN(p.x)).toBe(false);
    expect(Number.isNaN(p.y)).toBe(false);
  });

  it('never divides by zero / produces NaN when lng span is degenerate', () => {
    const degenerate = { minLat: 10, maxLat: 20, minLng: 105, maxLng: 105 };
    const p = normalizePoint(15, 105, degenerate, 200, 100, 20);
    expect(p).toEqual({ x: 100, y: 50 });
    expect(Number.isNaN(p.x)).toBe(false);
    expect(Number.isNaN(p.y)).toBe(false);
  });

  it('handles a fully degenerate bbox (single landmark, minLat=maxLat AND minLng=maxLng)', () => {
    const degenerate = { minLat: 15, maxLat: 15, minLng: 105, maxLng: 105 };
    const p = normalizePoint(15, 105, degenerate, 160, 120, 12);
    expect(p).toEqual({ x: 80, y: 60 });
  });
});
