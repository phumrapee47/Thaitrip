import { parseRssXml, processNewsItems } from './newsRssParser';

// T98/T99/T111 / US-29 AC2,5, US-32 AC2,3,5: pure-function parser tests with
// injected mocked RSS XML strings (no network at all in this file).

function wrapFeed(items: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/" xmlns:content="http://purl.org/rss/1.0/modules/content/">
<channel>
<title>Mock Feed</title>
${items}
</channel>
</rss>`;
}

describe('parseRssXml', () => {
  it('parses title, description (HTML stripped), link, and pubDate from a standard item (US-29 AC2,5)', () => {
    const xml = wrapFeed(`
      <item>
        <title>Neramit Amphawa Food Festival</title>
        <link>https://www.tatnews.org/2026/09/neramit-amphawa/</link>
        <pubDate>Sat, 12 Sep 2026 02:16:28 +0000</pubDate>
        <description><![CDATA[<p>TAT presents <b>Neramit Amphawa</b> from 11-20 Sep.</p>]]></description>
      </item>
    `);
    const items = parseRssXml(xml);
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe('Neramit Amphawa Food Festival');
    expect(items[0].link).toBe('https://www.tatnews.org/2026/09/neramit-amphawa/');
    expect(items[0].summary).toBe('TAT presents Neramit Amphawa from 11-20 Sep.');
    expect(items[0].summary).not.toMatch(/<[^>]+>/);
    expect(items[0].pubDate).toBe(new Date('Sat, 12 Sep 2026 02:16:28 +0000').toISOString());
  });

  it('matches the exact mocked count/content — parses N items for N <item> blocks', () => {
    const xml = wrapFeed(`
      <item><title>A</title><link>https://example.com/a</link><description>Desc A</description></item>
      <item><title>B</title><link>https://example.com/b</link><description>Desc B</description></item>
      <item><title>C</title><link>https://example.com/c</link><description>Desc C</description></item>
    `);
    const items = parseRssXml(xml);
    expect(items).toHaveLength(3);
    expect(items.map((i) => i.title)).toEqual(['A', 'B', 'C']);
  });

  it('returns [] for an empty/malformed input instead of throwing', () => {
    expect(parseRssXml('')).toEqual([]);
    expect(parseRssXml('not xml at all')).toEqual([]);
    expect(parseRssXml(wrapFeed(''))).toEqual([]); // valid feed, zero items (US-32 AC1 case)
  });

  describe('image extraction priority (T98: enclosure > media:content > first <img> in description > none)', () => {
    it('uses <enclosure> when present', () => {
      const xml = wrapFeed(`
        <item>
          <title>Has enclosure</title>
          <link>https://example.com/1</link>
          <enclosure url="https://example.com/cover.jpg" type="image/jpeg" />
          <media:content url="https://example.com/media.jpg" medium="image" />
          <description><![CDATA[<img src="https://example.com/inline.jpg" />]]></description>
        </item>
      `);
      expect(parseRssXml(xml)[0].imageUrl).toBe('https://example.com/cover.jpg');
    });

    it('falls back to <media:content> when there is no <enclosure>', () => {
      const xml = wrapFeed(`
        <item>
          <title>Has media content</title>
          <link>https://example.com/2</link>
          <media:content url="https://example.com/media.jpg" medium="image" />
          <description><![CDATA[<img src="https://example.com/inline.jpg" />]]></description>
        </item>
      `);
      expect(parseRssXml(xml)[0].imageUrl).toBe('https://example.com/media.jpg');
    });

    it('falls back to the first <img> in the description HTML when no enclosure/media:content', () => {
      const xml = wrapFeed(`
        <item>
          <title>Has inline img only</title>
          <link>https://example.com/3</link>
          <description><![CDATA[<p>text</p><img src="https://example.com/inline.jpg" /><p>more</p>]]></description>
        </item>
      `);
      expect(parseRssXml(xml)[0].imageUrl).toBe('https://example.com/inline.jpg');
    });

    it('leaves imageUrl undefined when no image is found anywhere (US-32 AC2 — placeholder handled by the UI layer)', () => {
      const xml = wrapFeed(`
        <item>
          <title>No image at all</title>
          <link>https://example.com/4</link>
          <description><![CDATA[<p>plain text, no img tag</p>]]></description>
        </item>
      `);
      expect(parseRssXml(xml)[0].imageUrl).toBeUndefined();
    });

    it('ignores a non-image <enclosure> (e.g. a podcast audio enclosure) and falls through to media:content', () => {
      const xml = wrapFeed(`
        <item>
          <title>Audio enclosure</title>
          <link>https://example.com/5</link>
          <enclosure url="https://example.com/audio.mp3" type="audio/mpeg" />
          <media:content url="https://example.com/media.jpg" medium="image" />
        </item>
      `);
      expect(parseRssXml(xml)[0].imageUrl).toBe('https://example.com/media.jpg');
    });
  });

  describe('T111 — real-world RSS variety: CDATA, namespaces, HTML entities', () => {
    it('unwraps CDATA-wrapped title/link and decodes common HTML entities', () => {
      const xml = wrapFeed(`
        <item>
          <title><![CDATA[Thailand&#8217;s Best Beaches &amp; Islands]]></title>
          <link><![CDATA[https://example.com/beaches?a=1&amp;b=2]]></link>
          <description><![CDATA[<p>Sun, sand &amp; sea &mdash; explore Thailand&#8217;s coast.</p>]]></description>
        </item>
      `);
      const item = parseRssXml(xml)[0];
      expect(item.title).toBe("Thailand’s Best Beaches & Islands");
      expect(item.link).toBe('https://example.com/beaches?a=1&b=2');
      expect(item.summary).toContain('Sun, sand & sea');
    });

    it('reads content:encoded as a description fallback when <description> is absent', () => {
      const xml = wrapFeed(`
        <item>
          <title>Uses content:encoded</title>
          <link>https://example.com/6</link>
          <content:encoded><![CDATA[<p>Full body text here.</p>]]></content:encoded>
        </item>
      `);
      expect(parseRssXml(xml)[0].summary).toBe('Full body text here.');
    });
  });

  describe('US-32 AC5 — missing/invalid pubDate', () => {
    it('leaves pubDate undefined (not a throw) when pubDate is missing entirely', () => {
      const xml = wrapFeed(`
        <item><title>No date</title><link>https://example.com/7</link></item>
      `);
      expect(parseRssXml(xml)[0].pubDate).toBeUndefined();
    });

    it('leaves pubDate undefined when pubDate is present but unparseable', () => {
      const xml = wrapFeed(`
        <item><title>Bad date</title><link>https://example.com/8</link><pubDate>not-a-real-date</pubDate></item>
      `);
      expect(parseRssXml(xml)[0].pubDate).toBeUndefined();
    });
  });
});

describe('processNewsItems', () => {
  it('sorts items by pubDate descending (US-29 AC1)', () => {
    const items = [
      { title: 'Old', link: 'https://x/old', summary: '', pubDate: '2026-01-01T00:00:00.000Z' },
      { title: 'New', link: 'https://x/new', summary: '', pubDate: '2026-06-01T00:00:00.000Z' },
      { title: 'Mid', link: 'https://x/mid', summary: '', pubDate: '2026-03-01T00:00:00.000Z' },
    ];
    const sorted = processNewsItems(items);
    expect(sorted.map((i) => i.title)).toEqual(['New', 'Mid', 'Old']);
  });

  it('pushes items with no pubDate to the end, in their original relative order, without breaking the sort (US-32 AC5)', () => {
    const items = [
      { title: 'NoDateA', link: 'https://x/nda', summary: '' },
      { title: 'Dated', link: 'https://x/d', summary: '', pubDate: '2026-01-01T00:00:00.000Z' },
      { title: 'NoDateB', link: 'https://x/ndb', summary: '' },
    ];
    const sorted = processNewsItems(items);
    expect(sorted.map((i) => i.title)).toEqual(['Dated', 'NoDateA', 'NoDateB']);
  });

  it('deduplicates by link, keeping only the first occurrence (US-32 AC3)', () => {
    const items = [
      { title: 'First', link: 'https://x/dup', summary: '', pubDate: '2026-01-01T00:00:00.000Z' },
      { title: 'Duplicate (different title, same link)', link: 'https://x/dup', summary: '', pubDate: '2026-02-01T00:00:00.000Z' },
    ];
    const result = processNewsItems(items);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('First');
  });

  it('falls back to deduplicating by title when link is empty (US-32 AC3)', () => {
    const items = [
      { title: 'Same Title', link: '', summary: 'first' },
      { title: 'Same Title', link: '', summary: 'second' },
    ];
    const result = processNewsItems(items);
    expect(result).toHaveLength(1);
    expect(result[0].summary).toBe('first');
  });
});
