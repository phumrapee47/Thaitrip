import type { Landmark } from '../data/thailand-landmarks';
import { PROVINCES } from '../data/thailand-provinces';

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
 * Reverse of the category naming convention used by `fetchAttractionsForProvince`
 * (e.g. "\u0E2B\u0E21\u0E27\u0E14\u0E2B\u0E21\u0E39\u0E48:\u0E2A\u0E16\u0E32\u0E19\u0E17\u0E35\u0E48\u0E17\u0E48\u0E2D\u0E07\u0E40\u0E17\u0E35\u0E48\u0E22\u0E27\u0E43\u0E19\u0E08\u0E31\u0E07\u0E2B\u0E27\u0E31\u0E14\u0E20\u0E39\u0E40\u0E01\u0E47\u0E15"): given a Wikipedia article's own
 * category titles, find which of the 76 provinces it belongs to by checking
 * whether any category contains that province's exact nameTh. Lets a global
 * keyword search resolve a real provinceId for navigation instead of only
 * ever matching articles already curated into a specific province's fetch.
 */
function resolveProvinceFromCategories(
  categoryTitles: string[]
): { id: string; nameTh: string } | undefined {
  for (const cat of categoryTitles) {
    for (const province of PROVINCES) {
      if (cat.includes(province.nameTh)) {
        return { id: province.id, nameTh: province.nameTh };
      }
    }
  }
  return undefined;
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
    for (const page of pages) {
      const info = page.imageinfo?.[0];
      const thumb = info?.thumburl || info?.url;
      if (thumb && /\.(jpg|jpeg|png|webp)/i.test(thumb) && !thumb.toLowerCase().includes('.pdf')) {
        return thumb;
      }
    }
    return undefined;
  } catch {
    return undefined;
  }
}

const photoCache = new Map<string, string>();

/**
 * Dynamically resolves a real photograph for any landmark via Wikipedia or Commons.
 * Caches in memory to ensure fast response and zero repeated calls.
 */
export async function resolveRealPhotoForLandmark(
  nameTh: string,
  provinceNameTh?: string
): Promise<string | undefined> {
  const cleanName = cleanTitle(nameTh);
  const cacheKey = `${cleanName}:${provinceNameTh || ''}`;
  if (photoCache.has(cacheKey)) {
    const cached = photoCache.get(cacheKey);
    return cached || undefined;
  }

  try {
    // 1. Direct title/redirect lookup on Thai Wikipedia
    const titleUrl = `https://th.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(
      cleanName
    )}&redirects=1&prop=pageimages&piprop=thumbnail&pithumbsize=800&format=json&origin=*`;
    const titleRes = await fetch(titleUrl, { headers: { 'User-Agent': USER_AGENT } });
    if (titleRes.ok) {
      const titleData = await titleRes.json();
      const p = Object.values(titleData?.query?.pages || {})[0] as {
        pageid?: number;
        thumbnail?: { source?: string };
      };
      if (p && (p.pageid || 0) > 0 && p.thumbnail?.source) {
        photoCache.set(cacheKey, p.thumbnail.source);
        return p.thumbnail.source;
      }
    }

    // 2. Commons image search with clean name + province
    const commonsQuery = provinceNameTh ? `${cleanName} ${provinceNameTh}` : cleanName;
    const commonsPhoto = await fetchCommonsPhoto(commonsQuery);
    if (commonsPhoto) {
      photoCache.set(cacheKey, commonsPhoto);
      return commonsPhoto;
    }

    // 3. Fallback semantic search on Thai Wikipedia
    const searchUrl = `https://th.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
      commonsQuery
    )}&gsrlimit=3&prop=pageimages&piprop=thumbnail&pithumbsize=800&format=json&origin=*`;
    const searchRes = await fetch(searchUrl, { headers: { 'User-Agent': USER_AGENT } });
    if (searchRes.ok) {
      const searchData = await searchRes.json();
      const pages = Object.values(searchData?.query?.pages || {}) as Array<{
        thumbnail?: { source?: string };
      }>;
      for (const sp of pages) {
        if (sp.thumbnail?.source) {
          photoCache.set(cacheKey, sp.thumbnail.source);
          return sp.thumbnail.source;
        }
      }
    }
  } catch {
    // Gracefully handle network errors
  }

  photoCache.set(cacheKey, '');
  return undefined;
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

  // Secondary pass: For items without images, resolve real photos via Wikipedia/Commons
  const missingImageItems = results.filter((r) => !r.imageUrl).slice(0, 8);
  if (missingImageItems.length > 0) {
    await Promise.allSettled(
      missingImageItems.map(async (item) => {
        const photoUrl = await resolveRealPhotoForLandmark(item.nameTh, cleanProvince);
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
 * Searches tourist attractions across ALL of Thailand via Wikipedia full-text
 * search — not scoped to any single province's curated dataset. Each result's
 * `provinceId` is resolved from the article's own Wikipedia categories (see
 * `resolveProvinceFromCategories`), not from wherever the caller happens to be
 * browsing, so a search launched from any screen finds landmarks anywhere in
 * the country.
 */
export async function searchAttractionsGlobal(keyword: string): Promise<Landmark[]> {
  const q = keyword.trim();
  if (!q) return [];

  try {
    const url = `https://th.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
      q
    )}&gsrlimit=20&prop=pageimages|extracts|categories&piprop=thumbnail&pithumbsize=800&exintro=1&explaintext=1&exchars=140&cllimit=30&format=json&origin=*`;

    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) return [];

    const data = await res.json();
    const pages = Object.values(data?.query?.pages || {}) as Array<{
      pageid: number;
      ns: number;
      title: string;
      extract?: string;
      thumbnail?: { source: string };
      categories?: Array<{ title: string }>;
    }>;

    const items: Landmark[] = pages
      .filter((p) => p.ns === 0 && !p.title.startsWith('รายชื่อ'))
      .map((p) => {
        const nameTh = cleanTitle(p.title);
        const matchedProvince = resolveProvinceFromCategories(
          (p.categories || []).map((c) => c.title)
        );
        return {
          id: `wiki-search-${p.pageid}`,
          provinceId: matchedProvince?.id || '',
          nameTh,
          description: p.extract?.trim() || '',
          imageUrl: p.thumbnail?.source,
          category: detectCategory(p.title, p.extract || ''),
        };
      });

    // Secondary pass for search results missing image — use each result's OWN
    // resolved province (not the caller's browsing context) for Commons context.
    const missing = items.filter((it) => !it.imageUrl).slice(0, 6);
    if (missing.length > 0) {
      await Promise.allSettled(
        missing.map(async (it) => {
          const province = PROVINCES.find((pv) => pv.id === it.provinceId);
          const photo = await resolveRealPhotoForLandmark(it.nameTh, province?.nameTh);
          if (photo) it.imageUrl = photo;
        })
      );
    }

    return items;
  } catch {
    return [];
  }
}
