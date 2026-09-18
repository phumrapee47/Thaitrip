// Independent Tester follow-up (US-34 AC2 verify round 2) — StatsScreen
// counterpart of newsScreenNavigatorFiberDump.test.tsx. Confirms via RNTL's
// official `toJSON()` snapshot (not the project's custom fiber-walk counter,
// which also reports 0 for this screen through a real navigator per
// dev-notes.md) that EntranceFadeItem's Animated.View wrapper is genuinely
// mounted around timeline entries when StatsScreen is rendered through a
// real NavigationContainer/Stack.Navigator.
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import StatsScreen from '../../screens/StatsScreen';
import { JournalProvider } from '../../storage/JournalContext';
import type { RootStackParamList } from '../../navigation/types';

jest.mock('../../storage/db');
const dbMock = require('../../storage/db');

// Same ground-truth signature as newsScreenNavigatorFiberDump.test.tsx: an
// EntranceFadeItem's Animated.View starts as
// `{ opacity: 0, transform: [{ translateY: 12 }] }` before the animation
// advances. No other component in StatsScreen's tree produces this exact
// style shape.
function countEntranceFadeItemHostNodesViaJSON(node: any): number {
  if (!node) return 0;
  let count = 0;
  const style = node.props?.style;
  const flatStyle = Array.isArray(style) ? Object.assign({}, ...style.filter(Boolean)) : style;
  if (
    flatStyle &&
    typeof flatStyle === 'object' &&
    'opacity' in flatStyle &&
    Array.isArray(flatStyle.transform) &&
    flatStyle.transform.some((t: any) => t && typeof t === 'object' && 'translateY' in t)
  ) {
    count += 1;
  }
  const children = node.children;
  if (Array.isArray(children)) {
    for (const child of children) {
      count += countEntranceFadeItemHostNodesViaJSON(child);
    }
  }
  return count;
}

const Stack = createNativeStackNavigator<RootStackParamList>();
function StatsTestApp() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Stats" component={StatsScreen} />
        <Stack.Screen name="ProvinceDetail" component={() => null} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

describe('US-34 AC2 verify round 2 — ground-truth check (toJSON) for StatsScreen through a real navigator', () => {
  it('confirms via RNTL toJSON() that EntranceFadeItem is genuinely mounted around both timeline entries when StatsScreen is rendered through a real NavigationContainer/Stack.Navigator', async () => {
    dbMock.__seed([
      {
        id: 'e1', provinceId: 'phuket', date: '2026-01-01', title: 'ทริปภูเก็ต', notes: '', photoUris: [], tags: [],
        updatedAt: '2026-01-01T00:00:00.000Z', syncedAt: null, cloudId: null, retryCount: 0, placeLat: null, placeLng: null,
      },
      {
        id: 'e2', provinceId: 'chiang-mai', date: '2026-02-01', title: 'ทริปเชียงใหม่', notes: '', photoUris: [], tags: [],
        updatedAt: '2026-02-01T00:00:00.000Z', syncedAt: null, cloudId: null, retryCount: 0, placeLat: null, placeLng: null,
      },
    ]);

    await render(
      <JournalProvider>
        <StatsTestApp />
      </JournalProvider>
    );
    await waitFor(() => expect(screen.getByText('ทริปภูเก็ต')).toBeTruthy());
    await waitFor(() => expect(screen.getByText('ทริปเชียงใหม่')).toBeTruthy());

    const tree = screen.toJSON();
    const count = countEntranceFadeItemHostNodesViaJSON(tree);
    expect(count).toBe(2);
  });
});
