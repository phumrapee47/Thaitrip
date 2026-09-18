// Coverage for US-26: a Wikipedia search result whose province could not be
// resolved from its categories must never appear in the dropdown — there is
// nowhere to navigate it to. Split into its own file/single-interaction per
// the project convention in globalSearchBarDropdown.test.tsx.
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

  it('drops a Wikipedia result whose province could not be resolved, instead of showing a dead-end result', async () => {
    wikipediaServiceMock.searchAttractionsGlobal.mockResolvedValue([
      {
        id: 'wiki-search-000',
        provinceId: '',
        nameTh: 'บทความไม่มีจังหวัด',
        description: '',
        imageUrl: undefined,
        category: 'สถานที่ท่องเที่ยว',
      },
    ]);

    const onSelectProvince = jest.fn();
    await render(<GlobalSearchBar onSelectProvince={onSelectProvince} />);

    const input = screen.getByPlaceholderText(PLACEHOLDER);
    fireEvent(input, 'focus');
    fireEvent.changeText(input, 'บทความไม่มีจังหวัด');

    await act(async () => {
      await jest.advanceTimersByTimeAsync(DEBOUNCE_MS);
    });

    expect(wikipediaServiceMock.searchAttractionsGlobal).toHaveBeenCalled();
    expect(screen.queryByText('บทความไม่มีจังหวัด')).toBeNull();
    expect(onSelectProvince).not.toHaveBeenCalled();
  });
});
