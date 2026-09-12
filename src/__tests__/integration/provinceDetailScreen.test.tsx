// US-2 AC3 (locked province detail is not a dead-end) and US-5 (entry list) integration tests.
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import ProvinceDetailScreen from '../../screens/ProvinceDetailScreen';
import AddEntryScreen from '../../screens/AddEntryScreen';
import { JournalProvider } from '../../storage/JournalContext';
import { CheckinProvider } from '../../storage/CheckinContext';

jest.mock('../../storage/db');
const dbMock = require('../../storage/db');

const Stack = createNativeStackNavigator<RootStackParamList>();

function TestApp({ provinceId = 'phuket' }: { provinceId?: string }) {
  return (
    <JournalProvider>
      <CheckinProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen
              name="ProvinceDetail"
              component={ProvinceDetailScreen}
              initialParams={{ provinceId }}
            />
            <Stack.Screen name="AddEntry" component={AddEntryScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </CheckinProvider>
    </JournalProvider>
  );
}

describe('ProvinceDetailScreen (US-2 AC3, US-5)', () => {
  beforeEach(() => {
    dbMock.__seed([]);
    dbMock.__seedCheckins([]);
  });

  it('shows the Thai province name (nameTh) as the main heading (US-5 AC1)', async () => {
    await render(<TestApp provinceId="phuket" />);
    await waitFor(() => expect(screen.getByText('ภูเก็ต')).toBeTruthy());
  });

  it('shows an empty state with a CTA to add the first entry when a locked province has no entries (US-2 AC3, US-5 AC4)', async () => {
    await render(<TestApp provinceId="phuket" />);
    await waitFor(() => expect(screen.getByText('ยังไม่มีบันทึกของจังหวัดนี้')).toBeTruthy());
    const cta = screen.getByText('+ เพิ่มบันทึกใหม่');
    fireEvent.press(cta);
    // Should navigate into AddEntry (not a dead-end / error) and be ready to add the first entry.
    await waitFor(() => expect(screen.getByText('ชื่อสถานที่ *')).toBeTruthy());
  });

  it('lists entries sorted reverse-chronologically (latest first) with title/date/thumbnail (US-5 AC2/AC3)', async () => {
    dbMock.__seed([
      { id: 'old', provinceId: 'phuket', date: '2026-01-01', title: 'ทริปแรก', notes: '', photoUris: [], tags: [] },
      {
        id: 'new',
        provinceId: 'phuket',
        date: '2026-06-01',
        title: 'ทริปล่าสุด',
        notes: '',
        photoUris: ['file://photo.jpg'],
        tags: [],
      },
    ]);
    await render(<TestApp provinceId="phuket" />);
    await waitFor(() => expect(screen.getByText('ทริปล่าสุด')).toBeTruthy());
    expect(screen.getByText('ทริปแรก')).toBeTruthy();

    // Reverse-chronological order: the newer trip's title should appear before the older one.
    const allTexts: string[] = [];
    function collect(node: any) {
      if (!node) return;
      if (typeof node === 'string') {
        allTexts.push(node);
        return;
      }
      if (Array.isArray(node)) {
        node.forEach(collect);
        return;
      }
      if (node.children) collect(node.children);
    }
    const view = screen.toJSON();
    collect(view);
    const newIndex = allTexts.indexOf('ทริปล่าสุด');
    const oldIndex = allTexts.indexOf('ทริปแรก');
    expect(newIndex).toBeGreaterThanOrEqual(0);
    expect(oldIndex).toBeGreaterThanOrEqual(0);
    expect(newIndex).toBeLessThan(oldIndex);
  });

  it('does not show the empty state once at least one entry exists, and shows the "+ เพิ่มบันทึกใหม่" button at the top (US-4 AC1 entry point)', async () => {
    dbMock.__seed([
      { id: 'e1', provinceId: 'phuket', date: '2026-01-01', title: 'ทริป', notes: '', photoUris: [], tags: [] },
    ]);
    await render(<TestApp provinceId="phuket" />);
    await waitFor(() => expect(screen.getByText('ทริป')).toBeTruthy());
    expect(screen.queryByText('ยังไม่มีบันทึกของจังหวัดนี้')).toBeNull();
    expect(screen.getByText('+ เพิ่มบันทึกใหม่')).toBeTruthy();
  });
});
