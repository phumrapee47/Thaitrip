// T115 / US-33 AC1,3,4: NewsCard wiring of the lazy og:image fetch (T114) —
// placeholder-first, swap-to-real-image on success, stay-on-placeholder on
// failure/no-result, and never fetch when the RSS feed already gave an image.
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import NewsCard from './NewsCard';
import type { NewsItem } from '../services/newsService';

jest.mock('../services/ogImageService');
const ogImageServiceMock = require('../services/ogImageService');

const BASE_ITEM: NewsItem = {
  id: 'https://www.tatnews.org/article',
  title: 'ข่าวทดสอบ',
  summary: 'สรุปข่าวทดสอบ',
  link: 'https://www.tatnews.org/article',
  pubDate: '2026-06-01T00:00:00.000Z',
};

describe('NewsCard og:image wiring (T115 / US-33)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows the placeholder immediately, then swaps to the resolved og:image once the fetch succeeds (AC1)', async () => {
    let resolveFetch!: (url: string | undefined) => void;
    ogImageServiceMock.fetchOgImageForArticle.mockImplementation(
      () => new Promise((resolve) => { resolveFetch = resolve; })
    );

    await render(<NewsCard item={BASE_ITEM} onPress={jest.fn()} />);

    expect(screen.getByTestId('news-card-placeholder')).toBeTruthy();
    expect(screen.getByText('ข่าวทดสอบ')).toBeTruthy();

    resolveFetch('https://example.com/og-photo.jpg');

    await waitFor(() => expect(screen.getByTestId('news-card-image')).toBeTruthy());
    expect(screen.getByTestId('news-card-image').props.source).toEqual({ uri: 'https://example.com/og-photo.jpg' });
    expect(screen.queryByTestId('news-card-placeholder')).toBeNull();
  });

  it('stays on the placeholder (no crash) when the og:image fetch resolves with no result (AC3)', async () => {
    ogImageServiceMock.fetchOgImageForArticle.mockResolvedValue(undefined);

    await render(<NewsCard item={BASE_ITEM} onPress={jest.fn()} />);

    await waitFor(() => expect(ogImageServiceMock.fetchOgImageForArticle).toHaveBeenCalledWith(BASE_ITEM.link));
    expect(screen.getByTestId('news-card-placeholder')).toBeTruthy();
    expect(screen.queryByTestId('news-card-image')).toBeNull();
  });

  it('does NOT call the og:image fetch at all when the RSS feed already provided an image (AC1, US-32 unaffected)', async () => {
    const itemWithImage: NewsItem = { ...BASE_ITEM, imageUrl: 'https://example.com/rss-photo.jpg' };
    await render(<NewsCard item={itemWithImage} onPress={jest.fn()} />);

    expect(screen.getByTestId('news-card-image')).toBeTruthy();
    expect(screen.getByTestId('news-card-image').props.source).toEqual({ uri: 'https://example.com/rss-photo.jpg' });
    expect(ogImageServiceMock.fetchOgImageForArticle).not.toHaveBeenCalled();
  });
});
