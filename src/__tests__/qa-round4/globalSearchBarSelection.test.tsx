// Independent Tester coverage for US-24 AC4 (selecting a result). Split into
// two single-search tests, each in its own `it()` with a fresh render — see
// globalSearchBarDropdown.test.tsx for why cross-script sequential searches
// in one interaction chain are avoided here.
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import GlobalSearchBar from '../../components/GlobalSearchBar';

const PLACEHOLDER = 'ค้นหาจังหวัด หรือสถานที่ท่องเที่ยว...';

describe('GlobalSearchBar selection (US-24 AC4)', () => {
  it('calls onSelectProvince with the owning provinceId when a landmark result is tapped', async () => {
    const onSelectProvince = jest.fn();
    await render(<GlobalSearchBar onSelectProvince={onSelectProvince} />);

    const input = screen.getByPlaceholderText(PLACEHOLDER);
    fireEvent(input, 'focus');
    fireEvent.changeText(input, 'หาดป่าตอง');
    await waitFor(() => expect(screen.getByText('หาดป่าตอง')).toBeTruthy());

    fireEvent.press(screen.getByText('หาดป่าตอง'));
    expect(onSelectProvince).toHaveBeenCalledWith('phuket');
  });
});
