// Independent Tester coverage for US-24 AC4 (selecting a province result),
// split out — see globalSearchBarDropdown.test.tsx for why.
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import GlobalSearchBar from '../../components/GlobalSearchBar';

const PLACEHOLDER = 'ค้นหาจังหวัด หรือสถานที่ท่องเที่ยว...';

describe('GlobalSearchBar selection — province result (US-24 AC4)', () => {
  it('calls onSelectProvince with the provinceId when a province result is tapped', async () => {
    const onSelectProvince = jest.fn();
    await render(<GlobalSearchBar onSelectProvince={onSelectProvince} />);

    const input = screen.getByPlaceholderText(PLACEHOLDER);
    fireEvent(input, 'focus');
    fireEvent.changeText(input, 'เชียงใหม่');
    await waitFor(() => expect(screen.getByText(/จังหวัด \(Chiang Mai\)/)).toBeTruthy());

    fireEvent.press(screen.getByText('เชียงใหม่'));
    expect(onSelectProvince).toHaveBeenCalledWith('chiang-mai');
  });
});
