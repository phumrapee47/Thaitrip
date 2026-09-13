import type { Landmark } from '../data/thailand-landmarks';

const USER_AGENT = 'TravelJournalThaiApp/1.0 (https://github.com/travel-journal-thai; dev@example.com)';

const provinceCache = new Map<string, Landmark[]>();

export function detectCategory(title: string, desc: string = ''): string {
  const t = (title + ' ' + desc).toLowerCase();
  if (/หาด|เกาะ|อ่าว|แหลม|ปะการัง|ทะเล(?!หมอก)/.test(t)) return 'ทะเลและชายหาด';
  if (/วัด|อาราม|เจดีย์|วิหาร|พระธาตุ|พระบรมธาตุ|มัสยิด|ศาลเจ้า|โบสถ์/.test(t)) return 'วัดและศาสนสถาน';
  if (/อุทยาน|ดอย|น้ำตก|ถ้ำ|ป่า|ภู|อ่างเก็บน้ำ|กิ่ว|เขตรักษาพันธุ์|น้ำพุร้อน|บึง|แม่น้ำ|เขื่อน|ทะเลหมอก/.test(t)) return 'ธรรมชาติและภูเขา';
  if (/วัง|พระราชวัง|เมืองเก่า|ประวัติศาสตร์|พิพิธภัณฑ์|พิพิธภัณฑ|ปราสาท|อนุสาวรีย์|หอศิลป์|โบราณ/.test(t)) return 'ประวัติศาสตร์และวัฒนธรรม';
  if (/ตลาด|ถนนคนเดิน|ไนท์บาซาร์|คอมมูนิตี้|ฟาร์ม|สวนสัตว์|สวนสนุก/.test(t)) return 'ช้อปปิ้งและสันทนาการ';
  return 'สถานที่ท่องเที่ยว';
}

function cleanTitle(title: string): string {
  return title.replace(/\s*\(.*?\)\s*/g, '').trim();
}

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u0E00-\u0E7F]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Searches Wikimedia Commons for a photo if Wikipedia doesn't have a thumbnail.
 */
