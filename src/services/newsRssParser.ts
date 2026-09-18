/**
 * T98 / US-29 AC2,5, US-32 AC2,3,5: custom regex/string-based RSS 2.0 parser —
 * deliberately NOT a DOMParser/XML-library-based parser, per PM decision
 * ข้อ 21 in docs/tasks.md (React Native has no built-in DOMParser, and pulling
 * in an XML library adds a dependency + RN-compatibility risk for a field set
 * this small/predictable). Every function here is pure (string in, data out)
 * so it can be unit-tested with an injected mocked RSS XML string, per US-29's
 * last AC.
 */

export interface ParsedNewsItem {
  title: string;
  /** HTML tags already stripped + entities decoded — safe to render as plain text. */
  summary: string;
  imageUrl?: string;
  link: string;
  /** ISO 8601 string when a valid pubDate was found/parsed; undefined otherwise (US-32 AC5). */
  pubDate?: string;
}

/** Unwraps a `<![CDATA[ ... ]]>` wrapper if present (T111); returns the raw string unchanged otherwise. */
function unwrapCdata(raw: string): string {
  const m = raw.match(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/);
  return m ? m[1] : raw;
}

/** Decodes the handful of HTML entities that actually show up in real-world RSS titles/descriptions (T111). */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

/** Strips HTML tags from a description/content HTML fragment and decodes entities, for the plain-text summary shown on the card (US-29 AC2: "ตัด HTML tag ออกแล้ว ไม่แสดง raw HTML"). */
function stripHtmlToText(html: string): string {
  return decodeHtmlEntities(html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ')).trim();
}

/** Extracts the text content of the first `<tag>...</tag>` (namespaced tags like `content:encoded` work too since `:` is a valid part of the tag name match). */
function extractTagContent(xml: string, tag: string): string | undefined {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = xml.match(re);
  return m ? m[1] : undefined;
}

/** Extracts a single attribute value from the first self-closing/opening `<tag ...>` occurrence, e.g. `<enclosure url="..." type="..."/>`. */
function extractFirstTagAttr(xml: string, tag: string, attr: string): string | undefined {
  const tagRe = new RegExp(`<${tag}\\b[^>]*>`, 'i');
  const tagMatch = xml.match(tagRe);
  if (!tagMatch) return undefined;
  const attrRe = new RegExp(`${attr}\\s*=\\s*["']([^"']*)["']`, 'i');
  const attrMatch = tagMatch[0].match(attrRe);
  return attrMatch ? attrMatch[1] : undefined;
}

/** Image priority per PM decision (docs/tasks.md T98): `<enclosure>` first, only if it looks like an image (or has no `type` at all). */
function extractEnclosureImage(itemXml: string): string | undefined {
  const type = extractFirstTagAttr(itemXml, 'enclosure', 'type');
  if (type && !/^image\//i.test(type)) return undefined;
  return extractFirstTagAttr(itemXml, 'enclosure', 'url');
}

/** `<media:content>` next, same image-type guard (also accepts `medium="image"`, the other common convention). */
function extractMediaContentImage(itemXml: string): string | undefined {
  const medium = extractFirstTagAttr(itemXml, 'media:content', 'medium');
  const type = extractFirstTagAttr(itemXml, 'media:content', 'type');
  if (type && !/^image\//i.test(type)) return undefined;
  if (medium && !/image/i.test(medium)) return undefined;
  return extractFirstTagAttr(itemXml, 'media:content', 'url');
}

/** Last resort: the first `<img src="...">` found inside the (already CDATA-unwrapped) description HTML. */
function extractFirstImgFromHtml(html: string): string | undefined {
  const m = html.match(/<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/i);
  return m ? m[1] : undefined;
}

/** Best-effort pubDate parse. Accepts RFC 822 (`Sat, 12 Sep 2026 02:16:28 +0000`, the RSS 2.0 standard) and anything else `Date` can parse; returns undefined (not a throw) when unparseable/missing, per US-32 AC5. */
function parsePubDate(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const cleaned = decodeHtmlEntities(unwrapCdata(raw)).trim();
  if (!cleaned) return undefined;
  const parsed = new Date(cleaned);
  if (isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}

/**
 * T98: parses a raw RSS 2.0 XML string into a flat list of news items. Returns
 * `[]` for empty/non-string/no-`<item>` input rather than throwing — an empty
 * result here is a legitimate "feed has 0 items" case (US-32 AC1), distinct
 * from a network/HTTP failure which is handled one layer up in newsService.ts
 * (T97) before this function is ever called.
 */
export function parseRssXml(xml: string): ParsedNewsItem[] {
  if (!xml || typeof xml !== 'string') return [];

  const itemBlocks = xml.match(/<item\b[^>]*>[\s\S]*?<\/item>/gi) || [];
  const items: ParsedNewsItem[] = [];

  for (const block of itemBlocks) {
    const rawTitle = extractTagContent(block, 'title');
    const rawDescription =
      extractTagContent(block, 'description') ?? extractTagContent(block, 'content:encoded') ?? '';
    const rawLink = extractTagContent(block, 'link');
    const rawPubDate = extractTagContent(block, 'pubDate') ?? extractTagContent(block, 'dc:date');

    const title = rawTitle ? decodeHtmlEntities(unwrapCdata(rawTitle)).trim() : '';
    const descriptionHtml = unwrapCdata(rawDescription);
    const summary = stripHtmlToText(descriptionHtml);
    const link = rawLink ? decodeHtmlEntities(unwrapCdata(rawLink)).trim() : '';

    const imageUrl =
      extractEnclosureImage(block) || extractMediaContentImage(block) || extractFirstImgFromHtml(descriptionHtml) || undefined;

    const pubDate = parsePubDate(rawPubDate);

    // A block with neither a title nor a link is malformed/unusable — skip it
    // rather than surfacing a blank card, without failing the whole batch.
    if (!title && !link) continue;

    items.push({ title, summary, imageUrl, link, pubDate });
  }

  return items;
}

/**
 * T99: post-processing pipeline run after parseRssXml —
 * (1) dedupe by `link` (fallback to `title` when `link` is empty), keeping
 *     only the FIRST occurrence (US-32 AC3);
 * (2) sort by `pubDate` descending (latest first); items with no parseable
 *     `pubDate` are moved to the end, in their original relative order,
 *     instead of breaking/throwing or being interleaved randomly (US-29 AC1,
 *     US-32 AC5).
 */
export function processNewsItems(items: ParsedNewsItem[]): ParsedNewsItem[] {
  const seen = new Set<string>();
  const deduped: ParsedNewsItem[] = [];
  for (const item of items) {
    const key = item.link ? `link:${item.link}` : `title:${item.title}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
  }

  const withDate = deduped.filter((i) => i.pubDate);
  const withoutDate = deduped.filter((i) => !i.pubDate);
  withDate.sort((a, b) => new Date(b.pubDate as string).getTime() - new Date(a.pubDate as string).getTime());

  return [...withDate, ...withoutDate];
}
