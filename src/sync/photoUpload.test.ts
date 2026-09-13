// T41/T56 — photo upload sync unit tests against a mocked Supabase Storage client.
import { uploadPendingPhotos } from './photoUpload';

jest.mock('../storage/db');
jest.mock('../lib/supabaseClient');

const dbMock = require('../storage/db');
const clientMock = require('../lib/supabaseClient');

function makeStorageStub(overrides: { uploadError?: any; publicUrl?: string } = {}) {
  const upload = jest.fn(() => Promise.resolve({ error: overrides.uploadError ?? null }));
  const getPublicUrl = jest.fn(() => ({ data: { publicUrl: overrides.publicUrl ?? 'https://cdn.example.com/photo.jpg' } }));
  const from = jest.fn(() => ({ upload, getPublicUrl }));
  return { storage: { from }, __internals: { upload, getPublicUrl, from } };
}

describe('uploadPendingPhotos (T41 / US-13)', () => {
  beforeEach(() => {
    dbMock.__seed([]);
    clientMock._resetSupabaseClientForTests();
  });

  it('does nothing when Supabase is unconfigured (graceful offline degradation)', async () => {
    clientMock.__setConfigured(false);
    dbMock.__seed([
      { id: 'e1', provinceId: 'phuket', date: '2026-01-01', title: 'A', notes: '', photoUris: ['file:///local/a.jpg'], tags: [] },
    ]);
    const result = await uploadPendingPhotos();
    expect(result).toEqual({ attempted: 0, uploaded: 0, failed: 0 });
    expect(dbMock.__getStore()[0].photoUris).toEqual(['file:///local/a.jpg']);
  });

  it('uploads a local-URI photo and rewrites the entry photoUris with the cloud URL', async () => {
    const stub = makeStorageStub({ publicUrl: 'https://cdn.example.com/e1/0-a.jpg' });
    clientMock.__setMockClient(stub);
    dbMock.__seed([
      { id: 'e1', provinceId: 'phuket', date: '2026-01-01', title: 'A', notes: '', photoUris: ['file:///local/a.jpg'], tags: [] },
    ]);
    const readAsBase64 = jest.fn(() => Promise.resolve('ZmFrZQ=='));

    const result = await uploadPendingPhotos({ readAsBase64 });

    expect(result).toEqual({ attempted: 1, uploaded: 1, failed: 0 });
    expect(dbMock.__getStore()[0].photoUris).toEqual(['https://cdn.example.com/e1/0-a.jpg']);
  });

  it('leaves already-uploaded (https) photos untouched and never re-uploads them', async () => {
    const stub = makeStorageStub();
    clientMock.__setMockClient(stub);
    dbMock.__seed([
      {
        id: 'e1',
        provinceId: 'phuket',
        date: '2026-01-01',
        title: 'A',
        notes: '',
        photoUris: ['https://cdn.example.com/already-uploaded.jpg'],
        tags: [],
      },
    ]);

    const result = await uploadPendingPhotos({ readAsBase64: jest.fn() });

    expect(result).toEqual({ attempted: 0, uploaded: 0, failed: 0 });
    expect(stub.__internals.upload).not.toHaveBeenCalled();
  });

  it('keeps the local URI and reports failure (for retry) when the upload errors, without creating duplicates', async () => {
    const stub = makeStorageStub({ uploadError: { message: 'network dropped' } });
    clientMock.__setMockClient(stub);
    dbMock.__seed([
      { id: 'e1', provinceId: 'phuket', date: '2026-01-01', title: 'A', notes: '', photoUris: ['file:///local/a.jpg'], tags: [] },
    ]);

    const result = await uploadPendingPhotos({ readAsBase64: jest.fn(() => Promise.resolve('ZmFrZQ==')) });

    expect(result).toEqual({ attempted: 1, uploaded: 0, failed: 1 });
    // Local URI preserved (entry still usable offline, US-13 AC1/AC3) so a later retry can pick it up.
    expect(dbMock.__getStore()[0].photoUris).toEqual(['file:///local/a.jpg']);
  });

  it('uploads only the still-local photos in a mixed entry, leaving already-cloud ones alone', async () => {
    const stub = makeStorageStub({ publicUrl: 'https://cdn.example.com/e1/1-b.jpg' });
    clientMock.__setMockClient(stub);
    dbMock.__seed([
      {
        id: 'e1',
        provinceId: 'phuket',
        date: '2026-01-01',
        title: 'A',
        notes: '',
        photoUris: ['https://cdn.example.com/already.jpg', 'file:///local/b.jpg'],
        tags: [],
      },
    ]);

    const result = await uploadPendingPhotos({ readAsBase64: jest.fn(() => Promise.resolve('ZmFrZQ==')) });

    expect(result).toEqual({ attempted: 1, uploaded: 1, failed: 0 });
    expect(dbMock.__getStore()[0].photoUris).toEqual([
      'https://cdn.example.com/already.jpg',
      'https://cdn.example.com/e1/1-b.jpg',
    ]);
  });
});
