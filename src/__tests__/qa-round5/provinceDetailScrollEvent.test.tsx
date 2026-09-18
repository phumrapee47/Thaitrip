// Independent Tester (QA round 5) — see provinceDetailScrollContainer.test.tsx
// for the full root-cause writeup. This file confirms the body container is
// actually interactive/scrollable (accepts a native scroll event), not just
// structurally a ScrollView tag with no wiring.

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import ProvinceDetailScreen from '../../screens/ProvinceDetailScreen';
import { JournalProvider } from '../../storage/JournalContext';
import { CheckinProvider } from '../../storage/CheckinContext';

// Recursively walk the react-test-renderer JSON tree (from `.toJSON()`) and
// collect every host node, so this test can inspect real rendered props of
// native components (ScrollView, FlatList's underlying VirtualizedList, etc.)
// instead of only what our own component code passed in JSX.
function collectHostNodes(node: any, acc: any[] = []): any[] {
  if (!node) return acc;
  if (Array.isArray(node)) {
    node.forEach((n) => collectHostNodes(n, acc));
    return acc;
  }
  if (node.type) acc.push(node);
  if (node.children) collectHostNodes(node.children, acc);
  return acc;
}


jest.mock('../../storage/db');
const dbMock = require('../../storage/db');

jest.mock('../../services/wikipediaService', () => ({
  fetchAttractionsForProvince: jest.fn().mockResolvedValue([]),
  searchAttractionsGlobal: jest.fn().mockResolvedValue([]),
  resolveRealPhotoForLandmark: jest.fn().mockResolvedValue(null),
  detectCategory: jest.fn().mockReturnValue('สถานที่ท่องเที่ยว'),
}));

const PROVINCE_ID = 'bangkok-metropolis';

describe('Bug fix 2 (รอบ 14): ProvinceDetailScreen body ScrollView accepts scroll events', () => {
  it('firing a scroll event on the body ScrollView (contentOffset beyond the first screen) is accepted without throwing', async () => {
    dbMock.__seedCheckins([]);
    dbMock.__seed(
      Array.from({ length: 15 }, (_, i) => ({
        id: `entry-${i}`,
        provinceId: PROVINCE_ID,
        date: '2024-01-01',
        title: `บันทึก ${i}`,
        notes: '',
        photoUris: [],
        tags: [],
      }))
    );

    const utils = await render(
      <JournalProvider>
        <CheckinProvider>
          <NavigationContainer>
            <ProvinceDetailScreen
              route={{ key: 'pd', name: 'ProvinceDetail', params: { provinceId: PROVINCE_ID } } as any}
              navigation={{ navigate: jest.fn(), goBack: jest.fn() } as any}
            />
          </NavigationContainer>
        </CheckinProvider>
      </JournalProvider>
    );
    await waitFor(() => expect(screen.getAllByText(/บันทึก \d+/).length).toBeGreaterThan(0));

    const hostNodes = collectHostNodes(utils.toJSON());
    const bodyScrollView = hostNodes.find(
      (n) => /scrollview/i.test(n.type) && n.props.keyboardShouldPersistTaps === 'handled'
    );
    expect(bodyScrollView).toBeTruthy();

    // A plain View has no `onScroll`/scroll-responder wiring at all; only a
    // real ScrollView host accepts a scroll native-event without throwing.
    expect(() =>
      fireEvent.scroll(bodyScrollView, {
        nativeEvent: {
          contentOffset: { y: 1200, x: 0 },
          contentSize: { height: 2400, width: 400 },
          layoutMeasurement: { height: 800, width: 400 },
        },
      })
    ).not.toThrow();
  });
});
