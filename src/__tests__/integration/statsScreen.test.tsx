// US-6 (stats overview + cross-province timeline) integration tests.
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import StatsScreen from '../../screens/StatsScreen';
import { JournalProvider } from '../../storage/JournalContext';

jest.mock('../../storage/db');
const dbMock = require('../../storage/db');

const Stack = createNativeStackNavigator<RootStackParamList>();

function TestApp() {
  return (
    <JournalProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Stats" component={StatsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </JournalProvider>
  );
}

describe('StatsScreen (US-6)', () => {
  beforeEach(() => {
    dbMock.__seed([]);
  });

  it('shows an appropriate empty state (no NaN/undefined) when there are no entries at all (US-6 AC4)', async () => {
    await render(<TestApp />);
    await waitFor(() =>
      expect(screen.getByText('ยังไม่มีบันทึกการเดินทางเลย เริ่มบันทึกทริปแรกได้จากแผนที่')).toBeTruthy()
    );
    expect(screen.queryByText(/NaN/)).toBeNull();
    expect(screen.queryByText(/undefined/)).toBeNull();
  });

  it('shows unlocked count vs 76 and total entry count matching storage data (US-6 AC1)', async () => {
    dbMock.__seed([
      { id: 'e1', provinceId: 'phuket', date: '2026-01-01', title: 'A', notes: '', photoUris: [], tags: [] },
      { id: 'e2', provinceId: 'phuket', date: '2026-02-01', title: 'B', notes: '', photoUris: [], tags: [] },
      { id: 'e3', provinceId: 'chiang-mai', date: '2026-03-01', title: 'C', notes: '', photoUris: [], tags: [] },
    ]);
    await render(<TestApp />);
    // 2 distinct provinces unlocked (phuket, chiang-mai), 3 total entries.
    await waitFor(() => expect(screen.getByText('ปลดล็อกแล้ว 2 / 76 จังหวัด')).toBeTruthy());
    expect(screen.getByText('บันทึกทั้งหมด 3 รายการ')).toBeTruthy();
  });

  it('computes and shows the top region in Thai based on province.region (US-6 AC2)', async () => {
    // phuket + krabi are both 'south' region provinces in the dataset -> south should be top.
    dbMock.__seed([
      { id: 'e1', provinceId: 'phuket', date: '2026-01-01', title: 'A', notes: '', photoUris: [], tags: [] },
      { id: 'e2', provinceId: 'krabi', date: '2026-02-01', title: 'B', notes: '', photoUris: [], tags: [] },
      { id: 'e3', provinceId: 'chiang-mai', date: '2026-03-01', title: 'C', notes: '', photoUris: [], tags: [] },
    ]);
    await render(<TestApp />);
    await waitFor(() => expect(screen.getByText('ไปเยือนภาคใต้มากที่สุด')).toBeTruthy());
  });

  it('shows a cross-province timeline sorted latest-first, each item identifying its province (US-6 AC3)', async () => {
    dbMock.__seed([
      { id: 'old', provinceId: 'chiang-mai', date: '2026-01-01', title: 'เที่ยวเชียงใหม่', notes: '', photoUris: [], tags: [] },
      { id: 'new', provinceId: 'phuket', date: '2026-06-01', title: 'เที่ยวภูเก็ต', notes: '', photoUris: [], tags: [] },
    ]);
    await render(<TestApp />);
    await waitFor(() => expect(screen.getByText('เที่ยวภูเก็ต')).toBeTruthy());
    expect(screen.getByText('เที่ยวเชียงใหม่')).toBeTruthy();
    // province name badges identifying which province each timeline item belongs to
    expect(screen.getByText('ภูเก็ต')).toBeTruthy();
    expect(screen.getByText('เชียงใหม่')).toBeTruthy();

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
    collect(screen.toJSON());
    expect(allTexts.indexOf('เที่ยวภูเก็ต')).toBeLessThan(allTexts.indexOf('เที่ยวเชียงใหม่'));
  });
});
