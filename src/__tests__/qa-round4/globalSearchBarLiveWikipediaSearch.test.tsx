// Coverage for US-26 (extends US-24): GlobalSearchBar layers a debounced,
// nationwide Wikipedia search on top of the instant local-dataset match, so a
// landmark that was never curated into thailand-landmarks.ts still shows up
// and is navigable — not just the pre-selected popular ones.
//
// Uses fake timers (see globalSearchBarDropdown.test.tsx for the same
// reasoning) so the 450ms debounce resolves deterministically instead of
// racing real timers across test boundaries — this file is kept to a single
// search/interaction per the project convention documented there.
import React from 'react';
import { act, render, screen, fireEvent } from '@testing-library/react-native';
import GlobalSearchBar from '../../components/GlobalSearchBar';

jest.mock('../../services/wikipediaService', () => ({
  searchAttractionsGlobal: jest.fn(),
}));

const wikipediaServiceMock = require('../../services/wikipediaService');

const PLACEHOLDER = 'ค้นหาจังหวัด หรือสถานที่ท่องเที่ยว...';
const DEBOUNCE_MS = 450;

describe('GlobalSearchBar — live nationwide Wikipedia search (US-26)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows a Wikipedia-sourced landmark (with a resolved provinceId) that is not in the local curated dataset, and navigates to its owning province on tap', async () => {
    // A deliberately made-up name/query (not "ไอ้ไข่" — that's a real, famous
    // shrine that now genuinely exists in the bundled TAT search index too
    // since US-27's รอบ 13 batch, so it would collide with a real local
    // instant-match result rather than exercising the Wikipedia-only path
    // this test targets).
    wikipediaServiceMock.searchAttractionsGlobal.mockResolvedValue([
      {
        id: 'wiki-search-999',
        provinceId: 'nakhon-si-thammarat',
        nameTh: 'วัดทดสอบสมมติเฉพาะเทสต์',
        description: 'สถานที่สมมติสำหรับเทสต์นี้เท่านั้น',
        imageUrl: 'https://upload.wikimedia.org/wiki/somewhere.jpg',
        category: 'วัดและศาสนสถาน',
      },
    ]);

    const onSelectProvince = jest.fn();
    await render(<GlobalSearchBar onSelectProvince={onSelectProvince} />);

    const input = screen.getByPlaceholderText(PLACEHOLDER);
    fireEvent(input, 'focus');
    fireEvent.changeText(input, 'ทดสอบสมมติเฉพาะเทสต์');

    await act(async () => {
      await jest.advanceTimersByTimeAsync(DEBOUNCE_MS);
    });

    expect(screen.getByText('วัดทดสอบสมมติเฉพาะเทสต์')).toBeTruthy();
    expect(screen.getByText(/สถานที่ใน นครศรีธรรมราช/)).toBeTruthy();

    fireEvent.press(screen.getByText('วัดทดสอบสมมติเฉพาะเทสต์'));
    expect(onSelectProvince).toHaveBeenCalledWith('nakhon-si-thammarat');
  });
});
