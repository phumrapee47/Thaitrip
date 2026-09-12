// QA round 3 (US-19 AC4, US-10 AC3) — independent test proving the Nominatim
// search selection (T71) and the curated Top-Landmark dropdown (T47) are two
// genuinely separate mechanisms, exercised TOGETHER in a single save on a
// province that has BOTH curated landmarks and a Nominatim result available
// (phuket). This is the single most important AC of this round per the
// tester brief: selecting a search result must never create a Landmark and
// must never trigger auto check-in — verified here by proving auto check-in
// ONLY happens for the landmark chosen from the T47 dropdown, while the
// search-selected place contributes nothing but title/placeLat/placeLng.
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import AddEntryScreen from '../../screens/AddEntryScreen';
import { JournalProvider } from '../../storage/JournalContext';
import { CheckinProvider } from '../../storage/CheckinContext';
import { LANDMARKS } from '../../data/thailand-landmarks';
import { DEBOUNCE_MS } from '../../lib/nominatimClient';

jest.mock('../../storage/db');
jest.mock('../../lib/nominatimClient', () => {
  const actual = jest.requireActual('../../lib/nominatimClient');
  return { ...actual, searchPlaces: jest.fn() };
});

const dbMock = require('../../storage/db');
const nominatimMock = require('../../lib/nominatimClient');

const Stack = createNativeStackNavigator<RootStackParamList>();

function TestApp() {
  return (
    <JournalProvider>
      <CheckinProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="AddEntry" component={AddEntryScreen} initialParams={{ provinceId: 'phuket' }} />
          </Stack.Navigator>
        </NavigationContainer>
      </CheckinProvider>
    </JournalProvider>
  );
}

const WAIT_OPTS = { timeout: DEBOUNCE_MS + 3000 };

// Each fireEvent below is awaited inside its own act() — calling two fireEvent
// interactions back-to-back with no await between them was observed to produce
// "overlapping act() calls" (React 19 + @testing-library/react-native's async
// act scopes) that left the second interaction's event handler not actually
// wired up, even though nothing threw. Every prior test file in this repo
// happens to only ever fire one interaction before the next `waitFor`/assert,
// which is why this wasn't caught until this test intentionally does two
// separate selections (landmark dropdown + search) in sequence.
async function press(text: string): Promise<void> {
  await act(async () => {
    fireEvent.press(screen.getByText(text));
  });
}

async function changeText(placeholder: string, text: string): Promise<void> {
  await act(async () => {
    fireEvent.changeText(screen.getByPlaceholderText(placeholder), text);
  });
}

describe('Search Place (US-19) vs curated Landmark dropdown (US-10) stay fully independent, even combined in one save', () => {
  beforeEach(() => {
    dbMock.__seed([]);
    dbMock.__seedCheckins([]);
    nominatimMock.searchPlaces.mockReset();
  });

  it('choosing a curated landmark from the dropdown AND a Nominatim search result in the same entry: only the dropdown landmark gets auto checked-in; the search result creates no Landmark and no check-in of its own', async () => {
    const landmarksBefore = LANDMARKS.length;

    nominatimMock.searchPlaces.mockResolvedValue([
      {
        displayName: 'ร้านกาแฟริมทะเล, ภูเก็ต, ประเทศไทย',
        shortLabel: 'ร้านกาแฟริมทะเล',
        lat: 7.95,
        lng: 98.34,
      },
    ]);

    await render(<TestApp />);

    // 1) Pick a CURATED landmark from the T47 dropdown chip row.
    await press('พระใหญ่ภูเก็ต');

    // 2) ALSO use the independent search field to find an uncurated place and
    //    select it — this overwrites the title and attaches placeLat/placeLng,
    //    but must never touch the landmark/check-in mechanism above.
    await changeText('ค้นหาชื่อสถานที่ เช่น ร้านกาแฟ, จุดชมวิว...', 'ร้านกาแฟริมทะเล');
    await waitFor(() => expect(screen.getByText('ร้านกาแฟริมทะเล')).toBeTruthy(), WAIT_OPTS);
    await press('ร้านกาแฟริมทะเล');
    await waitFor(() => expect(screen.getByText(/อ้างอิงพิกัดจาก/)).toBeTruthy(), WAIT_OPTS);

    await press('บันทึก');
    await waitFor(() => expect(dbMock.__getStore()).toHaveLength(1));

    const savedEntry = dbMock.__getStore()[0];
    // Title/place metadata came from the SEARCH selection (overwrote whatever
    // was there), never from the curated landmark's own name.
    expect(savedEntry.title).toBe('ร้านกาแฟริมทะเล');
    expect(savedEntry.placeLat).toBe(7.95);
    expect(savedEntry.placeLng).toBe(98.34);

    // Auto check-in fired for exactly the DROPDOWN landmark (hkt-big-buddha),
    // not for the searched place, and not a duplicate/second record.
    const checkins = dbMock.__getCheckinStore();
    expect(checkins).toHaveLength(1);
    expect(checkins[0]).toEqual(
      expect.objectContaining({ landmarkId: 'hkt-big-buddha', provinceId: 'phuket', visited: true })
    );

    // No new Landmark was created in the seed dataset as a side effect of the
    // search selection (the module-level LANDMARKS array is immutable at
    // runtime, but this guards against any future code path that might try).
    expect(LANDMARKS.length).toBe(landmarksBefore);
  }, 15000);

  it('using ONLY the search field (no dropdown selection) on a province that DOES have curated landmarks still results in zero check-ins', async () => {
    nominatimMock.searchPlaces.mockResolvedValue([
      { displayName: 'จุดที่ไม่ใช่ Landmark, ภูเก็ต, ประเทศไทย', shortLabel: 'จุดที่ไม่ใช่ Landmark', lat: 1, lng: 2 },
    ]);
    await render(<TestApp />);

    // Deliberately leave the dropdown at its default "ไม่ระบุ" (unset).
    await changeText('ค้นหาชื่อสถานที่ เช่น ร้านกาแฟ, จุดชมวิว...', 'จุดที่ไม่ใช่');
    await waitFor(() => expect(screen.getByText('จุดที่ไม่ใช่ Landmark')).toBeTruthy(), WAIT_OPTS);
    await press('จุดที่ไม่ใช่ Landmark');
    await waitFor(() => expect(screen.getByText(/อ้างอิงพิกัดจาก/)).toBeTruthy(), WAIT_OPTS);

    await press('บันทึก');
    await waitFor(() => expect(dbMock.__getStore()).toHaveLength(1));

    expect(dbMock.__getCheckinStore()).toHaveLength(0);
  }, 15000);
});