async function fetchCommonsPhoto(query: string): Promise<string | undefined> {
  try {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
      query
    )}&gsrnamespace=6&prop=imageinfo&iiprop=url&iiurlwidth=800&format=json&origin=*`;
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) return undefined;
    const data = await res.json();
    const pages = Object.values(data?.query?.pages || {}) as Array<{
      imageinfo?: Array<{ thumburl?: string; url?: string }>;
    }>;
    return pages[0]?.imageinfo?.[0]?.thumburl || pages[0]?.imageinfo?.[0]?.url;
  } catch {
    return undefined;
  }
}

/**
 * Fetches tourist attractions for a specific Thai province via Wikipedia & Wikimedia Commons.
 */
export async function fetchAttractionsForProvince(
  provinceNameTh: string,
  provinceId: string
): Promise<Landmark[]> {
  // Normalize province name (e.g. remove "จังหวัด" prefix if already included)
  const cleanProvince = provinceNameTh.replace(/^จังหวัด/, '').trim();
  const cacheKey = provinceId || cleanProvince;

  if (provinceCache.has(cacheKey)) {
    return provinceCache.get(cacheKey)!;
  }

  const categoryNames = [
    `หมวดหมู่:สถานที่ท่องเที่ยวในจังหวัด${cleanProvince}`,
    `หมวดหมู่:อุทยานแห่งชาติในจังหวัด${cleanProvince}`,
    `หมวดหมู่:วัดในจังหวัด${cleanProvince}`,
    `หมวดหมู่:โบราณสถานในจังหวัด${cleanProvince}`,
  ];

  const results: Landmark[] = [];
  const seenTitles = new Set<string>([
    cleanProvince,
    `จังหวัด${cleanProvince}`,
    `อำเภอเมือง${cleanProvince}`,
  ]);

  // T87 / US-25 AC1,2,5: track whether at least one category query actually
  // succeeded (fetch resolved, HTTP ok, JSON parsed) vs. every single one
  // failing with a real error (network/timeout/HTTP/parse). "Succeeded but 0
  // articles in that category" must NOT count as a failure here.
  let categorySucceeded = false;
  let lastError: unknown = null;

  for (const cat of categoryNames) {
    try {
      const url = `https://th.wikipedia.org/w/api.php?action=query&generator=categorymembers&gcmtitle=${encodeURIComponent(
        cat
      )}&gcmlimit=25&prop=pageimages|extracts&piprop=thumbnail&pithumbsize=800&exintro=1&explaintext=1&exchars=160&format=json&origin=*`;

      const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
      if (!res.ok) {
        lastError = new Error(`Wikipedia API request failed with HTTP ${res.status}`);
        continue;
      }

      const data = await res.json();
      categorySucceeded = true;
      const pages = Object.values(data?.query?.pages || {}) as Array<{
        pageid: number;
        ns: number;
        title: string;
        extract?: string;
        thumbnail?: { source: string };
      }>;

      for (const p of pages) {
        if (p.ns !== 0) continue; // Skip subcategories/templates
        if (p.title.startsWith('รายชื่อ')) continue;

        const displayName = cleanTitle(p.title);
        if (seenTitles.has(displayName)) continue;
        seenTitles.add(displayName);

        const category = detectCategory(p.title, p.extract || '');
        const id = `wiki-${provinceId}-${generateSlug(displayName) || p.pageid}`;

        results.push({
          id,
          provinceId,
          nameTh: displayName,
          description: p.extract?.trim() || '',
          imageUrl: p.thumbnail?.source,
          category,
        });

        if (results.length >= 20) break;
      }
    } catch (err) {
      // Continue to next category, but remember the error in case every
      // category ends up failing this way.
      lastError = err;
    }

    if (results.length >= 15) break;
  }

  // T87 / US-25 AC2: only throw when EVERY category failed with a real error.
  // If at least one category query succeeded (even with 0 articles), resolve
  // normally per the pre-existing "no data" contract (US-8/US-22).
  if (!categorySucceeded) {
    throw lastError instanceof Error
      ? lastError
      : new Error('Failed to fetch attractions from Wikipedia for all categories');
  }

  // Secondary pass: For items without images, fetch top 8 via Commons in parallel
  const missingImageItems = results.filter((r) => !r.imageUrl).slice(0, 8);
  if (missingImageItems.length > 0) {
    await Promise.allSettled(
      missingImageItems.map(async (item) => {
        const photoUrl = await fetchCommonsPhoto(`${item.nameTh} ${cleanProvince}`);
        if (photoUrl) {
          item.imageUrl = photoUrl;
        }
      })
    );
  }

  if (results.length > 0) {
    provinceCache.set(cacheKey, results);
  }

  return results;
}

/**
 * Searches tourist attractions across all of Thailand via Wikipedia search.
 */
export async function searchAttractionsGlobal(keyword: string): Promise<Landmark[]> {
  const q = keyword.trim();
  if (!q) return [];

  try {
    const url = `https://th.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
      q
    )}&gsrlimit=12&prop=pageimages|extracts&piprop=thumbnail&pithumbsize=800&exintro=1&explaintext=1&exchars=140&format=json&origin=*`;

    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) return [];

    const data = await res.json();
    const pages = Object.values(data?.query?.pages || {}) as Array<{
      pageid: number;
      ns: number;
      title: string;
      extract?: string;
      thumbnail?: { source: string };
    }>;

    return pages
      .filter((p) => p.ns === 0 && !p.title.startsWith('รายชื่อ'))
      .map((p) => {
        const nameTh = cleanTitle(p.title);
        return {
          id: `wiki-search-${p.pageid}`,
          provinceId: '',
          nameTh,
          description: p.extract?.trim() || '',
          imageUrl: p.thumbnail?.source,
          category: detectCategory(p.title, p.extract || ''),
        };
      });
  } catch {
    return [];
  }
}
