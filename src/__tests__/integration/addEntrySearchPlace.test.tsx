// T70/T71/T72/T73/T74 / US-19, US-20: Search Place Field end-to-end through
// AddEntryScreen. `searchPlaces` (T68) is mocked at the module boundary so
// these tests control results/errors deterministically without any network
// access; DEBOUNCE_MS/MIN_QUERY_LENGTH stay real so the debounce behavior
// itself is exercised (accepting ~1s real wall time per debounce-triggering
// test, same trade-off as src/lib/nominatimClient.test.ts's throttle test).
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import AddEntryScreen from '../../screens/AddEntryScreen';
import { JournalProvider } from '../../storage/JournalContext';
import { CheckinProvider } from '../../storage/CheckinContext';
import { DEBOUNCE_MS } from '../../lib/nominatimClient';

jest.mock('../../storage/db');
jest.mock('../../lib/nominatimClient', () => {
  const actual = jest.requireActual('../../lib/nominatimClient');
  return { ...actual, searchPlaces: jest.fn() };
});

const dbMock = require('../../storage/db');
const nominatimMock = require('../../lib/nominatimClient');

const Stack = createNativeStackNavigator<RootStackParamList>();

function TestApp({ provinceId = 'phuket' }: { provinceId?: string }) {
  return (
    <JournalProvider>
      <CheckinProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="AddEntry" component={AddEntryScreen} initialParams={{ provinceId }} />
          </Stack.Navigator>
        </NavigationContainer>
      </CheckinProvider>
    </JournalProvider>
  );
}

const WAIT_OPTS = { timeout: DEBOUNCE_MS + 3000 };

