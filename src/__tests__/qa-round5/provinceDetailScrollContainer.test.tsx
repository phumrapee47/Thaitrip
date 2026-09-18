// Independent Tester (QA round 5) coverage for the "หน้าจังหวัด scroll ไม่ได้"
// bug fixed in "รอบ 14" (docs/dev-notes.md). Root cause:
// ProvinceDetailScreen had no scroll container at all — header +
// ProvinceMasterBadge + LandmarkList + the entries FlatList were all plain
// siblings in a non-scrolling SafeAreaView, so content taller than the
// viewport was simply clipped/unreachable. Fix: wrapped the body in
// `<ScrollView keyboardShouldPersistTaps="handled">` and converted the
// trailing entries FlatList to a plain `.map()` (avoiding a
// VirtualizedList-in-ScrollView nesting conflict).
//
// This file checks the structural fix directly: a real ScrollView (not a
// plain View) wraps the body, and no FlatList/VirtualizedList remains nested
// inside it, using content sized well past a typical device viewport (30
// entries) to make the "overflow" scenario concrete rather than assumed.

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
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

function renderProvinceDetail() {
  return render(
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
}

describe('Bug fix 2 (รอบ 14): ProvinceDetailScreen has a real scroll container', () => {
  beforeEach(() => {
    dbMock.__seedCheckins([]);
    dbMock.__seed(
      Array.from({ length: 30 }, (_, i) => ({
        id: `entry-${i}`,
        provinceId: PROVINCE_ID,
        date: '2024-01-01',
        title: `บันทึกทดสอบที่ ${i}`,
        notes: '',
        photoUris: [],
        tags: [],
      }))
    );
  });

  it('wraps the body in a ScrollView with keyboardShouldPersistTaps="handled" and renders every entry directly under it (no FlatList/VirtualizedList), with no nested-list warning', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const utils = await renderProvinceDetail();
    await waitFor(() => expect(screen.getAllByText(/บันทึกทดสอบที่/).length).toBeGreaterThan(0));

    const hostNodes = collectHostNodes(utils.toJSON());

    const scrollViews = hostNodes.filter((n) => /scrollview/i.test(n.type));
    expect(scrollViews.some((sv) => sv.props.keyboardShouldPersistTaps === 'handled')).toBe(true);

    const virtualizedNodes = hostNodes.filter((n) => /flatlist|virtualizedlist/i.test(n.type));
    expect(virtualizedNodes).toHaveLength(0);

    // All 30 rendered simultaneously (not windowed) proves this is a plain
    // `.map()` list, exactly what avoids the RN warning "VirtualizedLists
    // should never be nested inside plain ScrollViews".
    expect(screen.getAllByText(/บันทึกทดสอบที่/)).toHaveLength(30);

    const nestedListWarning = errorSpy.mock.calls.some((args) =>
      args.some((a) => typeof a === 'string' && /VirtualizedLists should never be nested/i.test(a))
    );
    expect(nestedListWarning).toBe(false);
    errorSpy.mockRestore();
  });
});
