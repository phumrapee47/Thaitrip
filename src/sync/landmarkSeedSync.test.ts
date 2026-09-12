// T66 / US-17 AC3: unit tests for the `landmarks` table seed/sync logic,
// against a mocked Supabase client only (same pattern as syncEngine.test.ts —
// no real Supabase project exists in this environment).
import { seedLandmarksToSupabase, landmarkToRemoteRow } from './landmarkSeedSync';
import { LANDMARKS } from '../data/thailand-landmarks';

jest.mock('../lib/supabaseClient');
const clientMock = require('../lib/supabaseClient');

describe('landmarkToRemoteRow (T66)', () => {
  it('maps camelCase Landmark fields to the snake_case Supabase schema', () => {
    const row = landmarkToRemoteRow({ id: 'l1', provinceId: 'phuket', nameTh: 'ชื่อ', lat: 7.8, lng: 98.3 });
    expect(row).toEqual({ id: 'l1', province_id: 'phuket', name_th: 'ชื่อ', lat: 7.8, lng: 98.3 });
  });

  it('maps a missing lat/lng (T62 optional fields) to null, not undefined/NaN', () => {
    const row = landmarkToRemoteRow({ id: 'l2', provinceId: 'phuket', nameTh: 'ไม่มีพิกัด' });
    expect(row.lat).toBeNull();
    expect(row.lng).toBeNull();
  });
});

describe('seedLandmarksToSupabase (T66)', () => {
  beforeEach(() => {
    clientMock._resetSupabaseClientForTests();
  });

  it('does nothing and never throws when Supabase is unconfigured (T33 graceful degradation)', async () => {
    clientMock.__setConfigured(false);
    const result = await seedLandmarksToSupabase();
    expect(result).toEqual({ attempted: 0, synced: 0, failed: false });
  });

  it('upserts every local landmark keyed on id when configured', async () => {
    const upsert = jest.fn(() => Promise.resolve({ error: null }));
    const from = jest.fn(() => ({ upsert }));
    clientMock.__setMockClient({ from });

    const result = await seedLandmarksToSupabase();

    expect(from).toHaveBeenCalledWith('landmarks');
    expect(upsert).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: LANDMARKS[0].id })]),
      { onConflict: 'id' }
    );
    expect(result).toEqual({ attempted: LANDMARKS.length, synced: LANDMARKS.length, failed: false });
  });

  it('reports failed:true without throwing when the upsert errors', async () => {
    const upsert = jest.fn(() => Promise.resolve({ error: { message: 'network down' } }));
    const from = jest.fn(() => ({ upsert }));
    clientMock.__setMockClient({ from });

    const result = await seedLandmarksToSupabase();
    expect(result).toEqual({ attempted: LANDMARKS.length, synced: 0, failed: true });
  });
});