describe('AddEntryScreen Search Place Field (US-19/US-20)', () => {
  beforeEach(() => {
    dbMock.__seed([]);
    dbMock.__seedCheckins([]);
    nominatimMock.searchPlaces.mockReset();
  });

  it('debounces typing, shows results, and prefilling from a selection overwrites title + attaches placeLat/placeLng on save (US-19 AC1/AC3/AC4)', async () => {
    nominatimMock.searchPlaces.mockResolvedValue([
      { displayName: 'วัดพระธาตุดอยคำ, เชียงใหม่, ประเทศไทย', shortLabel: 'วัดพระธาตุดอยคำ', lat: 18.7, lng: 98.9 },
    ]);
    await render(<TestApp />);

    fireEvent.changeText(screen.getByPlaceholderText('ชื่อสถานที่'), 'ชื่อเดิม');
    await waitFor(() => expect(screen.getByDisplayValue('ชื่อเดิม')).toBeTruthy());

    fireEvent.changeText(screen.getByPlaceholderText('ค้นหาชื่อสถานที่ เช่น ร้านกาแฟ, จุดชมวิว...'), 'ดอยคำ');
    // Below MIN_QUERY_LENGTH would skip search — 'ดอยคำ' is long enough, so this
    // should fire searchPlaces after the debounce window.
    await waitFor(() => expect(nominatimMock.searchPlaces).toHaveBeenCalledWith('ดอยคำ'), WAIT_OPTS);
    await waitFor(() => expect(screen.getByText('วัดพระธาตุดอยคำ')).toBeTruthy(), WAIT_OPTS);

    fireEvent.press(screen.getByText('วัดพระธาตุดอยคำ'));

    // Title is overwritten by the selected result's short label.
    await waitFor(() => expect(screen.getByDisplayValue('วัดพระธาตุดอยคำ')).toBeTruthy());
    // Confirmation chip appears, dropdown/search input collapses.
    expect(screen.getByText(/อ้างอิงพิกัดจาก/)).toBeTruthy();
    expect(screen.queryByPlaceholderText('ค้นหาชื่อสถานที่ เช่น ร้านกาแฟ, จุดชมวิว...')).toBeNull();

    fireEvent.press(screen.getByText('บันทึก'));
    await waitFor(() => expect(dbMock.__getStore()).toHaveLength(1));
    const saved = dbMock.__getStore()[0];
    expect(saved.title).toBe('วัดพระธาตุดอยคำ');
    expect(saved.placeLat).toBe(18.7);
    expect(saved.placeLng).toBe(98.9);
  }, 15000);

  it('selecting a search result never creates a Landmark or auto check-in (PM decision ประเด็น 11)', async () => {
    nominatimMock.searchPlaces.mockResolvedValue([
      { displayName: 'ร้านกาแฟทดสอบ, ภูเก็ต, ประเทศไทย', shortLabel: 'ร้านกาแฟทดสอบ', lat: 7.9, lng: 98.3 },
    ]);
    await render(<TestApp provinceId="phuket" />);

    fireEvent.changeText(screen.getByPlaceholderText('ค้นหาชื่อสถานที่ เช่น ร้านกาแฟ, จุดชมวิว...'), 'ร้านกาแฟ');
    await waitFor(() => expect(screen.getByText('ร้านกาแฟทดสอบ')).toBeTruthy(), WAIT_OPTS);
    fireEvent.press(screen.getByText('ร้านกาแฟทดสอบ'));
    await waitFor(() => expect(screen.getByText(/อ้างอิงพิกัดจาก/)).toBeTruthy());

    fireEvent.press(screen.getByText('บันทึก'));
    await waitFor(() => expect(dbMock.__getStore()).toHaveLength(1));

    // No landmark check-in was ever touched by the search selection alone.
    expect(dbMock.__getCheckinStore()).toHaveLength(0);
  }, 15000);

  it('the "×" on the confirmation chip clears only the attached metadata, never the title text (design-spec)', async () => {
    nominatimMock.searchPlaces.mockResolvedValue([
      { displayName: 'สถานที่ทดสอบ, ภูเก็ต, ประเทศไทย', shortLabel: 'สถานที่ทดสอบ', lat: 1, lng: 2 },
    ]);
    await render(<TestApp />);

    fireEvent.changeText(screen.getByPlaceholderText('ค้นหาชื่อสถานที่ เช่น ร้านกาแฟ, จุดชมวิว...'), 'สถานที่');
    await waitFor(() => expect(screen.getByText('สถานที่ทดสอบ')).toBeTruthy(), WAIT_OPTS);
    fireEvent.press(screen.getByText('สถานที่ทดสอบ'));
    await waitFor(() => expect(screen.getByText(/อ้างอิงพิกัดจาก/)).toBeTruthy());

    fireEvent.press(screen.getByText('×'));
    await waitFor(() => expect(screen.queryByText(/อ้างอิงพิกัดจาก/)).toBeNull());
    // Title (which was prefilled) stays exactly as it was — not cleared.
    expect(screen.getByDisplayValue('สถานที่ทดสอบ')).toBeTruthy();

    fireEvent.press(screen.getByText('บันทึก'));
    await waitFor(() => expect(dbMock.__getStore()).toHaveLength(1));
    const saved = dbMock.__getStore()[0];
    expect(saved.title).toBe('สถานที่ทดสอบ');
    expect(saved.placeLat).toBeNull();
    expect(saved.placeLng).toBeNull();
  }, 15000);

  it('shows a friendly error + working "ลองอีกครั้ง" retry when the search fails (US-20 AC3)', async () => {
    nominatimMock.searchPlaces.mockRejectedValueOnce(new Error('offline'));
    nominatimMock.searchPlaces.mockResolvedValueOnce([
      { displayName: 'กู้คืนสำเร็จ, ภูเก็ต, ประเทศไทย', shortLabel: 'กู้คืนสำเร็จ', lat: 1, lng: 1 },
    ]);
    await render(<TestApp />);

    fireEvent.changeText(screen.getByPlaceholderText('ค้นหาชื่อสถานที่ เช่น ร้านกาแฟ, จุดชมวิว...'), 'ล้มเหลว');
    await waitFor(() => expect(screen.getByText(/ค้นหาไม่ได้ในขณะนี้/)).toBeTruthy(), WAIT_OPTS);

    fireEvent.press(screen.getByText('ลองอีกครั้ง'));
    await waitFor(() => expect(screen.getByText('กู้คืนสำเร็จ')).toBeTruthy(), WAIT_OPTS);
    expect(nominatimMock.searchPlaces).toHaveBeenCalledTimes(2);
  }, 15000);

  it('shows "ไม่พบสถานที่ที่ค้นหา" when the search returns no results (US-20 AC4)', async () => {
    nominatimMock.searchPlaces.mockResolvedValue([]);
    await render(<TestApp />);

    fireEvent.changeText(screen.getByPlaceholderText('ค้นหาชื่อสถานที่ เช่น ร้านกาแฟ, จุดชมวิว...'), 'ไม่มีจริง');
    await waitFor(() => expect(screen.getByText('ไม่พบสถานที่ที่ค้นหา')).toBeTruthy(), WAIT_OPTS);
  }, 15000);

  it('a totally broken search never blocks manually typing the title and saving normally (US-20 AC6 / T74 failure isolation)', async () => {
    nominatimMock.searchPlaces.mockRejectedValue(new Error('search subsystem down'));
    await render(<TestApp />);

    fireEvent.changeText(screen.getByPlaceholderText('ค้นหาชื่อสถานที่ เช่น ร้านกาแฟ, จุดชมวิว...'), 'ล้มเหลวเสมอ');
    await waitFor(() => expect(screen.getByText(/ค้นหาไม่ได้ในขณะนี้/)).toBeTruthy(), WAIT_OPTS);

    // Save button must still be enabled/functional regardless of search error state.
    fireEvent.changeText(screen.getByPlaceholderText('ชื่อสถานที่'), 'กรอกเองตามปกติ');
    await waitFor(() => expect(screen.getByDisplayValue('กรอกเองตามปกติ')).toBeTruthy());
    fireEvent.press(screen.getByText('บันทึก'));

    await waitFor(() => expect(dbMock.__getStore()).toHaveLength(1));
    const saved = dbMock.__getStore()[0];
    expect(saved.title).toBe('กรอกเองตามปกติ');
    expect(saved.placeLat).toBeNull();
    expect(saved.placeLng).toBeNull();
  }, 15000);

  it('not touching the search field at all keeps placeLat/placeLng null (no regression to plain US-4 save)', async () => {
    await render(<TestApp />);
    fireEvent.changeText(screen.getByPlaceholderText('ชื่อสถานที่'), 'ไม่ใช้ค้นหาเลย');
    await waitFor(() => expect(screen.getByDisplayValue('ไม่ใช้ค้นหาเลย')).toBeTruthy());
    fireEvent.press(screen.getByText('บันทึก'));

    await waitFor(() => expect(dbMock.__getStore()).toHaveLength(1));
    const saved = dbMock.__getStore()[0];
    expect(saved.placeLat).toBeNull();
    expect(saved.placeLng).toBeNull();
    expect(nominatimMock.searchPlaces).not.toHaveBeenCalled();
  });
});
