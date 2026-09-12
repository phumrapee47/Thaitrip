// Integration-level check on the province dataset itself (US-1 AC1, US-7 AC1).
// This is what every map screen (2D validation + 3D home map) renders from directly.
import { PROVINCES, MAP_WIDTH, MAP_HEIGHT } from '../../data/thailand-provinces';
import { TOTAL_PROVINCES } from '../../utils/derived';

describe('thailand-provinces dataset (US-1 AC1 / US-7 AC1)', () => {
  it('contains exactly 76 provinces (Bueng Kan excluded)', () => {
    expect(PROVINCES).toHaveLength(76);
    expect(PROVINCES).toHaveLength(TOTAL_PROVINCES);
  });

  it('does not contain Bueng Kan', () => {
    const buengKan = PROVINCES.find(
      (p) => p.id.includes('bueng-kan') || p.nameEn.toLowerCase().includes('bueng kan')
    );
    expect(buengKan).toBeUndefined();
  });

  it('has no duplicate province ids', () => {
    const ids = PROVINCES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every province has a non-empty id, nameEn, nameTh, region, path and centroid', () => {
    const validRegions = ['north', 'northeast', 'central', 'east', 'west', 'south'];
    for (const p of PROVINCES) {
      expect(p.id.length).toBeGreaterThan(0);
      expect(p.nameEn.length).toBeGreaterThan(0);
      expect(p.nameTh.length).toBeGreaterThan(0);
      expect(validRegions).toContain(p.region);
      expect(p.path.startsWith('M ')).toBe(true);
      expect(p.path.trim().endsWith('Z')).toBe(true);
      expect(p.centroid).toHaveLength(2);
      expect(p.centroid[0]).toBeGreaterThanOrEqual(0);
      expect(p.centroid[0]).toBeLessThanOrEqual(MAP_WIDTH);
      expect(p.centroid[1]).toBeGreaterThanOrEqual(0);
      expect(p.centroid[1]).toBeLessThanOrEqual(MAP_HEIGHT);
    }
  });

  it('includes a small-area province (Samut Songkhram) used by the tap-target AC', () => {
    const samutSongkhram = PROVINCES.find((p) => p.id === 'samut-songkhram');
    expect(samutSongkhram).toBeDefined();
  });
});
