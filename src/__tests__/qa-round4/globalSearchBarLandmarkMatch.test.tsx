// Independent Tester coverage for US-24 AC2 (landmark name match) / AC3 (🏛️
// icon), split into its own single-search file — see
// globalSearchBarDropdown.test.tsx for why.
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import GlobalSearchBar from '../../components/GlobalSearchBar';

const PLACEHOLDER = 'ค้นหาจังหวัด หรือสถานที่ท่องเที่ยว...';

describe('GlobalSearchBar dropdown — landmark match (US-24 AC2/AC3)', () => {
  it('matches a landmark from the local dataset by name and shows the 🏛️ icon', async () => {
    const onSelectProvince = jest.fn();
    await render(<GlobalSearchBar onSelectProvince={onSelectProvince} />);

    const input = screen.getByPlaceholderText(PLACEHOLDER);
    fireEvent(input, 'focus');
    fireEvent.changeText(input, 'หาดป่าตอง');

    await waitFor(() => expect(screen.getByText('หาดป่าตอง')).toBeTruthy());
    expect(screen.getByText(/สถานที่ใน ภูเก็ต/)).toBeTruthy();
    expect(screen.getByText('🏛️')).toBeTruthy();
  });
});
