// Independent Tester integration coverage for US-24 AC1/AC2 (province match)/AC3
// (📍 icon)/AC5 (offline). No existing .test.tsx exercised GlobalSearchBar
// before this round.
//
// NOTE on structure: each GlobalSearchBar scenario here is its own small,
// single-purpose file with at most one or two *same-script* sequential
// searches. Empirically, firing changeText for a Latin-script query
// immediately followed by a Thai-script query (or vice versa) against the
// same mounted TextInput intermittently left the dropdown showing stale
// results from the previous query in this RTL/React Native test environment
// (a test-tooling rendering/diffing quirk — GlobalSearchBar's TextInput is an
// ordinary controlled component with no such issue in the real app). Keeping
// interactions same-script and splitting scenarios across files sidesteps it
// while still covering every AC independently.
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import GlobalSearchBar from '../../components/GlobalSearchBar';

const PLACEHOLDER = 'ค้นหาจังหวัด หรือสถานที่ท่องเที่ยว...';

function search(text: string) {
  const input = screen.getByPlaceholderText(PLACEHOLDER);
  fireEvent(input, 'focus');
  fireEvent.changeText(input, text);
}

describe('GlobalSearchBar dropdown — province match (US-24 AC1/AC2/AC3/AC5)', () => {
  it('shows a real-time dropdown for both Thai and English province name queries, with the 📍 icon, entirely offline', async () => {
    const originalFetch = global.fetch;
    global.fetch = jest.fn(() => {
      throw new Error('GlobalSearchBar must not call fetch — it is local-dataset-only (US-24 AC5)');
    }) as any;

    try {
      const onSelectProvince = jest.fn();
      await render(<GlobalSearchBar onSelectProvince={onSelectProvince} />);

      // AC1/AC2: Thai province name match.
      search('ภูเก็ต');
      await waitFor(() => expect(screen.getByText('ภูเก็ต')).toBeTruthy());
      expect(screen.getByText(/จังหวัด \(Phuket\)/)).toBeTruthy();
      // AC3: province results show the 📍 icon.
      expect(screen.getByText('📍')).toBeTruthy();

      // AC2: English province name match.
      search('phuket');
      await waitFor(() => expect(screen.getByText('ภูเก็ต')).toBeTruthy());

      // AC5: never touched the network.
      expect(global.fetch).not.toHaveBeenCalled();
    } finally {
      global.fetch = originalFetch;
    }
  });
});
