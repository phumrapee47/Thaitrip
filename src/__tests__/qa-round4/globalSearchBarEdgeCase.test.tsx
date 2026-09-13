// Independent Tester coverage for the US-24 "no matches" edge case, split into
// its own file/single search interaction — see globalSearchBarDropdown.test.tsx
// for why.
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import GlobalSearchBar from '../../components/GlobalSearchBar';

const PLACEHOLDER = 'ค้นหาจังหวัด หรือสถานที่ท่องเที่ยว...';

describe('GlobalSearchBar no-match edge case (US-24)', () => {
  it('shows no dropdown results and does not crash for a query with no matches', async () => {
    const onSelectProvince = jest.fn();
    await render(<GlobalSearchBar onSelectProvince={onSelectProvince} />);

    const input = screen.getByPlaceholderText(PLACEHOLDER);
    fireEvent(input, 'focus');
    fireEvent.changeText(input, 'xxxxไม่มีที่นี้แน่นอนxxxx');

    expect(screen.queryByText('undefined')).toBeNull();
    expect(onSelectProvince).not.toHaveBeenCalled();
  });
});
