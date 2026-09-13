import { detectCategory, fetchAttractionsForProvince, searchAttractionsGlobal } from './wikipediaService';

describe('wikipediaService', () => {
  describe('detectCategory', () => {
    it('detects temples and religious sites correctly', () => {
      expect(detectCategory('วัดพระแก้ว', 'พระอารามหลวง')).toBe('วัดและศาสนสถาน');
      expect(detectCategory('พระบรมธาตุดอยสุเทพ', 'เจดีย์ทอง')).toBe('วัดและศาสนสถาน');
    });

    it('detects mountains and nature correctly', () => {
      expect(detectCategory('อุทยานแห่งชาติดอยอินทนนท์', 'ยอดเขาสูงสุด')).toBe('ธรรมชาติและภูเขา');
      expect(detectCategory('น้ำตกแม่ยะ', 'น้ำตกขนาดใหญ่')).toBe('ธรรมชาติและภูเขา');
    });

    it('detects beaches and seas correctly', () => {
      expect(detectCategory('หาดป่าตอง', 'ชายหาดชื่อดัง')).toBe('ทะเลและชายหาด');
      expect(detectCategory('เกาะล้าน', 'อ่าวพัทยา')).toBe('ทะเลและชายหาด');
    });

    it('detects historical and cultural sites correctly', () => {
      expect(detectCategory('พระราชวังบางปะอิน', 'พระที่นั่ง')).toBe('ประวัติศาสตร์และวัฒนธรรม');
      expect(detectCategory('พิพิธภัณฑสถานแห่งชาติ', 'โบราณวัตถุ')).toBe('ประวัติศาสตร์และวัฒนธรรม');
    });

    it('falls back to general tourist attraction', () => {
      expect(detectCategory('จุดชมวิวกังหันลม', 'ทัศนียภาพ')).toBe('สถานที่ท่องเที่ยว');
    });
  });

  describe('fetchAttractionsForProvince', () => {
    beforeEach(() => {
      jest.restoreAllMocks();
    });

    // T87 / US-25 AC2: when EVERY category query fails with a real error
    // (network/timeout/HTTP/parse), the function must throw/reject so the
    // caller (LandmarkList) can distinguish this from "no articles found".
    // This replaces the old silent-fallback-to-empty-array behavior.
    it('throws when every category query fails due to a real network error', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
      await expect(fetchAttractionsForProvince('น่าน', 'nan')).rejects.toThrow('Network error');
    });

    it('throws when every category query returns a non-ok HTTP response', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503 } as any);
      await expect(fetchAttractionsForProvince('น่าน-http', 'nan-http')).rejects.toThrow(/HTTP 503/);
    });

    it('resolves to an empty array (does not throw) when queries succeed but no articles exist', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ query: { pages: {} } }),
      } as any);
      const results = await fetchAttractionsForProvince('น่าน-empty', 'nan-empty');
      expect(results).toEqual([]);
    });

    it('does not throw if at least one category succeeds even when others fail', async () => {
      let call = 0;
      global.fetch = jest.fn().mockImplementation(() => {
        call += 1;
        if (call === 1) return Promise.reject(new Error('timeout'));
        return Promise.resolve({
          ok: true,
          json: async () => ({ query: { pages: {} } }),
        } as any);
      });
      const results = await fetchAttractionsForProvince('น่าน-partial', 'nan-partial');
      expect(Array.isArray(results)).toBe(true);
    });

    it('parses pages and categorizes articles properly', async () => {
      const mockWikiResponse = {
        query: {
          pages: {
            '101': {
              pageid: 101,
              ns: 0,
              title: 'วัดภูมินทร์ (จังหวัดน่าน)',
              extract: 'วัดเก่าแก่ในเมืองน่าน ภาพปู่ม่านย่าม่าน',
              thumbnail: { source: 'https://example.com/phumin.jpg' },
            },
            '102': {
              pageid: 102,
              ns: 0,
              title: 'ดอยเสมอดาว',
              extract: 'จุดชมทะเลหมอกและดาวในอุทยานแห่งชาติศรีน่าน',
              thumbnail: { source: 'https://example.com/stars.jpg' },
            },
          },
        },
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockWikiResponse,
      } as any);

      const results = await fetchAttractionsForProvince('น่าน-mock', 'nan-mock');
      expect(results.length).toBe(2);
      expect(results[0].nameTh).toBe('วัดภูมินทร์');
      expect(results[0].category).toBe('วัดและศาสนสถาน');
      expect(results[0].imageUrl).toBe('https://example.com/phumin.jpg');

      expect(results[1].nameTh).toBe('ดอยเสมอดาว');
      expect(results[1].category).toBe('ธรรมชาติและภูเขา');
    });
  });
});
